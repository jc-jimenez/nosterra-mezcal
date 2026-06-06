"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useCart } from "@/hooks/useCart";
import { formatMXN } from "@/lib/store-config";
import { CheckCircle, Clock, XCircle } from "lucide-react";

function GraciasInner() {
  const params = useSearchParams();
  const orderNumber = params.get("order") ?? "";
  const urlStatus = params.get("status") ?? params.get("collection_status") ?? "";
  const clear = useCart((s) => s.clear);

  const order = useQuery(
    api.orders.getByNumber,
    orderNumber ? { orderNumber } : "skip"
  );

  // Preferimos el estado confirmado en Convex (vía webhook); si aún no llega, el de la URL.
  const status = order?.paymentStatus ?? urlStatus;
  const approved = status === "approved";

  useEffect(() => {
    if (approved) clear();
  }, [approved, clear]);

  let icon = <Clock className="h-9 w-9 text-gold" />;
  let title = "Procesando tu pago…";
  let message =
    "Estamos confirmando tu pago. Esto puede tardar unos segundos. No cierres esta página.";

  if (approved) {
    icon = <CheckCircle className="h-9 w-9 text-emerald-400" />;
    title = "¡Gracias por tu compra!";
    message =
      "Tu pago fue aprobado. Te enviaremos la confirmación y los datos de envío por correo y WhatsApp. ¡Salud!";
  } else if (status === "rejected") {
    icon = <XCircle className="h-9 w-9 text-red-400" />;
    title = "El pago no se completó";
    message =
      "Tu pago fue rechazado o cancelado. No te preocupes, no se realizó ningún cargo. Puedes intentar de nuevo.";
  } else if (status === "in_process" || status === "pending") {
    icon = <Clock className="h-9 w-9 text-gold" />;
    title = "Pago en proceso";
    message =
      "Tu pago está siendo procesado. Te avisaremos en cuanto se confirme. Recibirás la confirmación por correo.";
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full border border-gold/30 bg-gold/10">
        {icon}
      </div>
      <h1 className="mt-6 font-display text-4xl font-light text-ivory">{title}</h1>
      <p className="mt-3 max-w-md font-body text-sm leading-relaxed text-muted">{message}</p>

      {orderNumber && (
        <div className="mt-6 rounded-xl border border-gold/15 bg-smoke px-6 py-4">
          <p className="font-body text-[11px] uppercase tracking-[0.2em] text-muted">Número de orden</p>
          <p className="font-mono text-lg text-ivory">{orderNumber}</p>
          {order && (
            <p className="mt-1 font-body text-sm text-gold">Total: {formatMXN(order.total)}</p>
          )}
        </div>
      )}

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        {status === "rejected" ? (
          <Link href="/checkout" className="border border-gold bg-gold px-8 py-3 font-body text-sm uppercase tracking-[0.15em] text-obsidian transition-colors hover:bg-gold-light">
            Intentar de nuevo
          </Link>
        ) : (
          <Link href="/" className="border border-gold bg-gold px-8 py-3 font-body text-sm uppercase tracking-[0.15em] text-obsidian transition-colors hover:bg-gold-light">
            Volver al inicio
          </Link>
        )}
        <Link href="/#tienda" className="border border-ivory/30 px-8 py-3 font-body text-sm uppercase tracking-[0.15em] text-ivory transition-colors hover:border-gold hover:text-gold">
          Seguir comprando
        </Link>
      </div>
    </main>
  );
}

export default function GraciasPage() {
  return (
    <Suspense fallback={null}>
      <GraciasInner />
    </Suspense>
  );
}
