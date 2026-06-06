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
    currency: v.string(),
  }),

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
