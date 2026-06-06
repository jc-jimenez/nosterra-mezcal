"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from "@/components/store/CartDrawer";
import { Sparkles, Gift, TrendingUp, Check, Copy, Crown, ChevronDown, MessageCircle } from "lucide-react";

const inputClass =
  "w-full border border-gold/30 bg-obsidian/60 px-4 py-3 font-body text-sm text-ivory placeholder:text-ivory/55 focus:border-gold focus:outline-none transition-colors";

const EMB_SESSION = "nosterra_emb_session";

export default function EmbajadoresPage() {
  return (
    <>
      <Navbar />
      <CartDrawer />
      <main className="flex-1 pt-24">
        <ApplySection />
      </main>
      <Footer />
    </>
  );
}

function ApplySection() {
  return (
    <section className="bg-greca bg-obsidian py-16">
      <div className="mx-auto grid max-w-7xl gap-8 px-6 lg:grid-cols-3 lg:items-start">
        <Intro />
        <ApplyForm />
        <AccountPanel />
      </div>
    </section>
  );
}

function Intro() {
  const settings = useStoreSettings();
  const amb = settings.ambassador;
  const tN = amb?.tierNormal ?? 2, tP = amb?.tierPlata ?? 3, tO = amb?.tierOro ?? 5;
  const cd = amb?.customerDiscount ?? 5;
  const plataMin = amb?.plataMin ?? 10, oroMin = amb?.oroMin ?? 25;
  const byAmount = amb?.thresholdMetric === "amount";
  const fmt = (n: number) => (byAmount ? `$${n.toLocaleString("es-MX")} en ventas` : `${n} ventas`);

  const defComision = `Ganas un porcentaje de comisión sobre cada compra hecha con tu código: Normal ${tN}%, Plata ${tP}% y Oro ${tO}%. Se calcula sobre el subtotal (sin envío) y se acredita en cuanto el pago se confirma. La puedes redimir en efectivo (niveles Plata y Oro) o en cupón. No tiene costo ni cuotas: solo compartes tu código.`;
  const defDescuento = `Quien compre usando tu código recibe ${cd}% de descuento. Es un incentivo extra para que te compren a ti y para que tus recomendados se animen a probar NOSTERRA.`;
  const defNiveles = `Empiezas en Normal (${tN}%). Al acumular ${fmt(plataMin)} subes a Plata (${tP}%) y con ${fmt(oroMin)} llegas a Oro (${tO}%). El ascenso es automático: a mayor nivel, mayor comisión y más libertad para cobrar en efectivo.`;

  const benefits = [
    { icon: TrendingUp, title: "Gana comisión", short: `Comisión por cada venta con tu código (hasta ${tO}%).`, info: amb?.infoComision?.trim() || defComision },
    { icon: Gift, title: "Premia a tus amigos", short: `Quien use tu código recibe ${cd}% de descuento.`, info: amb?.infoDescuento?.trim() || defDescuento },
    { icon: Crown, title: "Sube de nivel", short: "Normal, Plata y Oro: a mayor nivel, mayor comisión.", info: amb?.infoNiveles?.trim() || defNiveles },
  ];

  const [open, setOpen] = useState<number | null>(null);
  const [showDudas, setShowDudas] = useState(false);

  return (
    <div>
      <p className="font-body text-xs uppercase tracking-[0.3em] text-gold">Programa de embajadores</p>
      <h1 className="mt-4 font-display text-4xl font-light leading-tight text-ivory">
        Comparte NOSTERRA, <span className="italic text-gradient-gold">gana con cada botella</span>
      </h1>
      <p className="mt-4 font-body text-sm leading-relaxed text-muted">
        ¿Amas nuestro mezcal? Conviértete en embajador de marca: recibe tu código personal,
        tus referidos obtienen descuento y tú ganas comisión que te pagamos con cupones.
      </p>
      <div className="mt-8 space-y-3">
        {benefits.map((b, i) => (
          <div key={b.title} className="overflow-hidden rounded-2xl border border-gold/15 bg-smoke">
            <button onClick={() => setOpen(open === i ? null : i)} className="flex w-full items-start gap-4 p-5 text-left transition-colors hover:bg-gold/5">
              <b.icon className="h-6 w-6 flex-shrink-0 text-gold" />
              <div className="flex-1">
                <h3 className="font-display text-lg text-ivory">{b.title}</h3>
                <p className="mt-0.5 font-body text-sm text-muted">{b.short}</p>
              </div>
              <ChevronDown className={`h-4 w-4 flex-shrink-0 text-gold transition-transform ${open === i ? "rotate-180" : ""}`} />
            </button>
            {open === i && (
              <div className="border-t border-gold/10 px-5 py-4">
                <p className="font-body text-sm leading-relaxed text-muted whitespace-pre-line">{b.info}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ¿Tienes dudas? */}
      <div className="mt-5">
        <button onClick={() => setShowDudas((v) => !v)} className="flex items-center gap-2 font-body text-sm text-gold hover:text-gold-light">
          <MessageCircle className="h-4 w-4" /> ¿Tienes dudas? Escríbenos
        </button>
        {showDudas && <DudasForm onClose={() => setShowDudas(false)} />}
      </div>
    </div>
  );
}

function DudasForm({ onClose }: { onClose: () => void }) {
  const createInquiry = useMutation(api.crm.createInquiry);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !contact.trim() || !message.trim()) return;
    setSending(true);
    try {
      await createInquiry({ name, contact, message });
      setSent(true);
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <div className="mt-3 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-5 text-center">
        <p className="font-body text-sm text-emerald-200">¡Gracias! Recibimos tu mensaje y te contactaremos pronto.</p>
        <button onClick={onClose} className="mt-2 font-body text-[11px] text-muted/70 underline">Cerrar</button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mt-3 space-y-3 rounded-2xl border border-gold/15 bg-smoke p-5">
      <p className="font-body text-xs text-muted">Cuéntanos tu duda y te respondemos por correo o WhatsApp.</p>
      <input required placeholder="Tu nombre" className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
      <input required placeholder="Correo o WhatsApp" className={inputClass} value={contact} onChange={(e) => setContact(e.target.value)} />
      <textarea required rows={3} placeholder="¿Qué te gustaría saber?" className={`${inputClass} resize-none`} value={message} onChange={(e) => setMessage(e.target.value)} />
      <button type="submit" disabled={sending} className="w-full bg-gold px-6 py-3 font-body text-sm uppercase tracking-[0.15em] text-obsidian transition-colors hover:bg-gold-light disabled:opacity-50">
        {sending ? "Enviando…" : "Enviar mensaje"}
      </button>
    </form>
  );
}

function ApplyForm() {
  const apply = useMutation(api.ambassadors.apply);
  const [f, setF] = useState({
    nombre: "", apellidoPaterno: "", apellidoMaterno: "", email: "", whatsapp: "",
    phone: "", rfc: "", curp: "", calle: "", numero: "", colonia: "", cp: "", ciudad: "", estado: "",
  });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF((p) => ({ ...p, [k]: e.target.value }));
  const [showOptional, setShowOptional] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ code: string; pin?: string; status: string; alreadyExists: boolean } | null>(null);
  const [copied, setCopied] = useState(false);

  function copyText(text: string) {
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const address =
        f.calle || f.numero || f.colonia || f.cp || f.ciudad || f.estado
          ? { calle: f.calle, numero: f.numero, colonia: f.colonia, cp: f.cp, ciudad: f.ciudad, estado: f.estado, pais: "México" }
          : undefined;
      const r = await apply({
        nombre: f.nombre, apellidoPaterno: f.apellidoPaterno, apellidoMaterno: f.apellidoMaterno,
        email: f.email, whatsapp: f.whatsapp,
        phone: f.phone || undefined, rfc: f.rfc || undefined, curp: f.curp || undefined, address,
      });
      setResult({ code: r.code, pin: r.alreadyExists ? undefined : r.pin, status: r.status, alreadyExists: r.alreadyExists });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-2xl border border-gold/15 bg-smoke p-6 sm:p-7">
      <h2 className="font-display text-2xl text-ivory">Quiero ser embajador</h2>
      {result ? (
        <div className="mt-6 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-gold/30 bg-gold/10">
            <Sparkles className="h-7 w-7 text-gold" />
          </div>
          <p className="mt-4 font-display text-2xl text-ivory">
            {result.alreadyExists ? "¡Ya estás registrado!" : "¡Solicitud recibida!"}
          </p>
          <p className="mt-2 font-body text-sm text-muted">Tu código de embajador es:</p>
          <button onClick={() => copyText(result.code)} className="mx-auto mt-3 flex items-center gap-2 rounded-xl border border-gold/40 bg-gold/10 px-6 py-3 font-mono text-2xl tracking-widest text-gold hover:bg-gold/20">
            {result.code}
            {copied ? <Check className="h-5 w-5 text-emerald-400" /> : <Copy className="h-4 w-4 text-muted" />}
          </button>
          {result.pin && (
            <div className="mx-auto mt-4 max-w-xs rounded-xl border border-gold/20 bg-smoke px-4 py-3">
              <p className="font-body text-[11px] uppercase tracking-wide text-muted">Tu PIN (guárdalo)</p>
              <p className="font-mono text-2xl tracking-[0.3em] text-ivory">{result.pin}</p>
              <p className="mt-1 font-body text-[11px] text-muted/70">Lo necesitas para entrar a tu cuenta y redimir comisiones.</p>
            </div>
          )}
          <p className="mt-4 font-body text-xs leading-relaxed text-muted">
            {result.status === "active"
              ? "Tu código ya está activo. ¡Compártelo y empieza a ganar!"
              : "Tu cuenta está en revisión. En cuanto te aprobemos, tu código quedará activo."}
          </p>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-6 space-y-3">
          <input required placeholder="Nombre(s) *" className={inputClass} value={f.nombre} onChange={set("nombre")} />
          <div className="grid grid-cols-2 gap-3">
            <input required placeholder="Apellido paterno *" className={inputClass} value={f.apellidoPaterno} onChange={set("apellidoPaterno")} />
            <input required placeholder="Apellido materno *" className={inputClass} value={f.apellidoMaterno} onChange={set("apellidoMaterno")} />
          </div>
          <input required type="email" placeholder="Correo electrónico *" className={inputClass} value={f.email} onChange={set("email")} />
          <input required inputMode="tel" placeholder="WhatsApp * (10 dígitos)" className={inputClass} value={f.whatsapp} onChange={set("whatsapp")} />

          <button type="button" onClick={() => setShowOptional((v) => !v)} className="flex w-full items-center justify-between rounded-lg border border-gold/15 bg-smoke px-4 py-2.5 font-body text-xs uppercase tracking-wide text-muted hover:text-gold">
            <span>Datos adicionales (opcional)</span>
            <span>{showOptional ? "−" : "+"}</span>
          </button>
          {showOptional && (
            <div className="space-y-3 rounded-lg border border-gold/10 bg-smoke/50 p-4">
              <p className="font-body text-[11px] text-muted/70">Estos datos te los pediremos después; los necesitarás solo si decides cobrar comisiones en efectivo. Puedes dejarlos en blanco.</p>
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="Teléfono" className={inputClass} value={f.phone} onChange={set("phone")} />
                <input placeholder="RFC" className={inputClass} value={f.rfc} onChange={set("rfc")} />
              </div>
              <input placeholder="CURP" className={inputClass} value={f.curp} onChange={set("curp")} />
              <div className="grid grid-cols-3 gap-3">
                <input placeholder="Calle" className={`${inputClass} col-span-2`} value={f.calle} onChange={set("calle")} />
                <input placeholder="Número" className={inputClass} value={f.numero} onChange={set("numero")} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="Colonia" className={inputClass} value={f.colonia} onChange={set("colonia")} />
                <input placeholder="C.P." className={inputClass} value={f.cp} onChange={set("cp")} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="Ciudad" className={inputClass} value={f.ciudad} onChange={set("ciudad")} />
                <input placeholder="Estado" className={inputClass} value={f.estado} onChange={set("estado")} />
              </div>
            </div>
          )}

          <button type="submit" disabled={submitting} className="w-full bg-gold px-6 py-3.5 font-body text-sm uppercase tracking-[0.15em] text-obsidian transition-colors hover:bg-gold-light disabled:opacity-50">
            {submitting ? "Enviando…" : "Postularme"}
          </button>
          <p className="text-center font-body text-[11px] text-muted/60">
            * Campos obligatorios. Al postularte aceptas los{" "}
            <a href="/terminos-embajadores" target="_blank" className="text-gold/80 underline hover:text-gold">Términos del Programa de Embajadores</a>.
          </p>
        </form>
      )}
    </div>
  );
}

function AccountPanel() {
  const router = useRouter();
  const [lookupEmail, setLookupEmail] = useState("");
  const [lookupPin, setLookupPin] = useState("");
  const [queryEmail, setQueryEmail] = useState("");
  const [queryPin, setQueryPin] = useState("");
  const [checking, setChecking] = useState(false);
  const account = useQuery(
    api.ambassadors.getAccount,
    queryEmail && queryPin ? { email: queryEmail, pin: queryPin } : "skip"
  );

  useEffect(() => {
    if (!checking) return;
    if (account === undefined) return; // cargando
    if (account) {
      sessionStorage.setItem(EMB_SESSION, JSON.stringify({ email: queryEmail, pin: queryPin }));
      router.push("/embajadores/panel");
    } else {
      setChecking(false);
    }
  }, [account, checking, queryEmail, queryPin, router]);

  function enter() {
    setQueryEmail(lookupEmail.trim().toLowerCase());
    setQueryPin(lookupPin.trim());
    setChecking(true);
  }

  const failed = !checking && Boolean(queryEmail) && Boolean(queryPin) && account === null;

  return (
    <div className="rounded-2xl border border-gold/15 bg-smoke p-6 sm:p-7">
      <h2 className="font-display text-2xl text-ivory">Mi cuenta de embajador</h2>
      <p className="mt-2 font-body text-sm text-muted">Entra con tu correo y PIN para ver tus ventas y redimir tus comisiones.</p>
      <div className="mt-6 space-y-2">
        <input type="email" placeholder="Tu correo" className={inputClass} value={lookupEmail} onChange={(e) => setLookupEmail(e.target.value)} />
        <div className="flex gap-2">
          <input inputMode="numeric" maxLength={6} placeholder="PIN (6 dígitos)" className={inputClass} value={lookupPin} onChange={(e) => setLookupPin(e.target.value.replace(/\D/g, ""))} onKeyDown={(e) => { if (e.key === "Enter") enter(); }} />
          <button onClick={enter} disabled={checking || !lookupEmail || !lookupPin} className="border border-gold/40 px-5 font-body text-xs uppercase tracking-wide text-gold transition-colors hover:bg-gold hover:text-obsidian disabled:opacity-50">
            {checking ? "..." : "Entrar"}
          </button>
        </div>
      </div>
      {failed && <p className="mt-4 font-body text-sm text-red-300">Correo o PIN incorrectos. ¿Olvidaste tu PIN? Escríbenos.</p>}
    </div>
  );
}
