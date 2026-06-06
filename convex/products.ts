import { query, mutation, QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import { Doc } from "./_generated/dataModel";

// ─── Auth simple para mutaciones de admin ───
function assertAdmin(key: string) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) throw new Error("ADMIN_PASSWORD no configurada en Convex");
  if (key !== expected) throw new Error("Contraseña de administrador incorrecta");
}

// Resuelve la URL de imagen (archivo Convex o URL externa)
async function withImage(ctx: QueryCtx, p: Doc<"products">) {
  let image = p.imageUrl ?? "";
  if (p.imageStorageId) {
    const url = await ctx.storage.getUrl(p.imageStorageId);
    if (url) image = url;
  }
  return { ...p, image };
}

// ─── Queries públicas (tienda) ───
export const listActive = query({
  handler: async (ctx) => {
    const products = await ctx.db
      .query("products")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();
    products.sort((a, b) => a.sortOrder - b.sortOrder);
    return Promise.all(products.map((p) => withImage(ctx, p)));
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const p = await ctx.db
      .query("products")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();
    return p ? withImage(ctx, p) : null;
  },
});

// ─── Query admin (todos, incl. inactivos) ───
export const listAll = query({
  handler: async (ctx) => {
    const products = await ctx.db.query("products").collect();
    products.sort((a, b) => a.sortOrder - b.sortOrder);
    return Promise.all(products.map((p) => withImage(ctx, p)));
  },
});

// ─── Subida de imágenes ───
export const generateUploadUrl = mutation({
  args: { adminKey: v.string() },
  handler: async (ctx, { adminKey }) => {
    assertAdmin(adminKey);
    return await ctx.storage.generateUploadUrl();
  },
});

// ─── Mutaciones admin ───
const productInput = {
  slug: v.string(),
  name: v.string(),
  tagline: v.string(),
  description: v.string(),
  price: v.number(),
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
  isLimited: v.boolean(),
  bottlesTotal: v.optional(v.number()),
  bottlesAvailable: v.optional(v.number()),
  sortOrder: v.number(),
};

export const create = mutation({
  args: { adminKey: v.string(), data: v.object(productInput) },
  handler: async (ctx, { adminKey, data }) => {
    assertAdmin(adminKey);
    return await ctx.db.insert("products", data);
  },
});

export const update = mutation({
  args: { adminKey: v.string(), id: v.id("products"), data: v.object(productInput) },
  handler: async (ctx, { adminKey, id, data }) => {
    assertAdmin(adminKey);
    // Reemplaza el documento con los datos nuevos (limpia campos opcionales ausentes)
    await ctx.db.replace(id, data);
  },
});

export const remove = mutation({
  args: { adminKey: v.string(), id: v.id("products") },
  handler: async (ctx, { adminKey, id }) => {
    assertAdmin(adminKey);
    const p = await ctx.db.get(id);
    if (p?.imageStorageId) await ctx.storage.delete(p.imageStorageId);
    await ctx.db.delete(id);
  },
});

// Verifica la contraseña de admin (para el login del panel)
export const checkAdmin = mutation({
  args: { adminKey: v.string() },
  handler: async (_ctx, { adminKey }) => {
    assertAdmin(adminKey);
    return { ok: true };
  },
});
