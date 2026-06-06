"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChevronLeft, ShoppingBag, ShieldCheck, Truck, CreditCard } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import { formatMXN } from "@/lib/store-config";

const inputClass =
  "w-full border border-gold/20 bg-obsidian/60 px-4 py-3 font-body text-sm text-ivory placeholder:text-muted/60 focus:border-gold focus:outline-none transition-colors";

// Estados de México (envíos disponibles solo dentro del país)
const ESTADOS_MX = [
  "Aguascalientes", "Baja California", "Baja California Sur", "Campeche",
  "Chiapas", "Chihuahua", "Ciudad de México", "Coahuila", "Colima",
  "Durango", "Estado de México", "Guanajuato", "Guerrero", "Hidalgo",
  "Jalisco", "Michoacán", "Morelos", "Nayarit", "Nuevo León", "Oaxaca",
  "Puebla", "Querétaro", "Quintana Roo", "San Luis Potosí", "Sinaloa",
  "Sonora", "Tabasco", "Tamaulipas", "Tlaxcala", "Veracruz", "Yucatán",
  "Zacatecas",
];

interface Form {
  pais: string;
  nombre: string;
  telefono: string;
  email: string;
  calle: string;
  numero: string;
  colonia: string;
  cp: string;
  ciudad: string;
  estado: string;
  referencias: string;
}

const EMPTY: Form = {
  pais: "México", nombre: "", telefono: "", email: "", calle: "", numero: "",
  colonia: "", cp: "", ciudad: "", estado: "", referencias: "",
};

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, clear } = useCart();
  const settings = useStoreSettings();
  const [mounted, setMounted] = useState(false);
  const [form, setForm] = useState<Form>(EMPTY);
  const [done, setDone] = useState(false);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => setMounted(true), []);

  const total = mounted ? subtotal() : 0;
  const freeShip = total >= settings.freeShippingFrom;
  const shippingCost = freeShip ? 0 : 0; // costo de envío se confirma aparte; 0 por ahora
  const outsideMexico = form.pais !== "México";

  function set<K extends keyof Form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  // Pago con tarjeta habilitado (Mercado Pago configurado). Para desactivarlo,
  // poner NEXT_PUBLIC_CARD_PAYMENTS = "false".
  const cardEnabled = process.env.NEXT_PUBLIC_CARD_PAYMENTS !== "false";

  function onFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (outsideMexico) return;
    if (cardEnabled) void payWithCard();
    else sendWhatsApp();
  }

  // Pago con tarjeta (Mercado Pago)
  async function payWithCard() {
    if (outsideMexico || paying) return;
    setPaying(true);
    setPayError("");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({ slug: i.slug, name: i.name, price: i.price, qty: i.qty })),
          customer: { name: form.nombre, email: form.email || "sin-correo@nosterramezcal.com", phone: form.telefono },
          shipping: {
            calle: form.calle, numero: form.numero, colonia: form.colonia, cp: form.cp,
            ciudad: form.ciudad, estado: form.estado, pais: form.pais, referencias: form.referencias,
          },
          subtotal: total,
          shippingCost,
          total: total + shippingCost,
        }),
      });
      const data = await res.json();
      if (res.ok && data.checkoutUrl) {
        window.location.href = data.checkoutUrl; // a la pasarela de Mercado Pago
      } else {
        setPayError(data.error ?? "No se pudo iniciar el pago.");
        setPaying(false);
      }
    } catch {
      setPayError("Error de conexión. Intenta de nuevo.");
      setPaying(false);
    }
  }

  // Pedido por WhatsApp (alternativa)
  function sendWhatsApp() {
    if (outsideMexico) return;

    const productos = items
      .map((i) => `• ${i.qty}× ${i.name} — ${formatMXN(i.price * i.qty)}`)
      .join("\n");

    const envio = freeShip ? "GRATIS" : "por confirmar";

    const msg =
      `¡Hola NOSTERRA! Quiero hacer un pedido:\n\n` +
      `*PRODUCTOS*\n${productos}\n` +
      `Subtotal: ${formatMXN(total)}\n` +
      `Envío: ${envio}\n\n` +
      `*DATOS DE ENVÍO*\n` +
      `Nombre: ${form.nombre}\n` +
      `Teléfono: ${form.telefono}\n` +
      (form.email ? `Email: ${form.email}\n` : "") +
      `Dirección: ${form.calle} #${form.numero}, Col. ${form.colonia}\n` +
      `CP ${form.cp}, ${form.ciudad}, ${form.estado}, ${form.pais}\n` +
      (form.referencias ? `Referencias: ${form.referencias}\n` : "") +
      `\n¿Me confirman disponibilidad, costo de envío y forma de pago? Gracias.`;

    const url = `https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
    clear();
    setDone(true);
  }

  // Carrito vacío
  if (mounted && items.length === 0 && !done) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <ShoppingBag className="h-12 w-12 text-muted/40" />
        <h1 className="mt-6 font-display text-3xl text-ivory">Tu carrito está vacío</h1>
        <p className="mt-2 font-body text-sm text-muted">Agrega un mezcal para continuar.</p>
        <Link href="/#tienda" className="mt-8 border border-gold bg-gold px-8 py-3 font-body text-sm uppercase tracking-[0.15em] text-obsidian transition-colors hover:bg-gold-light">
          Ir a la tienda
        </Link>
      </main>
    );
  }

  // Confirmación
  if (done) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full border border-gold/30 bg-gold/10">
          <ShieldCheck className="h-8 w-8 text-gold" />
        </div>
        <h1 className="mt-6 font-display text-4xl text-ivory">¡Pedido enviado!</h1>
        <p className="mt-3 max-w-md font-body text-sm leading-relaxed text-muted">
          Abrimos WhatsApp con tu pedido y datos de envío. Si no se abrió,
          revisa tu navegador. Te confirmaremos disponibilidad, envío y pago en el chat.
        </p>
        <Link href="/" className="mt-8 border border-gold bg-gold px-8 py-3 font-body text-sm uppercase tracking-[0.15em] text-obsidian transition-colors hover:bg-gold-light">
          Volver al inicio
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-6 py-12 lg:px-10">
      <div className="mx-auto max-w-5xl">
        <Link href="/#tienda" className="inline-flex items-center gap-1.5 font-body text-xs uppercase tracking-[0.15em] text-muted transition-colors hover:text-gold">
          <ChevronLeft className="h-3.5 w-3.5" /> Seguir comprando
        </Link>

        <h1 className="mt-6 font-display text-4xl font-light text-ivory">
          Finalizar <span className="italic text-gradient-gold">compra</span>
        </h1>
        <p className="mt-2 font-body text-sm text-muted">
          Completa tus datos de envío. Confirmamos disponibilidad y pago por WhatsApp.
        </p>

        <div className="mt-10 grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
          {/* Formulario */}
          <form ref={formRef} onSubmit={onFormSubmit} className="space-y-4">
            <h2 className="font-body text-xs uppercase tracking-[0.25em] text-gold">Datos de envío</h2>

            {/* País — solo México disponible por ahora */}
            <div>
              <select required className={inputClass} value={form.pais} onChange={(e) => set("pais", e.target.value)}>
                <option value="México">México 🇲🇽</option>
                <option value="Otro">Otro país (fuera de México)</option>
              </select>
              {outsideMexico && (
                <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3">
                  <span className="mt-0.5 text-amber-400">⚠</span>
                  <p className="font-body text-sm text-amber-200/90">
                    Por el momento solo realizamos envíos <strong>dentro de México</strong>.
                    Muy pronto llegaremos a más países. ¡Gracias por tu interés en NOSTERRA!
                  </p>
                </div>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <input required placeholder="Nombre completo" className={inputClass} value={form.nombre} onChange={(e) => set("nombre", e.target.value)} />
              <input required type="tel" placeholder="Teléfono / WhatsApp" className={inputClass} value={form.telefono} onChange={(e) => set("telefono", e.target.value)} />
            </div>
            <input type="email" placeholder="Correo electrónico (opcional)" className={inputClass} value={form.email} onChange={(e) => set("email", e.target.value)} />
            <div className="grid gap-4 sm:grid-cols-[1fr_0.4fr]">
              <input required placeholder="Calle" className={inputClass} value={form.calle} onChange={(e) => set("calle", e.target.value)} />
              <input required placeholder="Número" className={inputClass} value={form.numero} onChange={(e) => set("numero", e.target.value)} />
            </div>
            <input required placeholder="Colonia" className={inputClass} value={form.colonia} onChange={(e) => set("colonia", e.target.value)} />
            <div className="grid gap-4 sm:grid-cols-3">
              <input required placeholder="C.P." className={inputClass} value={form.cp} onChange={(e) => set("cp", e.target.value)} />
              <input required placeholder="Ciudad" className={inputClass} value={form.ciudad} onChange={(e) => set("ciudad", e.target.value)} />
              <select required disabled={outsideMexico} className={inputClass} value={form.estado} onChange={(e) => set("estado", e.target.value)}>
                <option value="" disabled>Estado</option>
                {ESTADOS_MX.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <textarea rows={2} placeholder="Referencias de entrega (opcional)" className={`${inputClass} resize-none`} value={form.referencias} onChange={(e) => set("referencias", e.target.value)} />

            {payError && (
              <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 font-body text-sm text-red-300">
                {payError}
              </p>
            )}

            {cardEnabled ? (
              <>
                {/* Primario: pago con tarjeta */}
                <button type="submit" disabled={outsideMexico || paying} className="flex w-full items-center justify-center gap-2 bg-gold px-6 py-4 font-body text-sm uppercase tracking-[0.15em] text-obsidian transition-colors hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-40">
                  <CreditCard className="h-4 w-4" />
                  {outsideMexico ? "Disponible solo en México" : paying ? "Redirigiendo al pago…" : "Pagar con tarjeta"}
                </button>

                <div className="flex items-center gap-3 py-1">
                  <span className="h-px flex-1 bg-gold/15" />
                  <span className="font-body text-[11px] uppercase tracking-[0.2em] text-muted/60">o</span>
                  <span className="h-px flex-1 bg-gold/15" />
                </div>

                {/* Secundario: WhatsApp */}
                <button
                  type="button"
                  disabled={outsideMexico}
                  onClick={() => { if (formRef.current?.reportValidity()) sendWhatsApp(); }}
                  className="flex w-full items-center justify-center gap-2 border border-gold/40 px-6 py-3.5 font-body text-sm uppercase tracking-[0.15em] text-gold transition-colors hover:bg-gold hover:text-obsidian disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ShoppingBag className="h-4 w-4" />
                  Pedir por WhatsApp
                </button>

                <p className="text-center font-body text-[11px] text-muted/60">
                  Pago seguro con Mercado Pago. Envíos solo dentro de México.
                </p>
              </>
            ) : (
              <>
                {/* Solo WhatsApp (pago con tarjeta aún no habilitado) */}
                <button type="submit" disabled={outsideMexico} className="flex w-full items-center justify-center gap-2 bg-gold px-6 py-4 font-body text-sm uppercase tracking-[0.15em] text-obsidian transition-colors hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-40">
                  <ShoppingBag className="h-4 w-4" />
                  {outsideMexico ? "Disponible solo en México" : "Enviar pedido por WhatsApp"}
                </button>
                <p className="text-center font-body text-[11px] text-muted/60">
                  Envíos solo dentro de México · No se cobra nada en este paso. El pago se acuerda por WhatsApp.
                </p>
              </>
            )}
          </form>

          {/* Resumen */}
          <aside className="h-fit rounded-2xl border border-gold/15 bg-smoke p-6">
            <h2 className="font-body text-xs uppercase tracking-[0.25em] text-gold">Tu pedido</h2>
            <ul className="mt-5 space-y-4">
              {mounted && items.map((i) => (
                <li key={i.slug} className="flex gap-3">
                  <div className="h-16 w-12 flex-shrink-0 overflow-hidden rounded bg-obsidian/60">
                    <Image src={i.image} alt={i.name} width={60} height={80} className="h-full w-full object-contain" />
                  </div>
                  <div className="flex flex-1 flex-col">
                    <span className="font-body text-sm text-ivory">{i.name}</span>
                    <span className="font-body text-xs text-muted">Cantidad: {i.qty}</span>
                  </div>
                  <span className="font-display text-base text-ivory">{formatMXN(i.price * i.qty)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-5 space-y-2 border-t border-gold/10 pt-5 font-body text-sm">
              <div className="flex justify-between text-muted">
                <span>Subtotal</span><span className="text-ivory">{formatMXN(total)}</span>
              </div>
              <div className="flex justify-between text-muted">
                <span>Envío</span>
                <span className={freeShip ? "text-agave-light" : "text-muted"}>
                  {freeShip ? "Gratis" : "Por confirmar"}
                </span>
              </div>
            </div>
            <p className="mt-4 flex items-center gap-1.5 font-body text-[11px] text-muted/70">
              <Truck className="h-3.5 w-3.5 text-gold" /> {settings.shippingNote}
            </p>
          </aside>
        </div>
      </div>
    </main>
  );
}
