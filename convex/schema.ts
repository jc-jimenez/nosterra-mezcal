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
    // Correos de aviso interno (configurables desde el panel)
    notifyOrdersEmail: v.optional(v.string()),      // recibe avisos de pedidos nuevos
    notifyAmbassadorsEmail: v.optional(v.string()), // recibe avisos de nuevas solicitudes de embajador
    // Programa de embajadores (Fase 2) — comisión por nivel + descuento al cliente
    ambassador: v.optional(
      v.object({
        tierNormal: v.number(), // % comisión nivel normal
        tierPlata: v.number(),
        tierOro: v.number(),
        customerDiscount: v.number(), // % de descuento al cliente que usa un código de embajador
        // Ascenso automático de nivel (configurable por el admin)
        thresholdMetric: v.optional(v.union(v.literal("sales"), v.literal("amount"))), // por nº de ventas o monto vendido
        plataMin: v.optional(v.number()), // umbral para subir a Plata
        oroMin: v.optional(v.number()), // umbral para subir a Oro
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
    name: v.string(), // nombre completo (Nombre + Apellidos), se compone al registrarse
    email: v.string(),
    code: v.string(), // su código personal (también existe como cupón)
    pin: v.optional(v.string()), // PIN para acceder a su panel y redimir
    // Datos personales (obligatorios al registrarse: nombre, apellidos, correo, whatsapp)
    apellidoPaterno: v.optional(v.string()),
    apellidoMaterno: v.optional(v.string()),
    whatsapp: v.optional(v.string()),
    // Datos opcionales (se piden después; obligatorios para cobrar en efectivo)
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
    // Datos bancarios para transferencia (Plata/Oro)
    clabe: v.optional(v.string()),
    banco: v.optional(v.string()),
    titularCuenta: v.optional(v.string()),
    tier: v.union(v.literal("normal"), v.literal("plata"), v.literal("oro")),
    commissionPct: v.number(), // % de comisión (según nivel, ajustable)
    customerDiscountPct: v.number(), // % de descuento que da a sus clientes
    accruedCommission: v.number(), // comisión acumulada (MXN)
    paidCommission: v.number(), // comisión ya pagada/redimida (MXN)
    salesCount: v.number(),
    salesAmount: v.optional(v.number()), // monto total vendido con su código (MXN)
    lastSaleAt: v.optional(v.number()), // timestamp de su última venta
    crmNotes: v.optional(v.string()), // notas internas del admin sobre el embajador
    isActive: v.boolean(),
    status: v.union(
      v.literal("pending"), // postulación por revisar
      v.literal("active"),
      v.literal("rejected")
    ),
  })
    .index("by_code", ["code"])
    .index("by_email", ["email"]),

  // Solicitudes de pago en efectivo (transferencia) generadas al redimir comisión
  payouts: defineTable({
    ambassadorId: v.id("ambassadors"),
    ambassadorName: v.string(),
    ambassadorCode: v.string(),
    cashAmount: v.number(), // monto a pagar por transferencia (MXN)
    couponAmount: v.number(), // monto entregado como cupón en la misma redención
    couponCode: v.optional(v.string()), // cupón generado por la parte de producto
    bank: v.optional(
      v.object({
        clabe: v.optional(v.string()),
        banco: v.optional(v.string()),
        titular: v.optional(v.string()),
        rfc: v.optional(v.string()),
      })
    ),
    status: v.union(
      v.literal("pending"), // por transferir
      v.literal("paid"), // transferencia realizada
      v.literal("rejected")
    ),
    createdAt: v.number(),
    paidAt: v.optional(v.number()),
    note: v.optional(v.string()),
  })
    .index("by_ambassador", ["ambassadorId"])
    .index("by_status", ["status"]),

  // Órdenes de compra (pago con tarjeta vía Mercado Pago)
  orders: defineTable({
    orderNumber: v.string(),
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
    discount: v.optional(v.number()),
    couponCode: v.optional(v.string()),
    ambassadorId: v.optional(v.id("ambassadors")),
    commission: v.optional(v.number()),
    total: v.number(),
    status: v.union(
      v.literal("pending"),    // esperando pago
      v.literal("nuevo"),      // pago aprobado, entra al CRM
      v.literal("confirmado"), // tú confirmas que tienes stock
      v.literal("preparando"), // empacando
      v.literal("enviado"),    // tiene guía de rastreo
      v.literal("en_camino"),  // paquetería lo tiene
      v.literal("entregado"),  // paquetería confirma entrega
      v.literal("cerrado"),    // pedido completado, va al historial
      v.literal("cancelled")
    ),
    paymentStatus: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("in_process")
    ),
    paymentId: v.optional(v.string()),
    stockApplied: v.boolean(),
    // CRM
    isManual: v.optional(v.boolean()),        // pedido capturado manualmente
    paymentMethod: v.optional(v.string()),    // efectivo, transferencia, etc. (manual)
    trackingNumber: v.optional(v.string()),  // número de guía
    carrier: v.optional(v.string()),          // DHL, FedEx, Estafeta…
    adminNotes: v.optional(v.string()),       // notas internas
    closedAt: v.optional(v.number()),         // timestamp de cierre
    // Historial de cambios de estado
    statusHistory: v.optional(v.array(v.object({
      status: v.string(),
      at: v.number(),
      note: v.optional(v.string()),
    }))),
  })
    .index("by_order_number", ["orderNumber"])
    .index("by_email", ["customerEmail"])
    .index("by_status", ["status"]),

  // Campañas de motivación a embajadores (correos masivos)
  campaigns: defineTable({
    subject: v.string(),
    body: v.string(), // texto plano / markdown simple
    audience: v.union(
      v.literal("all"),       // todos los activos
      v.literal("oro"),
      v.literal("plata"),
      v.literal("normal"),
      v.literal("inactivos")  // activos sin ventas o sin vender hace tiempo
    ),
    sentCount: v.number(),
    createdAt: v.number(),
  }),

  // Clientes (se crean/actualizan automáticamente al pagar)
  customers: defineTable({
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    totalSpent: v.number(),
    orderCount: v.number(),
    lastOrderAt: v.number(),
    lastOrderNumber: v.optional(v.string()),
    // Notas del admin
    notes: v.optional(v.string()),
    tags: v.optional(v.array(v.string())), // ej. ["vip", "mayorista"]
  })
    .index("by_email", ["email"])
    .index("by_total", ["totalSpent"]),
});
