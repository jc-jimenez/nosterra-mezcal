import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

function assertAdmin(key: string) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) throw new Error("ADMIN_PASSWORD no configurada");
  if (key !== expected) throw new Error("Contraseña incorrecta");
}

// Pública: cualquiera puede dejar una reseña (queda pendiente de aprobación)
export const create = mutation({
  args: {
    name: v.string(),
    rating: v.number(),
    comment: v.string(),
    productSlug: v.optional(v.string()),
  },
  handler: async (ctx, { name, rating, comment, productSlug }) => {
    const r = Math.max(1, Math.min(5, Math.round(rating)));
    await ctx.db.insert("reviews", {
      name: name.trim().slice(0, 60),
      rating: r,
      comment: comment.trim().slice(0, 600),
      productSlug: productSlug || undefined,
      status: "pending",
      createdAt: Date.now(),
    });
    return { ok: true };
  },
});

// Reseñas aprobadas de un producto (público)
export const listApproved = query({
  args: { productSlug: v.optional(v.string()) },
  handler: async (ctx, { productSlug }) => {
    const all = await ctx.db
      .query("reviews")
      .withIndex("by_status", (q) => q.eq("status", "approved"))
      .order("desc")
      .take(100);
    const filtered = productSlug ? all.filter((r) => r.productSlug === productSlug) : all;
    return filtered.map((r) => ({ _id: r._id, name: r.name, rating: r.rating, comment: r.comment, createdAt: r.createdAt }));
  },
});

// Testimonios destacados para la página principal (público)
export const listFeatured = query({
  handler: async (ctx) => {
    const all = await ctx.db
      .query("reviews")
      .withIndex("by_status", (q) => q.eq("status", "approved"))
      .order("desc")
      .take(100);
    const featured = all.filter((r) => r.featured);
    return (featured.length > 0 ? featured : all).slice(0, 6).map((r) => ({
      _id: r._id, name: r.name, rating: r.rating, comment: r.comment,
    }));
  },
});

// ─── Admin ───
export const listAll = query({
  args: { adminKey: v.string() },
  handler: async (ctx, { adminKey }) => {
    assertAdmin(adminKey);
    return await ctx.db.query("reviews").order("desc").take(200);
  },
});

export const moderate = mutation({
  args: {
    adminKey: v.string(),
    id: v.id("reviews"),
    status: v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected")),
  },
  handler: async (ctx, { adminKey, id, status }) => {
    assertAdmin(adminKey);
    await ctx.db.patch(id, { status });
  },
});

export const toggleFeatured = mutation({
  args: { adminKey: v.string(), id: v.id("reviews"), featured: v.boolean() },
  handler: async (ctx, { adminKey, id, featured }) => {
    assertAdmin(adminKey);
    await ctx.db.patch(id, { featured });
  },
});

export const remove = mutation({
  args: { adminKey: v.string(), id: v.id("reviews") },
  handler: async (ctx, { adminKey, id }) => {
    assertAdmin(adminKey);
    await ctx.db.delete(id);
  },
});

// Crea un testimonio directamente aprobado (admin)
export const adminCreate = mutation({
  args: { adminKey: v.string(), name: v.string(), rating: v.number(), comment: v.string(), featured: v.optional(v.boolean()) },
  handler: async (ctx, { adminKey, name, rating, comment, featured }) => {
    assertAdmin(adminKey);
    await ctx.db.insert("reviews", {
      name: name.trim(),
      rating: Math.max(1, Math.min(5, Math.round(rating))),
      comment: comment.trim(),
      status: "approved",
      featured: featured ?? true,
      createdAt: Date.now(),
    });
    return { ok: true };
  },
});
