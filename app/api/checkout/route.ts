import { NextResponse } from "next/server";
import { MercadoPagoConfig, Preference } from "mercadopago";
import { convexServer } from "@/lib/convex-server";
import { api } from "@/convex/_generated/api";

export const dynamic = "force-dynamic";

interface CartItem {
  slug: string;
  name: string;
  price: number;
  qty: number;
}
interface Body {
  items: CartItem[];
  customer: { name: string; email: string; phone?: string };
  shipping: {
    calle: string; numero: string; colonia: string; cp: string;
    ciudad: string; estado: string; pais: string; referencias?: string;
  };
  subtotal: number;
  shippingCost: number;
  total: number;
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

    // 1. Crear la orden pendiente en Convex
    const { orderNumber } = await convexServer.mutation(api.orders.create, {
      customerName: body.customer.name,
      customerEmail: body.customer.email,
      customerPhone: body.customer.phone,
      shippingAddress: body.shipping,
      items: body.items.map((i) => ({ slug: i.slug, name: i.name, price: i.price, qty: i.qty })),
      subtotal: body.subtotal,
      shipping: body.shippingCost,
      total: body.total,
    });

    // 2. Construir los items de la preferencia
    const mpItems = body.items.map((i) => ({
      id: i.slug,
      title: i.name,
      quantity: i.qty,
      unit_price: i.price,
      currency_id: "MXN",
    }));
    if (body.shippingCost > 0) {
      mpItems.push({
        id: "shipping",
        title: "Envío",
        quantity: 1,
        unit_price: body.shippingCost,
        currency_id: "MXN",
      });
    }

    // 3. Crear la preferencia de Checkout Pro
    const client = new MercadoPagoConfig({ accessToken: token });
    const pref = await new Preference(client).create({
      body: {
        items: mpItems,
        payer: {
          name: body.customer.name,
          email: body.customer.email,
        },
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

    return NextResponse.json({ checkoutUrl: pref.init_point, orderNumber });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error";
    console.error("[checkout]", message);
    return NextResponse.json({ error: "No se pudo iniciar el pago. Intenta de nuevo." }, { status: 500 });
  }
}
