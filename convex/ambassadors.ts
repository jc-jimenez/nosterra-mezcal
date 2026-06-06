import { query, mutation, QueryCtx, MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";

function assertAdmin(key: string) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) throw new Error("ADMIN_PASSWORD no configurada en Convex");
  if (key !== expected) throw new Error("Contraseña de administrador incorrecta");
}

type Tier = "normal" | "plata" | "oro";

const DEFAULT_TIERS = {
  tierNormal: 2,
  tierPlata: 3,
  tierOro: 5,
  customerDiscount: 5,
  thresholdMetric: "sales" as "sales" | "amount",
  plataMin: 10,
  oroMin: 25,
};

async function getTierConfig(ctx: QueryCtx) {
  const s = await ctx.db.query("settings").first();
  return { ...DEFAULT_TIERS, ...(s?.ambassador ?? {}) };
}

function commissionForTier(tier: Tier, cfg: typeof DEFAULT_TIERS) {
  if (tier === "plata") return cfg.tierPlata;
  if (tier === "oro") return cfg.tierOro;
  return cfg.tierNormal;
}

// Porcentaje máximo de la comisión que se puede cobrar en EFECTIVO según el nivel
function maxCashPctForTier(tier: Tier): number {
  if (tier === "oro") return 1; // 100% libre
  if (tier === "plata") return 0.5; // hasta 50% en efectivo
  return 0; // normal: solo producto (cupón)
}

// Nivel que corresponde a un embajador según métrica/umbrales configurados
function tierForProgress(salesCount: number, salesAmount: number, cfg: typeof DEFAULT_TIERS): Tier {
  const value = cfg.thresholdMetric === "amount" ? salesAmount : salesCount;
  if (value >= cfg.oroMin) return "oro";
  if (value >= cfg.plataMin) return "plata";
  return "normal";
}

function genPin(): string {
  return String(Math.floor(100000 + Math.random() * 900000)); // 6 dígitos
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
// Obligatorios: nombre, apellidoPaterno, apellidoMaterno, email, whatsapp. El resto opcional.
export const apply = mutation({
  args: {
    nombre: v.string(),
    apellidoPaterno: v.string(),
    apellidoMaterno: v.string(),
    email: v.string(),
    whatsapp: v.string(),
    phone: v.optional(v.string()),
    rfc: v.optional(v.string()),
    curp: v.optional(v.string()),
    address: v.optional(
      v.object({
        calle: v.optional(v.string()),
        numero: v.optional(v.string()),
        colonia: v.optional(v.string()),
        cp: v.optional(v.string()),
        ciudad: v.optional(v.string()),
        estado: v.optional(v.string()),
        pais: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const mail = args.email.trim().toLowerCase();
    const fullName = [args.nombre, args.apellidoPaterno, args.apellidoMaterno]
      .map((s) => s.trim())
      .filter(Boolean)
      .join(" ");
    const existing = await ctx.db.query("ambassadors").withIndex("by_email", (q) => q.eq("email", mail)).unique();
    if (existing) {
      return { ok: true as const, alreadyExists: true, code: existing.code, status: existing.status };
    }
    const cfg = await getTierConfig(ctx);
    const code = await uniqueCode(ctx, fullName || args.nombre);
    const pin = genPin();
    await ctx.db.insert("ambassadors", {
      name: fullName,
      email: mail,
      code,
      pin,
      apellidoPaterno: args.apellidoPaterno.trim(),
      apellidoMaterno: args.apellidoMaterno.trim(),
      whatsapp: args.whatsapp.trim(),
      phone: args.phone?.trim() || undefined,
      rfc: args.rfc?.trim().toUpperCase() || undefined,
      curp: args.curp?.trim().toUpperCase() || undefined,
      address: args.address,
      tier: "normal",
      commissionPct: cfg.tierNormal,
      customerDiscountPct: cfg.customerDiscount,
      accruedCommission: 0,
      paidCommission: 0,
      salesCount: 0,
      salesAmount: 0,
      isActive: false,
      status: "pending",
    });
    // Correo: solicitud recibida / en revisión
    await ctx.scheduler.runAfter(0, internal.emails.sendAmbassadorEmail, {
      to: mail,
      name: fullName,
      type: "pending",
    });
    return { ok: true as const, alreadyExists: false, code, pin, status: "pending" as const };
  },
});

// El embajador completa/actualiza sus datos (incl. bancarios) con email + PIN
export const updateProfile = mutation({
  args: {
    email: v.string(),
    pin: v.string(),
    phone: v.optional(v.string()),
    rfc: v.optional(v.string()),
    curp: v.optional(v.string()),
    clabe: v.optional(v.string()),
    banco: v.optional(v.string()),
    titularCuenta: v.optional(v.string()),
    address: v.optional(
      v.object({
        calle: v.optional(v.string()),
        numero: v.optional(v.string()),
        colonia: v.optional(v.string()),
        cp: v.optional(v.string()),
        ciudad: v.optional(v.string()),
        estado: v.optional(v.string()),
        pais: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const a = await ctx.db
      .query("ambassadors")
      .withIndex("by_email", (q) => q.eq("email", args.email.trim().toLowerCase()))
      .unique();
    if (!a || !a.pin || a.pin !== args.pin.trim()) return { ok: false as const, error: "Datos incorrectos" };
    await ctx.db.patch(a._id, {
      phone: args.phone?.trim() ?? a.phone,
      rfc: args.rfc?.trim().toUpperCase() ?? a.rfc,
      curp: args.curp?.trim().toUpperCase() ?? a.curp,
      clabe: args.clabe?.trim() ?? a.clabe,
      banco: args.banco?.trim() ?? a.banco,
      titularCuenta: args.titularCuenta?.trim() ?? a.titularCuenta,
      address: args.address ?? a.address,
    });
    return { ok: true as const };
  },
});

// Panel del embajador — requiere email + PIN
export const getAccount = query({
  args: { email: v.string(), pin: v.string() },
  handler: async (ctx, { email, pin }) => {
    const a = await ctx.db
      .query("ambassadors")
      .withIndex("by_email", (q) => q.eq("email", email.trim().toLowerCase()))
      .unique();
    if (!a || !a.pin || a.pin !== pin.trim()) return null;
    const cfg = await getTierConfig(ctx);
    const salesAmount = a.salesAmount ?? 0;
    const hasBankData = Boolean(a.clabe && a.titularCuenta);
    // Progreso hacia el siguiente nivel
    const metricValue = cfg.thresholdMetric === "amount" ? salesAmount : a.salesCount;
    let nextTier: Tier | null = null;
    let nextTarget = 0;
    if (a.tier === "normal") { nextTier = "plata"; nextTarget = cfg.plataMin; }
    else if (a.tier === "plata") { nextTier = "oro"; nextTarget = cfg.oroMin; }

    const recentPayouts = await ctx.db
      .query("payouts")
      .withIndex("by_ambassador", (q) => q.eq("ambassadorId", a._id))
      .order("desc")
      .take(10);

    return {
      name: a.name, code: a.code, tier: a.tier, status: a.status, isActive: a.isActive,
      whatsapp: a.whatsapp ?? "", phone: a.phone ?? "", rfc: a.rfc ?? "", curp: a.curp ?? "",
      clabe: a.clabe ?? "", banco: a.banco ?? "", titularCuenta: a.titularCuenta ?? "",
      address: a.address ?? null,
      hasBankData,
      commissionPct: a.commissionPct, customerDiscountPct: a.customerDiscountPct,
      accruedCommission: a.accruedCommission, paidCommission: a.paidCommission,
      salesCount: a.salesCount, salesAmount,
      maxCashPct: maxCashPctForTier(a.tier),
      thresholdMetric: cfg.thresholdMetric,
      metricValue, nextTier, nextTarget,
      payouts: recentPayouts.map((p) => ({
        cashAmount: p.cashAmount, couponAmount: p.couponAmount, couponCode: p.couponCode ?? null,
        status: p.status, createdAt: p.createdAt,
      })),
    };
  },
});

// Canje de comisión por el propio embajador (email + PIN).
// cashAmount = parte que quiere recibir por transferencia (según su nivel). El resto va en cupón.
export const redeem = mutation({
  args: { email: v.string(), pin: v.string(), cashAmount: v.optional(v.number()) },
  handler: async (ctx, { email, pin, cashAmount }) => {
    const a = await ctx.db
      .query("ambassadors")
      .withIndex("by_email", (q) => q.eq("email", email.trim().toLowerCase()))
      .unique();
    if (!a || !a.pin || a.pin !== pin.trim()) return { ok: false as const, error: "Datos incorrectos" };
    if (!a.isActive) return { ok: false as const, error: "Tu cuenta no está activa" };

    const total = Math.floor(a.accruedCommission);
    if (total <= 0) return { ok: false as const, error: "No tienes comisión por redimir" };

    const maxCash = Math.floor(total * maxCashPctForTier(a.tier));
    let cash = Math.floor(Math.max(0, cashAmount ?? 0));
    if (cash > maxCash) {
      return {
        ok: false as const,
        error:
          a.tier === "normal"
            ? "Tu nivel (Normal) solo permite canje por producto (cupón)."
            : `Tu nivel ${a.tier === "plata" ? "Plata" : "Oro"} permite hasta $${maxCash.toLocaleString("es-MX")} en efectivo.`,
      };
    }
    if (cash > total) cash = total;
    const couponAmount = total - cash;

    // Para cobrar en efectivo se requieren datos bancarios
    if (cash > 0 && !(a.clabe && a.titularCuenta)) {
      return { ok: false as const, error: "Para cobrar en efectivo primero completa tus datos bancarios (CLABE y titular)." };
    }

    let couponCode: string | undefined;
    if (couponAmount > 0) {
      couponCode = `${a.code}-${Math.floor(Math.random() * 9000) + 1000}`;
      await ctx.db.insert("coupons", {
        code: couponCode,
        discountType: "fixed",
        discountValue: couponAmount,
        minPurchase: 0,
        maxUses: 1,
        usedCount: 0,
        isActive: true,
        note: `Canje de comisión de ${a.name}`,
      });
    }

    if (cash > 0) {
      await ctx.db.insert("payouts", {
        ambassadorId: a._id,
        ambassadorName: a.name,
        ambassadorCode: a.code,
        cashAmount: cash,
        couponAmount,
        couponCode,
        bank: { clabe: a.clabe, banco: a.banco, titular: a.titularCuenta, rfc: a.rfc },
        status: "pending",
        createdAt: Date.now(),
      });
    }

    // Se descuenta todo lo redimido del acumulado
    await ctx.db.patch(a._id, { paidCommission: a.paidCommission + total, accruedCommission: 0 });
    return { ok: true as const, couponCode: couponCode ?? null, couponAmount, cashAmount: cash };
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
    const pin = a.pin ?? genPin();
    await ctx.db.patch(id, { status: "active", isActive: true, pin });
    await createAmbassadorCoupon(ctx, id, a.code, a.customerDiscountPct, a.name);
    // Correo: cuenta aprobada y lista para vender
    await ctx.scheduler.runAfter(0, internal.emails.sendAmbassadorEmail, {
      to: a.email,
      name: a.name,
      type: "approved",
      code: a.code,
    });
    return { code: a.code, pin };
  },
});

// Regenera el PIN de un embajador (admin)
export const resetPin = mutation({
  args: { adminKey: v.string(), id: v.id("ambassadors") },
  handler: async (ctx, { adminKey, id }) => {
    assertAdmin(adminKey);
    const pin = genPin();
    await ctx.db.patch(id, { pin });
    return { pin };
  },
});

// Alta manual por el admin (queda activo de inmediato con su cupón)
export const adminCreate = mutation({
  args: {
    adminKey: v.string(),
    name: v.string(),
    email: v.string(),
    tier: v.union(v.literal("normal"), v.literal("plata"), v.literal("oro")),
    customCode: v.optional(v.string()),
  },
  handler: async (ctx, { adminKey, name, email, tier, customCode }) => {
    assertAdmin(adminKey);
    const mail = email.trim().toLowerCase();
    const existing = await ctx.db.query("ambassadors").withIndex("by_email", (q) => q.eq("email", mail)).unique();
    if (existing) throw new Error("Ya existe un embajador con ese correo");

    const cfg = await getTierConfig(ctx);
    let code = customCode?.trim().toUpperCase().replace(/[^A-Z0-9]/g, "") || "";
    if (code) {
      const taken =
        (await ctx.db.query("ambassadors").withIndex("by_code", (q) => q.eq("code", code)).unique()) ||
        (await ctx.db.query("coupons").withIndex("by_code", (q) => q.eq("code", code)).unique());
      if (taken) throw new Error(`El código ${code} ya está en uso`);
    } else {
      code = await uniqueCode(ctx, name);
    }

    const pin = genPin();
    const id = await ctx.db.insert("ambassadors", {
      name: name.trim(),
      email: mail,
      code,
      pin,
      tier,
      commissionPct: commissionForTier(tier, cfg),
      customerDiscountPct: cfg.customerDiscount,
      accruedCommission: 0,
      paidCommission: 0,
      salesCount: 0,
      isActive: true,
      status: "active",
    });
    await createAmbassadorCoupon(ctx, id, code, cfg.customerDiscount, name.trim());
    // Correo: cuenta creada y lista para vender
    await ctx.scheduler.runAfter(0, internal.emails.sendAmbassadorEmail, {
      to: mail,
      name: name.trim(),
      type: "approved",
      code,
    });
    return { code, pin };
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

// ─── Cola de pagos en efectivo (transferencias) ───
export const listPayouts = query({
  args: { adminKey: v.string() },
  handler: async (ctx, { adminKey }) => {
    assertAdmin(adminKey);
    return await ctx.db.query("payouts").order("desc").take(100);
  },
});

export const markPayoutPaid = mutation({
  args: { adminKey: v.string(), id: v.id("payouts"), note: v.optional(v.string()) },
  handler: async (ctx, { adminKey, id, note }) => {
    assertAdmin(adminKey);
    await ctx.db.patch(id, { status: "paid", paidAt: Date.now(), note });
  },
});

export const rejectPayout = mutation({
  args: { adminKey: v.string(), id: v.id("payouts") },
  handler: async (ctx, { adminKey, id }) => {
    assertAdmin(adminKey);
    const p = await ctx.db.get(id);
    if (!p || p.status !== "pending") return;
    // Devolver el monto en efectivo al acumulado del embajador
    const a = await ctx.db.get(p.ambassadorId);
    if (a) {
      await ctx.db.patch(a._id, {
        accruedCommission: a.accruedCommission + p.cashAmount,
        paidCommission: Math.max(0, a.paidCommission - p.cashAmount),
      });
    }
    await ctx.db.patch(id, { status: "rejected" });
  },
});

// Ascenso automático de nivel — llamado al acreditar una venta (desde orders.ts)
export async function promoteIfEligible(ctx: MutationCtx, ambId: Id<"ambassadors">) {
  const a = await ctx.db.get(ambId);
  if (!a || !a.isActive) return;
  const cfg = await getTierConfig(ctx);
  const target = tierForProgress(a.salesCount, a.salesAmount ?? 0, cfg);
  const rank = { normal: 0, plata: 1, oro: 2 } as const;
  // Solo sube de nivel automáticamente (nunca baja)
  if (rank[target] > rank[a.tier]) {
    await ctx.db.patch(ambId, { tier: target, commissionPct: commissionForTier(target, cfg) });
  }
}
