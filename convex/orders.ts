import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { promoteIfEligible } from "./ambassadors";
import { internal } from "./_generated/api";

// Secreto compartido servidor↔Convex para mutaciones sensibles (webhook).
function assertServer(secret: string) {
  const expected = process.env.SERVER_SECRET;
  if (!expected) throw new Error("SERVER_SECRET no configurada en Convex");
  if (secret !== expected) throw new Error("No autorizado");
}
function assertAdmin(key: string) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) throw new Error("ADMIN_PASSWORD no configurada en Convex");
  if (key !== expected) throw new Error("Contraseña incorrecta");
}

const itemValidator = v.object({
  productId: v.optional(v.id("products")),
  slug: v.string(),
  name: v.string(),
  price: v.number(),
  qty: v.number(),
});

const addressValidator = v.object({
  calle: v.string(),
  numero: v.string(),
  colonia: v.string(),
  cp: v.string(),
  ciudad: v.string(),
  estado: v.string(),
  pais: v.string(),
  referencias: v.optional(v.string()),
});

// Crea una orden pendiente (antes de redirigir a Mercado Pago).
export const create = mutation({
  args: {
    customerName: v.string(),
    customerEmail: v.string(),
    customerPhone: v.optional(v.string()),
    shippingAddress: addressValidator,
    items: v.array(itemValidator),
    subtotal: v.number(),
    shipping: v.number(),
    discount: v.optional(v.number()),
    couponCode: v.optional(v.string()),
    ambassadorId: v.optional(v.id("ambassadors")),
    commission: v.optional(v.number()),
    total: v.number(),
  },
  handler: async (ctx, args) => {
    const count = (await ctx.db.query("orders").collect()).length;
    const year = new Date().getFullYear();
    const orderNumber = `NOST-${year}-${String(count + 1).padStart(4, "0")}`;

    const orderId = await ctx.db.insert("orders", {
      ...args,
      orderNumber,
      status: "pending",
      paymentStatus: "pending",
      stockApplied: false,
    });
    return { orderId, orderNumber };
  },
});

// Consulta una orden por su número (página de gracias).
export const getByNumber = query({
  args: { orderNumber: v.string() },
  handler: async (ctx, { orderNumber }) => {
    return await ctx.db
      .query("orders")
      .withIndex("by_order_number", (q) => q.eq("orderNumber", orderNumber))
      .unique();
  },
});

// Marca el resultado del pago (llamado desde el webhook del servidor).
// Idempotente: descuenta stock una sola vez cuando el pago es aprobado.
export const markPayment = mutation({
  args: {
    serverSecret: v.string(),
    orderNumber: v.string(),
    paymentId: v.string(),
    paymentStatus: v.union(
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("in_process"),
      v.literal("pending")
    ),
  },
  handler: async (ctx, { serverSecret, orderNumber, paymentId, paymentStatus }) => {
    assertServer(serverSecret);
    const order = await ctx.db
      .query("orders")
      .withIndex("by_order_number", (q) => q.eq("orderNumber", orderNumber))
      .unique();
    if (!order) throw new Error("Orden no encontrada");

    const approved = paymentStatus === "approved";

    await ctx.db.patch(order._id, {
      paymentId,
      paymentStatus,
      status: approved ? "nuevo" : order.status,
      statusHistory: approved
        ? [...(order.statusHistory ?? []), { status: "nuevo", at: Date.now() }]
        : order.statusHistory,
    });

    // Descontar stock una sola vez al aprobarse
    if (approved && !order.stockApplied) {
      for (const item of order.items) {
        const product = item.productId
          ? await ctx.db.get(item.productId)
          : await ctx.db
              .query("products")
              .withIndex("by_slug", (q) => q.eq("slug", item.slug))
              .unique();
        if (!product) continue;
        const patch: Record<string, number> = {
          stock: Math.max(0, product.stock - item.qty),
        };
        if (product.isLimited && product.bottlesAvailable != null) {
          patch.bottlesAvailable = Math.max(0, product.bottlesAvailable - item.qty);
        }
        await ctx.db.patch(product._id, patch);
      }

      // Contar el uso del cupón (una sola vez)
      if (order.couponCode) {
        const coupon = await ctx.db
          .query("coupons")
          .withIndex("by_code", (q) => q.eq("code", order.couponCode!))
          .unique();
        if (coupon) await ctx.db.patch(coupon._id, { usedCount: coupon.usedCount + 1 });
      }

      // Acreditar comisión al embajador (Fase 2)
      if (order.ambassadorId && order.commission && order.commission > 0) {
        const amb = await ctx.db.get(order.ambassadorId);
        if (amb) {
          await ctx.db.patch(order.ambassadorId, {
            accruedCommission: amb.accruedCommission + order.commission,
            salesCount: amb.salesCount + 1,
            salesAmount: (amb.salesAmount ?? 0) + order.subtotal,
            lastSaleAt: Date.now(),
          });
          // Ascenso automático de nivel si alcanza el umbral configurado
          await promoteIfEligible(ctx, order.ambassadorId);
        }
      }

      await ctx.db.patch(order._id, { stockApplied: true });

      // Crear/actualizar registro de cliente en CRM
      await ctx.runMutation(internal.crm.upsertCustomerInternal, {
        name: order.customerName,
        email: order.customerEmail,
        phone: order.customerPhone,
        total: order.total,
        orderNumber: order.orderNumber,
        orderAt: Date.now(),
      });

      // Correo de confirmación al cliente
      await ctx.scheduler.runAfter(0, internal.emails.sendOrderConfirmation, {
        to: order.customerEmail,
        customerName: order.customerName,
        orderNumber: order.orderNumber,
        items: order.items.map((i) => ({ name: i.name, qty: i.qty, price: i.price })),
        subtotal: order.subtotal,
        shipping: order.shipping,
        discount: order.discount ?? 0,
        total: order.total,
        address: {
          calle: order.shippingAddress.calle,
          numero: order.shippingAddress.numero,
          colonia: order.shippingAddress.colonia,
          cp: order.shippingAddress.cp,
          ciudad: order.shippingAddress.ciudad,
          estado: order.shippingAddress.estado,
        },
      });

      // Aviso al dueño de que entró un pedido nuevo
      let ambCode: string | undefined;
      if (order.ambassadorId) {
        const amb = await ctx.db.get(order.ambassadorId);
        ambCode = amb?.code;
      }
      await ctx.scheduler.runAfter(0, internal.emails.sendOwnerNewOrder, {
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        customerPhone: order.customerPhone,
        items: order.items.map((i) => ({ name: i.name, qty: i.qty, price: i.price })),
        total: order.total,
        couponCode: order.couponCode,
        ambassadorCode: ambCode,
        city: order.shippingAddress.ciudad,
        state: order.shippingAddress.estado,
      });
    }

    return { ok: true };
  },
});

// Lista de órdenes recientes (panel admin).
export const listRecent = query({
  args: { adminKey: v.string() },
  handler: async (ctx, { adminKey }) => {
    assertAdmin(adminKey);
    const orders = await ctx.db.query("orders").order("desc").take(200);
    return orders;
  },
});

