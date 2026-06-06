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
  "w-full border border-gold/30 bg-obsidian/60 px-4 py-3 font-body text-sm text-ivory placeholder:text-ivory/55 focus:border-gold focus:outline-none transition-colors";

const TIER_LABEL: Record<string, string> = { normal: "Normal", plata: "Plata", oro: "Oro" };

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
  const benefits = [
    { icon: TrendingUp, title: "Gana comisión", desc: "Recibe una comisión por cada venta hecha con tu código." },
    { icon: Gift, title: "Premia a tus amigos", desc: `Quien use tu código recibe ${settings.ambassador?.customerDiscount ?? 5}% de descuento.` },
    { icon: Crown, title: "Sube de nivel", desc: "Normal, Plata y Oro: a mayor nivel, mayor comisión." },
  ];
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
      <div className="mt-8 space-y-4">
        {benefits.map((b) => (
          <div key={b.title} className="flex gap-4 rounded-2xl border border-gold/15 bg-smoke p-5">
            <b.icon className="h-6 w-6 flex-shrink-0 text-gold" />
            <div>
              <h3 className="font-display text-lg text-ivory">{b.title}</h3>
              <p className="mt-0.5 font-body text-sm text-muted">{b.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
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
          <p className="text-center font-body text-[11px] text-muted/60">* Campos obligatorios. Revisamos cada solicitud y te daremos un código y un PIN.</p>
        </form>
      )}
    </div>
  );
}

const TIER_RULES: Record<string, string> = {
  normal: "Canje por producto (cupón de descuento).",
  plata: "Hasta 50% en efectivo por transferencia + el resto en cupón.",
  oro: "Como tú quieras: efectivo y/o cupón, sin límite.",
};

function AccountPanel() {
  const redeem = useMutation(api.ambassadors.redeem);
  const updateProfile = useMutation(api.ambassadors.updateProfile);
  const [lookupEmail, setLookupEmail] = useState("");
  const [lookupPin, setLookupPin] = useState("");
  const [queryEmail, setQueryEmail] = useState("");
  const [queryPin, setQueryPin] = useState("");
  const account = useQuery(
    api.ambassadors.getAccount,
    queryEmail && queryPin ? { email: queryEmail, pin: queryPin } : "skip"
  );
  const [copied, setCopied] = useState(false);
  const [cashInput, setCashInput] = useState("");
  const [redeemResult, setRedeemResult] = useState<{ couponCode: string | null; couponAmount: number; cashAmount: number } | null>(null);
  const [redeemErr, setRedeemErr] = useState("");
  const [showBank, setShowBank] = useState(false);

  function copyText(text: string) {
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function doRedeem(cash: number) {
    setRedeemErr("");
    const r = await redeem({ email: queryEmail, pin: queryPin, cashAmount: cash });
    if (r.ok) { setRedeemResult({ couponCode: r.couponCode, couponAmount: r.couponAmount, cashAmount: r.cashAmount }); setCashInput(""); }
    else setRedeemErr(r.error);
  }

  return (
    <div className="rounded-2xl border border-gold/15 bg-smoke p-6 sm:p-7">
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

          {/* Reglas + progreso de nivel */}
          <div className="rounded-xl border border-gold/10 bg-smoke px-4 py-3">
            <p className="font-body text-[11px] text-muted"><span className="text-gold">Nivel {TIER_LABEL[account.tier]}:</span> {TIER_RULES[account.tier]}</p>
            {account.nextTier && (
              <p className="mt-1.5 font-body text-[11px] text-muted/70">
                {account.thresholdMetric === "amount"
                  ? `Te faltan $${Math.max(0, account.nextTarget - account.metricValue).toLocaleString("es-MX")} en ventas para subir a ${TIER_LABEL[account.nextTier]}.`
                  : `Te faltan ${Math.max(0, account.nextTarget - account.metricValue)} ventas para subir a ${TIER_LABEL[account.nextTier]}.`}
              </p>
            )}
          </div>

          {/* Datos bancarios */}
          <BankForm account={account} email={queryEmail} pin={queryPin} updateProfile={updateProfile} show={showBank} setShow={setShowBank} />

          {/* Canje */}
          {redeemResult ? (
            <div className="space-y-2 rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-center">
              <p className="font-body text-sm text-emerald-200">¡Comisión redimida!</p>
              {redeemResult.cashAmount > 0 && (
                <p className="font-body text-xs text-emerald-200/90">
                  ${redeemResult.cashAmount.toLocaleString("es-MX")} se te pagará por <strong>transferencia</strong> a tu cuenta (lo procesamos pronto).
                </p>
              )}
              {redeemResult.couponCode && (
                <>
                  <p className="font-body text-xs text-emerald-200/90">${redeemResult.couponAmount.toLocaleString("es-MX")} en este cupón:</p>
                  <button onClick={() => copyText(redeemResult.couponCode!)} className="mx-auto flex items-center gap-2 rounded-lg border border-emerald-400/40 bg-obsidian/40 px-4 py-2 font-mono text-lg tracking-widest text-emerald-200 hover:bg-obsidian/60">
                    {redeemResult.couponCode} <Copy className="h-4 w-4" />
                  </button>
                </>
              )}
              <button onClick={() => setRedeemResult(null)} className="font-body text-[11px] text-muted/70 underline">Cerrar</button>
            </div>
          ) : account.isActive && account.accruedCommission > 0 ? (
            <RedeemBox account={account} cashInput={cashInput} setCashInput={setCashInput} onRedeem={doRedeem} />
          ) : (
            <p className="font-body text-[11px] text-muted/70">
              {account.isActive
                ? `Comparte tu código "${account.code}": tus clientes obtienen ${account.customerDiscountPct}% de descuento y tú ganas ${account.commissionPct}% de comisión.`
                : "Tu cuenta aún no está activa."}
            </p>
          )}
          {redeemErr && <p className="font-body text-sm text-red-300">{redeemErr}</p>}

          {/* Historial de pagos en efectivo */}
          {account.payouts.length > 0 && (
            <div className="rounded-xl border border-gold/10 bg-smoke px-4 py-3">
              <p className="mb-2 font-body text-[11px] uppercase tracking-wide text-muted">Pagos en efectivo</p>
              <ul className="space-y-1.5">
                {account.payouts.map((p, i) => (
                  <li key={i} className="flex items-center justify-between font-body text-xs text-muted">
                    <span>${p.cashAmount.toLocaleString("es-MX")} · {new Date(p.createdAt).toLocaleDateString("es-MX")}</span>
                    <span className={p.status === "paid" ? "text-emerald-400" : p.status === "rejected" ? "text-red-300" : "text-gold"}>
                      {p.status === "paid" ? "Transferido" : p.status === "rejected" ? "Rechazado" : "Pendiente"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

type Account = NonNullable<ReturnType<typeof useQuery<typeof api.ambassadors.getAccount>>>;

function RedeemBox({ account, cashInput, setCashInput, onRedeem }: {
  account: Account; cashInput: string; setCashInput: (v: string) => void; onRedeem: (cash: number) => void;
}) {
  const total = Math.floor(account.accruedCommission);
  const maxCash = Math.floor(total * account.maxCashPct);

  if (account.maxCashPct === 0) {
    // Normal — solo producto
    return (
      <button onClick={() => onRedeem(0)} className="w-full bg-gold px-6 py-3.5 font-body text-sm uppercase tracking-[0.15em] text-obsidian transition-colors hover:bg-gold-light">
        Redimir ${total.toLocaleString("es-MX")} en cupón de producto
      </button>
    );
  }

  const cash = Math.min(maxCash, Math.max(0, Math.floor(Number(cashInput) || 0)));
  const coupon = total - cash;
  return (
    <div className="space-y-3 rounded-xl border border-gold/15 bg-smoke p-4">
      <p className="font-body text-xs text-muted">
        Tienes <span className="text-gold">${total.toLocaleString("es-MX")}</span> por redimir.
        {account.maxCashPct < 1
          ? ` Puedes recibir hasta $${maxCash.toLocaleString("es-MX")} en efectivo (50%).`
          : " Puedes recibir todo en efectivo, todo en cupón, o como prefieras."}
      </p>
      <label className="block">
        <span className="mb-1 block font-body text-[11px] uppercase tracking-wide text-muted">Efectivo por transferencia (MXN)</span>
        <input inputMode="numeric" placeholder="0" className={inputClass} value={cashInput} onChange={(e) => setCashInput(e.target.value.replace(/\D/g, ""))} />
      </label>
      <div className="flex gap-2">
        <button type="button" onClick={() => setCashInput(String(maxCash))} className="rounded-md border border-gold/30 px-3 py-1 font-body text-[11px] text-gold hover:bg-gold/10">Máx efectivo</button>
        <button type="button" onClick={() => setCashInput("0")} className="rounded-md border border-gold/30 px-3 py-1 font-body text-[11px] text-gold hover:bg-gold/10">Todo en cupón</button>
      </div>
      <div className="rounded-lg border border-gold/10 bg-obsidian/40 px-3 py-2 font-body text-xs text-muted">
        Efectivo: <span className="text-ivory">${cash.toLocaleString("es-MX")}</span> · Cupón: <span className="text-ivory">${coupon.toLocaleString("es-MX")}</span>
      </div>
      {cash > 0 && !account.hasBankData && (
        <p className="font-body text-[11px] text-amber-300">Para cobrar en efectivo, completa primero tus datos bancarios arriba.</p>
      )}
      <button
        onClick={() => onRedeem(cash)}
        disabled={cash > 0 && !account.hasBankData}
        className="w-full bg-gold px-6 py-3 font-body text-sm uppercase tracking-[0.15em] text-obsidian transition-colors hover:bg-gold-light disabled:opacity-50"
      >
        Redimir ${total.toLocaleString("es-MX")}
      </button>
    </div>
  );
}

function BankForm({ account, email, pin, updateProfile, show, setShow }: {
  account: Account; email: string; pin: string;
  updateProfile: ReturnType<typeof useMutation<typeof api.ambassadors.updateProfile>>;
  show: boolean; setShow: (v: boolean) => void;
}) {
  const [b, setB] = useState({ titularCuenta: account.titularCuenta, clabe: account.clabe, banco: account.banco, rfc: account.rfc });
  const set = (k: keyof typeof b) => (e: React.ChangeEvent<HTMLInputElement>) => setB((p) => ({ ...p, [k]: e.target.value }));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await updateProfile({ email, pin, titularCuenta: b.titularCuenta, clabe: b.clabe, banco: b.banco, rfc: b.rfc });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-xl border border-gold/10 bg-smoke">
      <button onClick={() => setShow(!show)} className="flex w-full items-center justify-between px-4 py-3 font-body text-xs uppercase tracking-wide text-muted hover:text-gold">
        <span>Datos para cobrar en efectivo {account.hasBankData ? "✓" : ""}</span>
        <span>{show ? "−" : "+"}</span>
      </button>
      {show && (
        <div className="space-y-3 border-t border-gold/10 p-4">
          <input placeholder="Titular de la cuenta" className={inputClass} value={b.titularCuenta} onChange={set("titularCuenta")} />
          <input inputMode="numeric" placeholder="CLABE (18 dígitos)" className={inputClass} value={b.clabe} onChange={set("clabe")} />
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="Banco" className={inputClass} value={b.banco} onChange={set("banco")} />
            <input placeholder="RFC" className={inputClass} value={b.rfc} onChange={set("rfc")} />
          </div>
          <button onClick={save} disabled={saving} className="w-full border border-gold/40 px-5 py-2.5 font-body text-xs uppercase tracking-wide text-gold transition-colors hover:bg-gold hover:text-obsidian disabled:opacity-50">
            {saving ? "Guardando…" : saved ? "Guardado ✓" : "Guardar datos bancarios"}
          </button>
        </div>
      )}
    </div>
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
