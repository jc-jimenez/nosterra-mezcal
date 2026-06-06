import { query, mutation, internalMutation, action } from "./_generated/server";
import { v } from "convex/values";
import { internal, api } from "./_generated/api";
import { promoteIfEligible } from "./ambassadors";

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

// Crea un pedido manualmente (ventas externas: WhatsApp, efectivo, influencer)
export const createManualOrder = mutation({
  args: {
    adminKey: v.string(),
    customerName: v.string(),
    customerEmail: v.string(),
    customerPhone: v.optional(v.string()),
    shippingAddress: v.object({
      calle: v.string(), numero: v.string(), colonia: v.string(),
      cp: v.string(), ciudad: v.string(), estado: v.string(),
      pais: v.string(), referencias: v.optional(v.string()),
    }),
    items: v.array(v.object({
      productId: v.optional(v.id("products")),
      slug: v.string(), name: v.string(), price: v.number(), qty: v.number(),
    })),
    shipping: v.number(),
    discount: v.optional(v.number()),
    couponCode: v.optional(v.string()),
    ambassadorCode: v.optional(v.string()),
    paymentMethod: v.string(),
  },
  handler: async (ctx, args) => {
    assertAdmin(args.adminKey);

    const subtotal = args.items.reduce((s, i) => s + i.price * i.qty, 0);
    const total = Math.max(0, subtotal + args.shipping - (args.discount ?? 0));

    const count = (await ctx.db.query("orders").collect()).length;
    const year = new Date().getFullYear();
    const orderNumber = `NOST-${year}-${String(count + 1).padStart(4, "0")}`;

    // Embajador por código (si se indicó)
    let ambassadorId: import("./_generated/dataModel").Id<"ambassadors"> | undefined;
    let commission = 0;
    if (args.ambassadorCode) {
      const amb = await ctx.db
        .query("ambassadors")
        .withIndex("by_code", (q) => q.eq("code", args.ambassadorCode!.toUpperCase()))
        .unique();
      if (amb && amb.isActive) {
        ambassadorId = amb._id;
        commission = Math.round((subtotal * amb.commissionPct) / 100);
      }
    }

    const orderId = await ctx.db.insert("orders", {
      orderNumber,
      customerName: args.customerName,
      customerEmail: args.customerEmail.trim().toLowerCase(),
      customerPhone: args.customerPhone,
      shippingAddress: args.shippingAddress,
      items: args.items,
      subtotal,
      shipping: args.shipping,
      discount: args.discount,
      couponCode: args.couponCode,
      ambassadorId,
      commission: commission || undefined,
      total,
      status: "nuevo",
      paymentStatus: "approved",
      paymentId: "MANUAL",
      isManual: true,
      paymentMethod: args.paymentMethod,
      stockApplied: true,
      statusHistory: [{ status: "nuevo", at: Date.now(), note: `Manual · ${args.paymentMethod}` }],
    });

    // Descontar stock
    for (const item of args.items) {
      const product = item.productId
        ? await ctx.db.get(item.productId)
        : await ctx.db.query("products").withIndex("by_slug", (q) => q.eq("slug", item.slug)).unique();
      if (!product) continue;
      const patch: Record<string, number> = { stock: Math.max(0, product.stock - item.qty) };
      if (product.isLimited && product.bottlesAvailable != null) {
        patch.bottlesAvailable = Math.max(0, product.bottlesAvailable - item.qty);
      }
      await ctx.db.patch(product._id, patch);
    }

    // Acreditar comisión + ascenso
    if (ambassadorId && commission > 0) {
      const amb = await ctx.db.get(ambassadorId);
      if (amb) {
        await ctx.db.patch(ambassadorId, {
          accruedCommission: amb.accruedCommission + commission,
          salesCount: amb.salesCount + 1,
          salesAmount: (amb.salesAmount ?? 0) + subtotal,
          lastSaleAt: Date.now(),
        });
        await promoteIfEligible(ctx, ambassadorId);
      }
    }

    // Cliente en CRM
    await ctx.runMutation(internal.crm.upsertCustomerInternal, {
      name: args.customerName,
      email: args.customerEmail.trim().toLowerCase(),
      phone: args.customerPhone,
      total,
      orderNumber,
      orderAt: Date.now(),
    });

    // Correo de confirmación al cliente
    await ctx.scheduler.runAfter(0, internal.emails.sendOrderConfirmation, {
      to: args.customerEmail.trim().toLowerCase(),
      customerName: args.customerName,
      orderNumber,
      items: args.items.map((i) => ({ name: i.name, qty: i.qty, price: i.price })),
      subtotal, shipping: args.shipping, discount: args.discount ?? 0, total,
      address: {
        calle: args.shippingAddress.calle, numero: args.shippingAddress.numero,
        colonia: args.shippingAddress.colonia, cp: args.shippingAddress.cp,
        ciudad: args.shippingAddress.ciudad, estado: args.shippingAddress.estado,
      },
    });

    // Aviso al dueño
    const settings = await ctx.db.query("settings").first();
    const ownerEmail = settings?.notifyOrdersEmail || process.env.OWNER_EMAIL || "";
    if (ownerEmail) {
      await ctx.scheduler.runAfter(0, internal.emails.sendOwnerNewOrder, {
        to: ownerEmail,
        orderNumber,
        customerName: args.customerName,
        customerEmail: args.customerEmail.trim().toLowerCase(),
        customerPhone: args.customerPhone,
        items: args.items.map((i) => ({ name: i.name, qty: i.qty, price: i.price })),
        total,
        couponCode: args.couponCode,
        ambassadorCode: args.ambassadorCode,
        city: args.shippingAddress.ciudad,
        state: args.shippingAddress.estado,
        isManual: true,
      });
    }

    return { ok: true, orderNumber };
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
