import { query, mutation, QueryCtx, MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

function assertAdmin(key: string) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) throw new Error("ADMIN_PASSWORD no configurada en Convex");
  if (key !== expected) throw new Error("Contraseña de administrador incorrecta");
}

const DEFAULT_TIERS = { tierNormal: 2, tierPlata: 3, tierOro: 5, customerDiscount: 5 };

async function getTierConfig(ctx: QueryCtx) {
  const s = await ctx.db.query("settings").first();
  return s?.ambassador ?? DEFAULT_TIERS;
}

function commissionForTier(tier: "normal" | "plata" | "oro", cfg: typeof DEFAULT_TIERS) {
  if (tier === "plata") return cfg.tierPlata;
  if (tier === "oro") return cfg.tierOro;
  return cfg.tierNormal;
}

function baseCode(name: string): string {
  const w = name.trim().split(/\s+/)[0]?.toUpperCase().replace(/[^A-Z0-9]/g, "") ?? "";
  return (w || "AMIGO").slice(0, 8);
}

async function uniqueCode(ctx: QueryCtx, name: string): Promise<string> {
  const base = baseCode(name);
  for (let i = 0; i < 30; i++) {
    const code = i === 0 ? base : `${base}${i + 1}`;
    const amb = await ctx.db.query("ambassadors").withIndex("by_code", (q) => q.eq("code", code)).unique();
    const cou = await ctx.db.query("coupons").withIndex("by_code", (q) => q.eq("code", code)).unique();
    if (!amb && !cou) return code;
  }
  return `${base}${Math.floor(Math.random() * 9000) + 1000}`;
}

// ─── Postulación pública ───
export const apply = mutation({
  args: { name: v.string(), email: v.string() },
  handler: async (ctx, { name, email }) => {
    const mail = email.trim().toLowerCase();
    const existing = await ctx.db.query("ambassadors").withIndex("by_email", (q) => q.eq("email", mail)).unique();
    if (existing) {
      return { ok: true as const, alreadyExists: true, code: existing.code, status: existing.status };
    }
    const cfg = await getTierConfig(ctx);
    const code = await uniqueCode(ctx, name);
    await ctx.db.insert("ambassadors", {
      name: name.trim(),
      email: mail,
      code,
      tier: "normal",
      commissionPct: cfg.tierNormal,
      customerDiscountPct: cfg.customerDiscount,
      accruedCommission: 0,
      paidCommission: 0,
      salesCount: 0,
      isActive: false,
      status: "pending",
    });
    return { ok: true as const, alreadyExists: false, code, status: "pending" as const };
  },
});

// Consulta del propio embajador por email (su panel ligero)
export const getByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    const a = await ctx.db
      .query("ambassadors")
      .withIndex("by_email", (q) => q.eq("email", email.trim().toLowerCase()))
      .unique();
    if (!a) return null;
    return {
      name: a.name, code: a.code, tier: a.tier, status: a.status, isActive: a.isActive,
      commissionPct: a.commissionPct, customerDiscountPct: a.customerDiscountPct,
      accruedCommission: a.accruedCommission, paidCommission: a.paidCommission, salesCount: a.salesCount,
    };
  },
});

// Para el servidor (checkout): comisión del embajador asociado a un cupón
export const getCommissionPct = query({
  args: { id: v.id("ambassadors") },
  handler: async (ctx, { id }) => {
    const a = await ctx.db.get(id);
    return a && a.isActive ? a.commissionPct : 0;
  },
});

// ─── Admin ───
export const listAll = query({
  args: { adminKey: v.string() },
  handler: async (ctx, { adminKey }) => {
    assertAdmin(adminKey);
    return await ctx.db.query("ambassadors").order("desc").take(200);
  },
});

async function createAmbassadorCoupon(ctx: { db: MutationCtx["db"] }, ambId: Id<"ambassadors">, code: string, discountPct: number, name: string) {
  const existing = await ctx.db.query("coupons").withIndex("by_code", (q) => q.eq("code", code)).unique();
  if (existing) {
    await ctx.db.patch(existing._id, { isActive: true, discountType: "percent" as const, discountValue: discountPct, ambassadorId: ambId });
    return;
  }
  await ctx.db.insert("coupons", {
    code,
    discountType: "percent",
    discountValue: discountPct,
    minPurchase: 0,
    maxUses: 0,
    usedCount: 0,
    isActive: true,
    note: `Embajador: ${name}`,
    ambassadorId: ambId,
  });
}

export const approve = mutation({
  args: { adminKey: v.string(), id: v.id("ambassadors") },
  handler: async (ctx, { adminKey, id }) => {
    assertAdmin(adminKey);
    const a = await ctx.db.get(id);
    if (!a) throw new Error("Embajador no encontrado");
    await ctx.db.patch(id, { status: "active", isActive: true });
    await createAmbassadorCoupon(ctx, id, a.code, a.customerDiscountPct, a.name);
    return { code: a.code };
  },
});

export const reject = mutation({
  args: { adminKey: v.string(), id: v.id("ambassadors") },
  handler: async (ctx, { adminKey, id }) => {
    assertAdmin(adminKey);
    const a = await ctx.db.get(id);
    if (!a) return;
    await ctx.db.patch(id, { status: "rejected", isActive: false });
    const coupon = await ctx.db.query("coupons").withIndex("by_code", (q) => q.eq("code", a.code)).unique();
    if (coupon) await ctx.db.patch(coupon._id, { isActive: false });
  },
});

export const setTier = mutation({
  args: { adminKey: v.string(), id: v.id("ambassadors"), tier: v.union(v.literal("normal"), v.literal("plata"), v.literal("oro")) },
  handler: async (ctx, { adminKey, id, tier }) => {
    assertAdmin(adminKey);
    const cfg = await getTierConfig(ctx);
    await ctx.db.patch(id, { tier, commissionPct: commissionForTier(tier, cfg) });
  },
});

export const setCommission = mutation({
  args: { adminKey: v.string(), id: v.id("ambassadors"), commissionPct: v.number(), customerDiscountPct: v.number() },
  handler: async (ctx, { adminKey, id, commissionPct, customerDiscountPct }) => {
    assertAdmin(adminKey);
    const a = await ctx.db.get(id);
    if (!a) return;
    await ctx.db.patch(id, { commissionPct, customerDiscountPct });
    // Actualizar el descuento del cupón del embajador
    const coupon = await ctx.db.query("coupons").withIndex("by_code", (q) => q.eq("code", a.code)).unique();
    if (coupon) await ctx.db.patch(coupon._id, { discountValue: customerDiscountPct });
  },
});

// Paga la comisión acumulada generando un cupón de monto fijo para el embajador
export const payCommission = mutation({
  args: { adminKey: v.string(), id: v.id("ambassadors") },
  handler: async (ctx, { adminKey, id }) => {
    assertAdmin(adminKey);
    const a = await ctx.db.get(id);
    if (!a) throw new Error("Embajador no encontrado");
    const amount = Math.floor(a.accruedCommission);
    if (amount <= 0) return { code: null, amount: 0 };

    const code = `PAGO-${a.code}-${Math.floor(Math.random() * 9000) + 1000}`;
    await ctx.db.insert("coupons", {
      code,
      discountType: "fixed",
      discountValue: amount,
      minPurchase: 0,
      maxUses: 1,
      usedCount: 0,
      isActive: true,
      note: `Pago de comisión a ${a.name}`,
    });
    await ctx.db.patch(id, { paidCommission: a.paidCommission + amount, accruedCommission: 0 });
    return { code, amount };
  },
});

export const remove = mutation({
  args: { adminKey: v.string(), id: v.id("ambassadors") },
  handler: async (ctx, { adminKey, id }) => {
    assertAdmin(adminKey);
    const a = await ctx.db.get(id);
    if (a) {
      const coupon = await ctx.db.query("coupons").withIndex("by_code", (q) => q.eq("code", a.code)).unique();
      if (coupon) await ctx.db.delete(coupon._id);
    }
    await ctx.db.delete(id);
  },
});
