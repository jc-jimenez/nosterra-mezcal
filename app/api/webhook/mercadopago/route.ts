import { NextResponse } from "next/server";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { convexServer } from "@/lib/convex-server";
import { api } from "@/convex/_generated/api";

export const dynamic = "force-dynamic";

// Webhook de notificaciones de pago de Mercado Pago.
// No confiamos en el payload: consultamos el pago real a la API de MP.
export async function POST(request: Request) {
  try {
    const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
    const serverSecret = process.env.SERVER_SECRET;
    if (!token || !serverSecret) return NextResponse.json({ ok: true });

    const url = new URL(request.url);
    const body = await request.json().catch(() => ({} as Record<string, unknown>));

    // El id del pago llega en query (?data.id=) o en el body ({ data: { id } })
    const type = url.searchParams.get("type") || url.searchParams.get("topic") || (body as { type?: string }).type;
    const paymentId =
      url.searchParams.get("data.id") ||
      ((body as { data?: { id?: string } }).data?.id) ||
      url.searchParams.get("id");

    if (type !== "payment" || !paymentId) {
      return NextResponse.json({ ok: true }); // ignorar otros eventos
    }

    // Consultar el pago real a Mercado Pago
    const client = new MercadoPagoConfig({ accessToken: token });
    const payment = await new Payment(client).get({ id: String(paymentId) });

    const orderNumber = payment.external_reference;
    const status = payment.status; // approved | rejected | in_process | pending
    if (!orderNumber || !status) return NextResponse.json({ ok: true });

    const mapped =
      status === "approved" || status === "rejected" || status === "in_process"
        ? status
        : "pending";

    await convexServer.mutation(api.orders.markPayment, {
      serverSecret,
      orderNumber,
      paymentId: String(paymentId),
      paymentStatus: mapped as "approved" | "rejected" | "in_process" | "pending",
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[mp webhook]", err instanceof Error ? err.message : err);
    // Responder 200 para que MP no reintente indefinidamente si fue un evento no manejable
    return NextResponse.json({ ok: true });
  }
}
