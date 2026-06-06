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
});
