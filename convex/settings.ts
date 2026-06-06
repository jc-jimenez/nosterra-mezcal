import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

const DEFAULTS = {
  whatsappNumber: "527775238569",
  shippingNote: "Envío a todo México · 3–5 días hábiles",
  freeShippingFrom: 1500,
  shippingCost: 150,
  currency: "MXN",
  ambassador: { tierNormal: 2, tierPlata: 3, tierOro: 5, customerDiscount: 5, thresholdMetric: "sales" as const, plataMin: 10, oroMin: 25 },
};

function assertAdmin(key: string) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) throw new Error("ADMIN_PASSWORD no configurada en Convex");
  if (key !== expected) throw new Error("Contraseña de administrador incorrecta");
}

export const get = query({
  handler: async (ctx) => {
    const s = await ctx.db.query("settings").first();
    return s ?? DEFAULTS;
  },
});

export const upsert = mutation({
  args: {
    adminKey: v.string(),
    data: v.object({
      whatsappNumber: v.string(),
      shippingNote: v.string(),
      freeShippingFrom: v.number(),
      shippingCost: v.number(),
      currency: v.string(),
      notifyOrdersEmail: v.optional(v.string()),
      notifyAmbassadorsEmail: v.optional(v.string()),
      ambassador: v.optional(
        v.object({
          tierNormal: v.number(),
          tierPlata: v.number(),
          tierOro: v.number(),
          customerDiscount: v.number(),
          thresholdMetric: v.optional(v.union(v.literal("sales"), v.literal("amount"))),
          plataMin: v.optional(v.number()),
          oroMin: v.optional(v.number()),
          infoComision: v.optional(v.string()),
          infoDescuento: v.optional(v.string()),
          infoNiveles: v.optional(v.string()),
        })
      ),
    }),
  },
  handler: async (ctx, { adminKey, data }) => {
    assertAdmin(adminKey);
    const existing = await ctx.db.query("settings").first();
    if (existing) await ctx.db.patch(existing._id, data);
    else await ctx.db.insert("settings", data);
  },
});
