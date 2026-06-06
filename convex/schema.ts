import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Catálogo de productos NOSTERRA
  products: defineTable({
    slug: v.string(),
    name: v.string(),
    tagline: v.string(),
    description: v.string(),
    price: v.number(),
    // Imagen: o un archivo subido a Convex (storageId) o una URL externa
    imageStorageId: v.optional(v.id("_storage")),
    imageUrl: v.optional(v.string()),
    agave: v.string(),
    alcohol: v.string(),
    volume: v.string(),
    origin: v.string(),
    process: v.string(),
    stock: v.number(),
    featured: v.boolean(),
    isActive: v.boolean(),
    // Edición limitada / botellas numeradas (opcional)
    isLimited: v.boolean(),
    bottlesTotal: v.optional(v.number()),
    bottlesAvailable: v.optional(v.number()),
    sortOrder: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_active", ["isActive"]),

  // Configuración global de la tienda (singleton)
  settings: defineTable({
    whatsappNumber: v.string(),
    shippingNote: v.string(),
    freeShippingFrom: v.number(),
    shippingCost: v.optional(v.number()), // tarifa fija de envío (MXN)
    currency: v.string(),
    // Programa de embajadores (Fase 2) — comisión por nivel + descuento al cliente
    ambassador: v.optional(
      v.object({
        tierNormal: v.number(), // % comisión nivel normal
        tierPlata: v.number(),
        tierOro: v.number(),
        customerDiscount: v.number(), // % de descuento al cliente que usa un código de embajador
      })
    ),
  }),

  // Cupones de descuento
  coupons: defineTable({
    code: v.string(), // en mayúsculas, ej. MEZCAL15
    discountType: v.union(
      v.literal("percent"), // % de descuento
      v.literal("fixed"), // monto fijo en MXN
      v.literal("freeship") // envío gratis
    ),
    discountValue: v.number(), // % (0-100) o monto MXN; 0 si freeship
    minPurchase: v.number(), // compra mínima (0 = sin mínimo)
    maxUses: v.number(), // usos totales (0 = ilimitado)
    usedCount: v.number(),
    expiresAt: v.optional(v.number()), // timestamp; null = sin expiración
    isActive: v.boolean(),
    note: v.optional(v.string()),
    ambassadorId: v.optional(v.id("ambassadors")), // si es el código de un embajador
  })
    .index("by_code", ["code"])
    .index("by_active", ["isActive"]),

  // Embajadores de marca (Fase 2)
  ambassadors: defineTable({
    name: v.string(),
    email: v.string(),
    code: v.string(), // su código personal (también existe como cupón)
    pin: v.optional(v.string()), // PIN para acceder a su panel y redimir
    tier: v.union(v.literal("normal"), v.literal("plata"), v.literal("oro")),
    commissionPct: v.number(), // % de comisión (según nivel, ajustable)
    customerDiscountPct: v.number(), // % de descuento que da a sus clientes
    accruedCommission: v.number(), // comisión acumulada (MXN)
    paidCommission: v.number(), // comisión ya pagada (MXN)
    salesCount: v.number(),
    isActive: v.boolean(),
    status: v.union(
      v.literal("pending"), // postulación por revisar
      v.literal("active"),
      v.literal("rejected")
    ),
  })
    .index("by_code", ["code"])
    .index("by_email", ["email"]),

  // Órdenes de compra (pago con tarjeta vía Mercado Pago)
  orders: defineTable({
    orderNumber: v.string(), // NOST-2026-0001
    customerName: v.string(),
    customerEmail: v.string(),
    customerPhone: v.optional(v.string()),
    shippingAddress: v.object({
      calle: v.string(),
      numero: v.string(),
      colonia: v.string(),
      cp: v.string(),
      ciudad: v.string(),
      estado: v.string(),
      pais: v.string(),
      referencias: v.optional(v.string()),
    }),
    items: v.array(
      v.object({
        productId: v.optional(v.id("products")),
        slug: v.string(),
        name: v.string(),
        price: v.number(),
        qty: v.number(),
      })
    ),
    subtotal: v.number(),
    shipping: v.number(),
    discount: v.optional(v.number()), // monto descontado por cupón
    couponCode: v.optional(v.string()),
    ambassadorId: v.optional(v.id("ambassadors")),
    commission: v.optional(v.number()), // comisión generada para el embajador
    total: v.number(),
    status: v.union(
      v.literal("pending"), // creada, esperando pago
      v.literal("paid"), // pago aprobado
      v.literal("shipped"),
      v.literal("delivered"),
      v.literal("cancelled")
    ),
    paymentStatus: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("in_process")
    ),
    paymentId: v.optional(v.string()), // id de Mercado Pago
    stockApplied: v.boolean(), // si ya se descontó el stock (idempotencia)
  })
    .index("by_order_number", ["orderNumber"])
    .index("by_email", ["customerEmail"]),
});
