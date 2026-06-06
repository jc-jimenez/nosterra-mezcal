import { NextResponse } from "next/server";
import { MercadoPagoConfig, Preference } from "mercadopago";
import { convexServer } from "@/lib/convex-server";
import { api } from "@/convex/_generated/api";

export const dynamic = "force-dynamic";

interface IncomingItem {
  slug: string;
  qty: number;
}
interface Body {
  items: IncomingItem[];
  customer: { name: string; email: string; phone?: string };
  shipping: {
    calle: string; numero: string; colonia: string; cp: string;
    ciudad: string; estado: string; pais: string; referencias?: string;
  };
  couponCode?: string;
}

function appUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    "https://www.nosterramezcal.com"
  );
}

export async function POST(request: Request) {
  try {
    const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!token) {
      return NextResponse.json(
        { error: "Pago con tarjeta no disponible (falta configurar Mercado Pago)." },
        { status: 503 }
      );
    }

    const body = (await request.json()) as Body;
    if (!body.items?.length) {
      return NextResponse.json({ error: "Carrito vacío" }, { status: 400 });
    }

    // 1. Validar productos y precios DESDE Convex (no confiar en el cliente)
    const validated: { productId: string; slug: string; name: string; price: number; qty: number }[] = [];
    for (const it of body.items) {
      const p = await convexServer.query(api.products.getBySlug, { slug: it.slug });
      if (!p || !p.isActive) {
        return NextResponse.json({ error: `Producto no disponible: ${it.slug}` }, { status: 400 });
      }
      const qty = Math.max(1, Math.floor(it.qty));
      validated.push({ productId: p._id, slug: p.slug, name: p.name, price: p.price, qty });
    }
    const subtotal = validated.reduce((s, i) => s + i.price * i.qty, 0);

    // 2. Configuración (envío)
    const settings = await convexServer.query(api.settings.get, {});
    const freeShippingFrom = settings.freeShippingFrom ?? 1500;
    const baseShipping = ("shippingCost" in settings && settings.shippingCost != null) ? settings.shippingCost : 150;

    // 3. Validar cupón (si viene)
    let discount = 0;
    let couponFreeShip = false;
    let couponCode: string | undefined;
    let ambassadorId: string | undefined;
    let commission = 0;
    if (body.couponCode?.trim()) {
      const res = await convexServer.query(api.coupons.validate, { code: body.couponCode, subtotal });
      if (res.ok) {
        discount = res.discount;
        couponFreeShip = res.freeShipping;
        couponCode = res.code;
        ambassadorId = res.ambassadorId ?? undefined;
        // Comisión del embajador (si el cupón es de un embajador)
        if (ambassadorId) {
          const pct = await convexServer.query(api.ambassadors.getCommissionPct, {
            id: ambassadorId as never,
          });
          commission = Math.round((subtotal * pct) / 100);
        }
      }
    }

    // 4. Totales (servidor = fuente de verdad)
    const freeShip = subtotal >= freeShippingFrom || couponFreeShip;
    const shipping = freeShip ? 0 : baseShipping;
    const discountedSubtotal = Math.max(0, subtotal - discount);
    const total = discountedSubtotal + shipping;

    // 5. Crear la orden en Convex
    const { orderNumber } = await convexServer.mutation(api.orders.create, {
      customerName: body.customer.name,
      customerEmail: body.customer.email,
      customerPhone: body.customer.phone,
      shippingAddress: body.shipping,
      items: validated.map((i) => ({ productId: i.productId as never, slug: i.slug, name: i.name, price: i.price, qty: i.qty })),
      subtotal,
      shipping,
      discount: discount || undefined,
      couponCode,
      ambassadorId: ambassadorId as never,
      commission: commission || undefined,
      total,
    });

    // 6. Preferencia de Mercado Pago
    const mpItems =
      discount > 0
        ? [
            {
              id: "pedido",
              title: `NOSTERRA Mezcal — ${validated.reduce((n, i) => n + i.qty, 0)} producto(s)${couponCode ? " (con descuento)" : ""}`,
              quantity: 1,
              unit_price: discountedSubtotal,
              currency_id: "MXN",
            },
          ]
        : validated.map((i) => ({
            id: i.slug,
            title: i.name,
            quantity: i.qty,
            unit_price: i.price,
            currency_id: "MXN",
          }));
    if (shipping > 0) {
      mpItems.push({ id: "shipping", title: "Envío", quantity: 1, unit_price: shipping, currency_id: "MXN" });
    }

    const client = new MercadoPagoConfig({ accessToken: token });
    const pref = await new Preference(client).create({
      body: {
        items: mpItems,
        payer: { name: body.customer.name, email: body.customer.email },
        external_reference: orderNumber,
        back_urls: {
          success: `${appUrl()}/checkout/gracias?order=${orderNumber}`,
          failure: `${appUrl()}/checkout/gracias?order=${orderNumber}`,
          pending: `${appUrl()}/checkout/gracias?order=${orderNumber}`,
        },
        auto_return: "approved",
        notification_url: `${appUrl()}/api/webhook/mercadopago`,
        statement_descriptor: "NOSTERRA MEZCAL",
      },
    });

    return NextResponse.json({
      checkoutUrl: pref.init_point,
      orderNumber,
      summary: { subtotal, discount, shipping, total },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error";
    console.error("[checkout]", message);
    return NextResponse.json({ error: "No se pudo iniciar el pago. Intenta de nuevo." }, { status: 500 });
  }
}
