import { query, mutation, internalMutation, action } from "./_generated/server";
import { v } from "convex/values";
import { internal, api } from "./_generated/api";

function assertAdmin(key: string) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) throw new Error("ADMIN_PASSWORD no configurada");
  if (key !== expected) throw new Error("Contraseña incorrecta");
}

type OrderStatus =
  | "pending" | "nuevo" | "confirmado" | "preparando"
  | "enviado" | "en_camino" | "entregado" | "cerrado" | "cancelled";

// ─── Órdenes CRM ─────────────────────────────────────────────────────────────

// Órdenes activas (todo menos cerrado/cancelled/pending)
export const listActive = query({
  args: { adminKey: v.string() },
  handler: async (ctx, { adminKey }) => {
    assertAdmin(adminKey);
    const all = await ctx.db.query("orders").order("desc").take(500);
    return all.filter((o) => !["pending", "cerrado", "cancelled"].includes(o.status));
  },
});

// Órdenes cerradas (historial)
export const listClosed = query({
  args: { adminKey: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, { adminKey, limit }) => {
    assertAdmin(adminKey);
    return await ctx.db
      .query("orders")
      .withIndex("by_status", (q) => q.eq("status", "cerrado"))
      .order("desc")
      .take(limit ?? 100);
  },
});

// Avanza el estado de una orden y registra en historial
export const advanceStatus = mutation({
  args: {
    adminKey: v.string(),
    id: v.id("orders"),
    status: v.union(
      v.literal("confirmado"), v.literal("preparando"),
      v.literal("enviado"), v.literal("en_camino"),
      v.literal("entregado"), v.literal("cerrado"), v.literal("cancelled")
    ),
    trackingNumber: v.optional(v.string()),
    carrier: v.optional(v.string()),
    note: v.optional(v.string()),
  },
  handler: async (ctx, { adminKey, id, status, trackingNumber, carrier, note }) => {
    assertAdmin(adminKey);
    const order = await ctx.db.get(id);
    if (!order) throw new Error("Orden no encontrada");

    const historyEntry = { status, at: Date.now(), note };
    const history = [...(order.statusHistory ?? []), historyEntry];

    const patch: Record<string, unknown> = { status, statusHistory: history };
    if (trackingNumber) patch.trackingNumber = trackingNumber;
    if (carrier) patch.carrier = carrier;
    if (status === "cerrado") patch.closedAt = Date.now();

    await ctx.db.patch(id, patch);

    // Correos automáticos según el estado
    if (status === "confirmado") {
      await ctx.scheduler.runAfter(0, internal.emails.sendOrderStatusEmail, {
        to: order.customerEmail,
        customerName: order.customerName,
        orderNumber: order.orderNumber,
        type: "confirmado",
      });
    }
    if (status === "enviado" && trackingNumber) {
      await ctx.scheduler.runAfter(0, internal.emails.sendOrderStatusEmail, {
        to: order.customerEmail,
        customerName: order.customerName,
        orderNumber: order.orderNumber,
        type: "enviado",
        trackingNumber,
        carrier: carrier ?? "",
      });
    }
    if (status === "cerrado") {
      await ctx.scheduler.runAfter(0, internal.emails.sendOrderStatusEmail, {
        to: order.customerEmail,
        customerName: order.customerName,
        orderNumber: order.orderNumber,
        type: "cerrado",
      });
    }

    return { ok: true };
  },
});

// Actualiza notas internas y/o guía sin cambiar estado
export const updateOrderMeta = mutation({
  args: {
    adminKey: v.string(),
    id: v.id("orders"),
    adminNotes: v.optional(v.string()),
    trackingNumber: v.optional(v.string()),
    carrier: v.optional(v.string()),
  },
  handler: async (ctx, { adminKey, id, adminNotes, trackingNumber, carrier }) => {
    assertAdmin(adminKey);
    const patch: Record<string, unknown> = {};
    if (adminNotes !== undefined) patch.adminNotes = adminNotes;
    if (trackingNumber !== undefined) patch.trackingNumber = trackingNumber;
    if (carrier !== undefined) patch.carrier = carrier;
    await ctx.db.patch(id, patch);
  },
});

// ─── Clientes ────────────────────────────────────────────────────────────────

export const listCustomers = query({
  args: { adminKey: v.string() },
  handler: async (ctx, { adminKey }) => {
    assertAdmin(adminKey);
    return await ctx.db.query("customers").order("desc").take(500);
  },
});

export const getCustomer = query({
  args: { adminKey: v.string(), email: v.string() },
  handler: async (ctx, { adminKey, email }) => {
    assertAdmin(adminKey);
    const customer = await ctx.db
      .query("customers")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();
    if (!customer) return null;
    const orders = await ctx.db
      .query("orders")
      .withIndex("by_email", (q) => q.eq("customerEmail", email))
      .order("desc")
      .take(50);
    return { ...customer, orders };
  },
});

export const updateCustomerNotes = mutation({
  args: {
    adminKey: v.string(),
    id: v.id("customers"),
    notes: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, { adminKey, id, notes, tags }) => {
    assertAdmin(adminKey);
    const patch: Record<string, unknown> = {};
    if (notes !== undefined) patch.notes = notes;
    if (tags !== undefined) patch.tags = tags;
    await ctx.db.patch(id, patch);
  },
});

// ─── CRM de embajadores ──────────────────────────────────────────────────────

// Lista de embajadores con métricas para seguimiento (solo activos por defecto)
export const listAmbassadorsCRM = query({
  args: { adminKey: v.string() },
  handler: async (ctx, { adminKey }) => {
    assertAdmin(adminKey);
    const all = await ctx.db.query("ambassadors").order("desc").take(500);
    return all.map((a) => ({
      _id: a._id,
      name: a.name,
      email: a.email,
      whatsapp: a.whatsapp ?? "",
      code: a.code,
      tier: a.tier,
      status: a.status,
      isActive: a.isActive,
      commissionPct: a.commissionPct,
      salesCount: a.salesCount,
      salesAmount: a.salesAmount ?? 0,
      accruedCommission: a.accruedCommission,
      paidCommission: a.paidCommission,
      lastSaleAt: a.lastSaleAt ?? null,
      crmNotes: a.crmNotes ?? "",
    }));
  },
});

export const updateAmbassadorNotes = mutation({
  args: { adminKey: v.string(), id: v.id("ambassadors"), notes: v.string() },
  handler: async (ctx, { adminKey, id, notes }) => {
    assertAdmin(adminKey);
    await ctx.db.patch(id, { crmNotes: notes });
  },
});

// ─── Campañas a embajadores ──────────────────────────────────────────────────

export const listCampaigns = query({
  args: { adminKey: v.string() },
  handler: async (ctx, { adminKey }) => {
    assertAdmin(adminKey);
    return await ctx.db.query("campaigns").order("desc").take(50);
  },
});

// Registra una campaña en el historial (internal, llamado por la acción)
export const recordCampaign = internalMutation({
  args: {
    subject: v.string(),
    body: v.string(),
    audience: v.union(v.literal("all"), v.literal("oro"), v.literal("plata"), v.literal("normal"), v.literal("inactivos")),
    sentCount: v.number(),
  },
  handler: async (ctx, { subject, body, audience, sentCount }) => {
    await ctx.db.insert("campaigns", { subject, body, audience, sentCount, createdAt: Date.now() });
  },
});

// Devuelve los embajadores destino de una campaña (internal)
export const audienceForCampaign = query({
  args: { adminKey: v.string(), audience: v.string() },
  handler: async (ctx, { adminKey, audience }) => {
    assertAdmin(adminKey);
    const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    const all = await ctx.db.query("ambassadors").order("desc").take(1000);
    const active = all.filter((a) => a.isActive);
    let target = active;
    if (audience === "oro" || audience === "plata" || audience === "normal") {
      target = active.filter((a) => a.tier === audience);
    } else if (audience === "inactivos") {
      target = active.filter((a) => !a.lastSaleAt || now - a.lastSaleAt > THIRTY_DAYS);
    }
    return target.map((a) => ({ name: a.name, email: a.email }));
  },
});

// Envía una campaña por correo a la audiencia seleccionada
export const sendCampaign = action({
  args: {
    adminKey: v.string(),
    subject: v.string(),
    body: v.string(),
    audience: v.union(v.literal("all"), v.literal("oro"), v.literal("plata"), v.literal("normal"), v.literal("inactivos")),
  },
  handler: async (ctx, { adminKey, subject, body, audience }): Promise<{ ok: boolean; sent: number }> => {
    const recipients: { name: string; email: string }[] = await ctx.runQuery(api.crm.audienceForCampaign, { adminKey, audience });
    let sent = 0;
    for (const r of recipients) {
      const res = await ctx.runAction(internal.emails.sendCampaignEmail, {
        to: r.email, name: r.name, subject, body,
      });
      if (res.ok) sent++;
    }
    await ctx.runMutation(internal.crm.recordCampaign, { subject, body, audience, sentCount: sent });
    return { ok: true, sent };
  },
});

// Crea o actualiza el registro del cliente al pagarse una orden (internal)
export const upsertCustomerInternal = internalMutation({
  args: {
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    total: v.number(),
    orderNumber: v.string(),
    orderAt: v.number(),
  },
  handler: async (ctx, { name, email, phone, total, orderNumber, orderAt }) => {
    const existing = await ctx.db
      .query("customers")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        totalSpent: existing.totalSpent + total,
        orderCount: existing.orderCount + 1,
        lastOrderAt: orderAt,
        lastOrderNumber: orderNumber,
        phone: phone ?? existing.phone,
        name,
      });
    } else {
      await ctx.db.insert("customers", {
        name, email,
        phone: phone ?? undefined,
        totalSpent: total,
        orderCount: 1,
        lastOrderAt: orderAt,
        lastOrderNumber: orderNumber,
      });
    }
  },
});
