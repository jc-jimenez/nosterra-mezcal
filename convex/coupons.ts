import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

function assertAdmin(key: string) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) throw new Error("ADMIN_PASSWORD no configurada en Convex");
  if (key !== expected) throw new Error("Contraseña de administrador incorrecta");
}

export function normalizeCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, "");
}

const couponInput = {
  code: v.string(),
  discountType: v.union(v.literal("percent"), v.literal("fixed"), v.literal("freeship")),
  discountValue: v.number(),
  minPurchase: v.number(),
  maxUses: v.number(),
  expiresAt: v.optional(v.number()),
  isActive: v.boolean(),
  note: v.optional(v.string()),
  ambassadorId: v.optional(v.id("ambassadors")),
};

// ─── Validación pública (checkout) ───
export const validate = query({
  args: { code: v.string(), subtotal: v.number() },
  handler: async (ctx, { code, subtotal }) => {
    const c = await ctx.db
      .query("coupons")
      .withIndex("by_code", (q) => q.eq("code", normalizeCode(code)))
      .unique();

    if (!c) return { ok: false as const, error: "Cupón inválido" };
    if (!c.isActive) return { ok: false as const, error: "Este cupón ya no está disponible" };
    if (c.expiresAt && c.expiresAt < Date.now()) return { ok: false as const, error: "Este cupón expiró" };
    if (c.maxUses > 0 && c.usedCount >= c.maxUses) return { ok: false as const, error: "Este cupón alcanzó su límite de usos" };
    if (subtotal < c.minPurchase) {
      return { ok: false as const, error: `Compra mínima de $${c.minPurchase.toLocaleString("es-MX")} para este cupón` };
    }

    let discount = 0;
    let freeShipping = false;
    if (c.discountType === "percent") discount = Math.round((subtotal * c.discountValue) / 100);
    else if (c.discountType === "fixed") discount = Math.min(c.discountValue, subtotal);
    else if (c.discountType === "freeship") freeShipping = true;

    return {
      ok: true as const,
      code: c.code,
      discountType: c.discountType,
      discountValue: c.discountValue,
      discount,
      freeShipping,
      ambassadorId: c.ambassadorId ?? null,
    };
  },
});

// ─── Admin ───
export const listAll = query({
  args: { adminKey: v.string() },
  handler: async (ctx, { adminKey }) => {
    assertAdmin(adminKey);
    return await ctx.db.query("coupons").order("desc").take(200);
  },
});

export const create = mutation({
  args: { adminKey: v.string(), data: v.object(couponInput) },
  handler: async (ctx, { adminKey, data }) => {
    assertAdmin(adminKey);
    const code = normalizeCode(data.code);
    const existing = await ctx.db.query("coupons").withIndex("by_code", (q) => q.eq("code", code)).unique();
    if (existing) throw new Error("Ya existe un cupón con ese código");
    return await ctx.db.insert("coupons", { ...data, code, usedCount: 0 });
  },
});

export const update = mutation({
  args: { adminKey: v.string(), id: v.id("coupons"), data: v.object(couponInput) },
  handler: async (ctx, { adminKey, id, data }) => {
    assertAdmin(adminKey);
    await ctx.db.patch(id, { ...data, code: normalizeCode(data.code) });
  },
});

export const toggle = mutation({
  args: { adminKey: v.string(), id: v.id("coupons"), isActive: v.boolean() },
  handler: async (ctx, { adminKey, id, isActive }) => {
    assertAdmin(adminKey);
    await ctx.db.patch(id, { isActive });
  },
});

export const remove = mutation({
  args: { adminKey: v.string(), id: v.id("coupons") },
  handler: async (ctx, { adminKey, id }) => {
    assertAdmin(adminKey);
    await ctx.db.delete(id);
  },
});
