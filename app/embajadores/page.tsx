"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from "@/components/store/CartDrawer";
import { Sparkles, Gift, TrendingUp, Check, Copy, Crown } from "lucide-react";

const inputClass =
  "w-full border border-gold/20 bg-obsidian/60 px-4 py-3 font-body text-sm text-ivory placeholder:text-muted/60 focus:border-gold focus:outline-none transition-colors";

const TIER_LABEL: Record<string, string> = { normal: "Normal", plata: "Plata", oro: "Oro" };

export default function EmbajadoresPage() {
  return (
    <>
      <Navbar />
      <CartDrawer />
      <main className="flex-1 pt-24">
        <Hero />
        <Apply />
      </main>
      <Footer />
    </>
  );
}

function Hero() {
  const settings = useStoreSettings();
  const benefits = [
    { icon: TrendingUp, title: "Gana comisión", desc: `Recibe una comisión por cada venta hecha con tu código.` },
    { icon: Gift, title: "Premia a tus amigos", desc: `Quien use tu código recibe ${settings.ambassador?.customerDiscount ?? 5}% de descuento.` },
    { icon: Crown, title: "Sube de nivel", desc: "Normal, Plata y Oro: a mayor nivel, mayor comisión." },
  ];
  return (
    <section className="bg-greca bg-obsidian py-16">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <p className="font-body text-xs uppercase tracking-[0.3em] text-gold">Programa de embajadores</p>
        <h1 className="mt-4 font-display text-5xl font-light text-ivory">
          Comparte NOSTERRA, <span className="italic text-gradient-gold">gana con cada botella</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl font-body text-base leading-relaxed text-muted">
          ¿Amas nuestro mezcal? Conviértete en embajador de marca: recibe tu código personal,
          tus referidos obtienen descuento y tú ganas comisión que te pagamos con cupones.
        </p>
        <div className="mt-10 grid gap-5 sm:grid-cols-3">
          {benefits.map((b) => (
            <div key={b.title} className="rounded-2xl border border-gold/15 bg-smoke p-6 text-left">
              <b.icon className="h-6 w-6 text-gold" />
              <h3 className="mt-3 font-display text-xl text-ivory">{b.title}</h3>
              <p className="mt-1.5 font-body text-sm text-muted">{b.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Apply() {
  const apply = useMutation(api.ambassadors.apply);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ code: string; status: string; alreadyExists: boolean } | null>(null);

  // Consulta de cuenta
  const [lookupEmail, setLookupEmail] = useState("");
  const [queryEmail, setQueryEmail] = useState("");
  const account = useQuery(api.ambassadors.getByEmail, queryEmail ? { email: queryEmail } : "skip");
  const [copied, setCopied] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const r = await apply({ name, email });
      setResult({ code: r.code, status: r.status, alreadyExists: r.alreadyExists });
    } finally {
      setSubmitting(false);
    }
  }

  function copyCode(code: string) {
    navigator.clipboard?.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <section className="bg-smoke py-16">
      <div className="mx-auto grid max-w-5xl gap-10 px-6 lg:grid-cols-2">
        {/* Postularse */}
        <div className="rounded-2xl border border-gold/15 bg-obsidian/40 p-8">
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
              <button
                onClick={() => copyCode(result.code)}
                className="mx-auto mt-3 flex items-center gap-2 rounded-xl border border-gold/40 bg-gold/10 px-6 py-3 font-mono text-2xl tracking-widest text-gold hover:bg-gold/20"
              >
                {result.code}
                {copied ? <Check className="h-5 w-5 text-emerald-400" /> : <Copy className="h-4 w-4 text-muted" />}
              </button>
              <p className="mt-4 font-body text-xs leading-relaxed text-muted">
                {result.status === "active"
                  ? "Tu código ya está activo. ¡Compártelo y empieza a ganar!"
                  : "Tu cuenta está en revisión. En cuanto te aprobemos, tu código quedará activo y podrás compartirlo."}
              </p>
            </div>
          ) : (
            <form onSubmit={submit} className="mt-6 space-y-4">
              <input required placeholder="Nombre completo" className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
              <input required type="email" placeholder="Correo electrónico" className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} />
              <button type="submit" disabled={submitting} className="w-full bg-gold px-6 py-3.5 font-body text-sm uppercase tracking-[0.15em] text-obsidian transition-colors hover:bg-gold-light disabled:opacity-50">
                {submitting ? "Enviando…" : "Postularme"}
              </button>
              <p className="text-center font-body text-[11px] text-muted/60">
                Revisamos cada solicitud. Te contactamos por correo al aprobarte.
              </p>
            </form>
          )}
        </div>

        {/* Consultar cuenta */}
        <div className="rounded-2xl border border-gold/15 bg-obsidian/40 p-8">
          <h2 className="font-display text-2xl text-ivory">Ya soy embajador</h2>
          <p className="mt-2 font-body text-sm text-muted">Consulta tu código, nivel y comisiones.</p>
          <div className="mt-6 flex gap-2">
            <input
              type="email"
              placeholder="Tu correo"
              className={inputClass}
              value={lookupEmail}
              onChange={(e) => setLookupEmail(e.target.value)}
            />
            <button onClick={() => setQueryEmail(lookupEmail.trim().toLowerCase())} className="border border-gold/40 px-5 font-body text-xs uppercase tracking-wide text-gold transition-colors hover:bg-gold hover:text-obsidian">
              Consultar
            </button>
          </div>

          {queryEmail && account === null && (
            <p className="mt-4 font-body text-sm text-muted">No encontramos una cuenta con ese correo.</p>
          )}
          {account && (
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between rounded-xl border border-gold/15 bg-smoke px-4 py-3">
                <div>
                  <p className="font-body text-[11px] uppercase tracking-wide text-muted">Tu código</p>
                  <p className="font-mono text-xl tracking-widest text-gold">{account.code}</p>
                </div>
                <button onClick={() => copyCode(account.code)} className="text-muted hover:text-gold">
                  {copied ? <Check className="h-5 w-5 text-emerald-400" /> : <Copy className="h-5 w-5" />}
                </button>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <Stat label="Nivel" value={TIER_LABEL[account.tier] ?? account.tier} />
                <Stat label="Ventas" value={String(account.salesCount)} />
                <Stat label="Comisión" value={`${account.commissionPct}%`} />
              </div>
              <div className="grid grid-cols-2 gap-3 text-center">
                <Stat label="Por cobrar" value={`$${account.accruedCommission.toLocaleString("es-MX")}`} highlight />
                <Stat label="Pagado" value={`$${account.paidCommission.toLocaleString("es-MX")}`} />
              </div>
              <p className="font-body text-[11px] leading-relaxed text-muted/70">
                {account.isActive
                  ? `Comparte tu código "${account.code}" — tus clientes obtienen ${account.customerDiscountPct}% de descuento y tú ganas ${account.commissionPct}% de comisión. Te pagamos con un cupón.`
                  : "Tu cuenta aún no está activa. Te avisaremos al aprobarte."}
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="rounded-xl border border-gold/10 bg-smoke px-3 py-3">
      <p className="font-body text-[10px] uppercase tracking-wide text-muted">{label}</p>
      <p className={`mt-0.5 font-display text-lg ${highlight ? "text-gold" : "text-ivory"}`}>{value}</p>
    </div>
  );
}
