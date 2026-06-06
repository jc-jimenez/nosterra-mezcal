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
  const redeem = useMutation(api.ambassadors.redeem);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ code: string; pin?: string; status: string; alreadyExists: boolean } | null>(null);

  // Acceso a la cuenta (email + PIN)
  const [lookupEmail, setLookupEmail] = useState("");
  const [lookupPin, setLookupPin] = useState("");
  const [queryEmail, setQueryEmail] = useState("");
  const [queryPin, setQueryPin] = useState("");
  const account = useQuery(
    api.ambassadors.getAccount,
    queryEmail && queryPin ? { email: queryEmail, pin: queryPin } : "skip"
  );
  const [copied, setCopied] = useState(false);
  const [redeemResult, setRedeemResult] = useState<{ code: string; amount: number } | null>(null);
  const [redeemErr, setRedeemErr] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const r = await apply({ name, email });
      setResult({ code: r.code, pin: r.alreadyExists ? undefined : r.pin, status: r.status, alreadyExists: r.alreadyExists });
    } finally {
      setSubmitting(false);
    }
  }

  async function doRedeem() {
    setRedeemErr("");
    const r = await redeem({ email: queryEmail, pin: queryPin });
    if (r.ok) setRedeemResult({ code: r.code, amount: r.amount });
    else setRedeemErr(r.error);
  }

  function copyText(text: string) {
    navigator.clipboard?.writeText(text);
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
                onClick={() => copyText(result.code)}
                className="mx-auto mt-3 flex items-center gap-2 rounded-xl border border-gold/40 bg-gold/10 px-6 py-3 font-mono text-2xl tracking-widest text-gold hover:bg-gold/20"
              >
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
            <form onSubmit={submit} className="mt-6 space-y-4">
              <input required placeholder="Nombre completo" className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
              <input required type="email" placeholder="Correo electrónico" className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} />
              <button type="submit" disabled={submitting} className="w-full bg-gold px-6 py-3.5 font-body text-sm uppercase tracking-[0.15em] text-obsidian transition-colors hover:bg-gold-light disabled:opacity-50">
                {submitting ? "Enviando…" : "Postularme"}
              </button>
              <p className="text-center font-body text-[11px] text-muted/60">
                Revisamos cada solicitud. Te daremos un código y un PIN.
              </p>
            </form>
          )}
        </div>

        {/* Mi cuenta */}
        <div className="rounded-2xl border border-gold/15 bg-obsidian/40 p-8">
          <h2 className="font-display text-2xl text-ivory">Mi cuenta de embajador</h2>
          <p className="mt-2 font-body text-sm text-muted">Entra con tu correo y PIN para ver y redimir tus comisiones.</p>
          <div className="mt-6 space-y-2">
            <input type="email" placeholder="Tu correo" className={inputClass} value={lookupEmail} onChange={(e) => setLookupEmail(e.target.value)} />
            <div className="flex gap-2">
              <input inputMode="numeric" maxLength={6} placeholder="PIN (6 dígitos)" className={inputClass} value={lookupPin} onChange={(e) => setLookupPin(e.target.value.replace(/\D/g, ""))} />
              <button onClick={() => { setQueryEmail(lookupEmail.trim().toLowerCase()); setQueryPin(lookupPin.trim()); setRedeemResult(null); setRedeemErr(""); }} className="border border-gold/40 px-5 font-body text-xs uppercase tracking-wide text-gold transition-colors hover:bg-gold hover:text-obsidian">
                Entrar
              </button>
            </div>
          </div>

          {queryEmail && queryPin && account === null && (
            <p className="mt-4 font-body text-sm text-red-300">Correo o PIN incorrectos. ¿Olvidaste tu PIN? Escríbenos.</p>
          )}
          {account && (
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between rounded-xl border border-gold/15 bg-smoke px-4 py-3">
                <div>
                  <p className="font-body text-[11px] uppercase tracking-wide text-muted">Tu código</p>
                  <p className="font-mono text-xl tracking-widest text-gold">{account.code}</p>
                </div>
                <button onClick={() => copyText(account.code)} className="text-muted hover:text-gold">
                  {copied ? <Check className="h-5 w-5 text-emerald-400" /> : <Copy className="h-5 w-5" />}
                </button>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <Stat label="Nivel" value={TIER_LABEL[account.tier] ?? account.tier} />
                <Stat label="Ventas" value={String(account.salesCount)} />
                <Stat label="Comisión" value={`${account.commissionPct}%`} />
              </div>
              <div className="grid grid-cols-2 gap-3 text-center">
                <Stat label="Por redimir" value={`$${account.accruedCommission.toLocaleString("es-MX")}`} highlight />
                <Stat label="Redimido" value={`$${account.paidCommission.toLocaleString("es-MX")}`} />
              </div>

              {/* Redimir */}
              {redeemResult ? (
                <div className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-center">
                  <p className="font-body text-sm text-emerald-200">¡Comisión redimida! Tu cupón por ${redeemResult.amount.toLocaleString("es-MX")}:</p>
                  <button onClick={() => copyText(redeemResult.code)} className="mx-auto mt-2 flex items-center gap-2 rounded-lg border border-emerald-400/40 bg-obsidian/40 px-4 py-2 font-mono text-lg tracking-widest text-emerald-200 hover:bg-obsidian/60">
                    {redeemResult.code} <Copy className="h-4 w-4" />
                  </button>
                  <p className="mt-2 font-body text-[11px] text-muted/70">Úsalo como cupón en tu próxima compra.</p>
                </div>
              ) : account.isActive && account.accruedCommission > 0 ? (
                <button onClick={doRedeem} className="w-full bg-gold px-6 py-3.5 font-body text-sm uppercase tracking-[0.15em] text-obsidian transition-colors hover:bg-gold-light">
                  Redimir ${account.accruedCommission.toLocaleString("es-MX")} en un cupón
                </button>
              ) : (
                <p className="font-body text-[11px] text-muted/70">
                  {account.isActive
                    ? `Comparte tu código "${account.code}": tus clientes obtienen ${account.customerDiscountPct}% de descuento y tú ganas ${account.commissionPct}% de comisión.`
                    : "Tu cuenta aún no está activa."}
                </p>
              )}
              {redeemErr && <p className="font-body text-sm text-red-300">{redeemErr}</p>}
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
