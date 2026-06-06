"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Check, Copy, MessageCircle, LogOut } from "lucide-react";

const inputClass =
  "w-full border border-gold/30 bg-obsidian/60 px-4 py-3 font-body text-sm text-ivory placeholder:text-ivory/55 focus:border-gold focus:outline-none transition-colors";

const TIER_LABEL: Record<string, string> = { normal: "Normal", plata: "Plata", oro: "Oro" };
const TIER_RULES: Record<string, string> = {
  normal: "Canje por producto (cupón de descuento).",
  plata: "Hasta 50% en efectivo por transferencia + el resto en cupón.",
  oro: "Como tú quieras: efectivo y/o cupón, sin límite.",
};
const STATUS_LABEL: Record<string, string> = {
  pending: "Pendiente", nuevo: "Pagado", confirmado: "Confirmado", preparando: "Preparando",
  enviado: "Enviado", en_camino: "En camino", entregado: "Entregado", cerrado: "Completado", cancelled: "Cancelado",
};

type Account = NonNullable<ReturnType<typeof useQuery<typeof api.ambassadors.getAccount>>>;

export function AccountDashboard({ email, pin, onLogout }: { email: string; pin: string; onLogout: () => void }) {
  const redeem = useMutation(api.ambassadors.redeem);
  const updateProfile = useMutation(api.ambassadors.updateProfile);
  const account = useQuery(api.ambassadors.getAccount, { email, pin });
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
    const r = await redeem({ email, pin, cashAmount: cash });
    if (r.ok) { setRedeemResult({ couponCode: r.couponCode, couponAmount: r.couponAmount, cashAmount: r.cashAmount }); setCashInput(""); }
    else setRedeemErr(r.error);
  }

  if (account === undefined) {
    return <div className="mx-auto max-w-4xl px-6 py-16"><div className="h-40 animate-pulse rounded-2xl bg-smoke" /></div>;
  }
  if (account === null) {
    return (
      <div className="mx-auto max-w-md px-6 py-20 text-center">
        <p className="font-body text-base text-ivory">No pudimos cargar tu cuenta.</p>
        <p className="mt-2 font-body text-sm text-muted">Tu sesión pudo expirar. Vuelve a entrar con tu correo y PIN.</p>
        <button onClick={onLogout} className="mt-6 border border-gold/40 px-6 py-3 font-body text-sm uppercase tracking-wide text-gold hover:bg-gold hover:text-obsidian">Volver a entrar</button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      {/* Encabezado */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-body text-sm uppercase tracking-[0.25em] text-gold">Panel de embajador</p>
          <h1 className="mt-2 font-display text-4xl font-light text-ivory">Hola, {account.name.split(" ")[0]}</h1>
        </div>
        <button onClick={onLogout} className="flex items-center gap-2 rounded-lg border border-gold/30 px-4 py-2 font-body text-sm text-ivory/80 transition-colors hover:border-gold hover:text-gold">
          <LogOut className="h-4 w-4" /> Salir
        </button>
      </div>

      {/* Código + WhatsApp */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="flex items-center justify-between rounded-2xl border border-gold/20 bg-smoke px-6 py-5">
          <div>
            <p className="font-body text-xs uppercase tracking-wide text-ivory/60">Tu código</p>
            <p className="mt-1 font-mono text-3xl tracking-[0.2em] text-gold">{account.code}</p>
          </div>
          <button onClick={() => copyText(account.code)} className="text-ivory/60 transition-colors hover:text-gold" title="Copiar">
            {copied ? <Check className="h-6 w-6 text-emerald-400" /> : <Copy className="h-6 w-6" />}
          </button>
        </div>
        {account.isActive && (
          <a
            href={`https://wa.me/?text=${encodeURIComponent(`¡Prueba NOSTERRA Mezcal! 🥃 Usa mi código ${account.code} y obtén ${account.customerDiscountPct}% de descuento en tu compra. Pídelo aquí: https://www.nosterramezcal.com`)}`}
            target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-6 py-5 font-body text-base font-medium text-emerald-300 transition-colors hover:bg-emerald-500/20"
          >
            <MessageCircle className="h-5 w-5" /> Compartir por WhatsApp
          </a>
        )}
      </div>

      {/* Stats grandes */}
      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <Stat label="Nivel" value={TIER_LABEL[account.tier] ?? account.tier} />
        <Stat label="Ventas" value={String(account.salesCount)} />
        <Stat label="Comisión" value={`${account.commissionPct}%`} />
        <Stat label="Por redimir" value={`$${account.accruedCommission.toLocaleString("es-MX")}`} highlight />
        <Stat label="Redimido" value={`$${account.paidCommission.toLocaleString("es-MX")}`} />
      </div>

      {/* Nivel + progreso */}
      <div className="mt-4 rounded-2xl border border-gold/15 bg-smoke px-6 py-5">
        <p className="font-body text-sm text-ivory/85"><span className="font-medium text-gold">Nivel {TIER_LABEL[account.tier]}:</span> {TIER_RULES[account.tier]}</p>
        {account.nextTier && (
          <p className="mt-2 font-body text-sm text-ivory/65">
            {account.thresholdMetric === "amount"
              ? `Te faltan $${Math.max(0, account.nextTarget - account.metricValue).toLocaleString("es-MX")} en ventas para subir a ${TIER_LABEL[account.nextTier]}.`
              : `Te faltan ${Math.max(0, account.nextTarget - account.metricValue)} ventas para subir a ${TIER_LABEL[account.nextTier]}.`}
          </p>
        )}
      </div>

      {/* Canje */}
      <div className="mt-8">
        <h2 className="font-display text-2xl text-ivory">Redimir comisiones</h2>
        <div className="mt-4">
          <BankForm account={account} email={email} pin={pin} updateProfile={updateProfile} show={showBank} setShow={setShowBank} />
        </div>
        <div className="mt-4">
          {redeemResult ? (
            <div className="space-y-2 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-5 text-center">
              <p className="font-body text-base text-emerald-200">¡Comisión redimida!</p>
              {redeemResult.cashAmount > 0 && (
                <p className="font-body text-sm text-emerald-200/90">${redeemResult.cashAmount.toLocaleString("es-MX")} se te pagará por <strong>transferencia</strong> (lo procesamos pronto).</p>
              )}
              {redeemResult.couponCode && (
                <>
                  <p className="font-body text-sm text-emerald-200/90">${redeemResult.couponAmount.toLocaleString("es-MX")} en este cupón:</p>
                  <button onClick={() => copyText(redeemResult.couponCode!)} className="mx-auto flex items-center gap-2 rounded-lg border border-emerald-400/40 bg-obsidian/40 px-5 py-2.5 font-mono text-xl tracking-widest text-emerald-200 hover:bg-obsidian/60">
                    {redeemResult.couponCode} <Copy className="h-4 w-4" />
                  </button>
                </>
              )}
              <button onClick={() => setRedeemResult(null)} className="font-body text-xs text-ivory/60 underline">Cerrar</button>
            </div>
          ) : account.isActive && account.accruedCommission > 0 ? (
            <RedeemBox account={account} cashInput={cashInput} setCashInput={setCashInput} onRedeem={doRedeem} />
          ) : (
            <p className="rounded-2xl border border-gold/10 bg-smoke px-6 py-5 font-body text-sm text-ivory/70">
              {account.isActive
                ? `Aún no tienes comisiones por redimir. Comparte tu código "${account.code}": tus clientes obtienen ${account.customerDiscountPct}% de descuento y tú ganas ${account.commissionPct}% de comisión por cada venta.`
                : "Tu cuenta aún no está activa. Te avisaremos en cuanto te aprobemos."}
            </p>
          )}
          {redeemErr && <p className="mt-2 font-body text-sm text-red-300">{redeemErr}</p>}
        </div>
      </div>

      {/* Todas las ventas */}
      <div className="mt-10">
        <h2 className="font-display text-2xl text-ivory">Tus ventas <span className="text-ivory/50">({account.referrals.length})</span></h2>
        {account.referrals.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-gold/10 bg-smoke px-6 py-8 text-center font-body text-sm text-ivory/65">
            Todavía no registras ventas con tu código. ¡Compártelo y empieza a ganar!
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-2xl border border-gold/15 bg-smoke">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gold/10 font-body text-xs uppercase tracking-wide text-ivory/55">
                  <th className="px-5 py-4 font-medium">Pedido</th>
                  <th className="px-4 py-4 font-medium">Cliente</th>
                  <th className="px-4 py-4 font-medium">Fecha</th>
                  <th className="px-4 py-4 font-medium">Estado</th>
                  <th className="px-4 py-4 text-right font-medium">Venta</th>
                  <th className="px-5 py-4 text-right font-medium">Tu comisión</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gold/5">
                {account.referrals.map((r, i) => (
                  <tr key={i} className="font-body text-sm text-ivory/85">
                    <td className="px-5 py-4 font-mono text-ivory/70">{r.orderNumber}</td>
                    <td className="px-4 py-4">{r.customer}<span className="block text-xs text-ivory/50">{r.city}</span></td>
                    <td className="px-4 py-4 text-ivory/70">{new Date(r.date).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })}</td>
                    <td className="px-4 py-4 text-ivory/70">{STATUS_LABEL[r.status] ?? r.status}</td>
                    <td className="px-4 py-4 text-right">${r.amount.toLocaleString("es-MX")}</td>
                    <td className="px-5 py-4 text-right font-medium text-gold">+${r.commission.toLocaleString("es-MX")}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-gold/15 font-body text-sm">
                  <td className="px-5 py-4 font-medium text-ivory" colSpan={4}>Total comisiones generadas</td>
                  <td className="px-4 py-4"></td>
                  <td className="px-5 py-4 text-right font-display text-xl text-gold">
                    +${account.referrals.reduce((s, r) => s + r.commission, 0).toLocaleString("es-MX")}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Historial de pagos en efectivo */}
      {account.payouts.length > 0 && (
        <div className="mt-10">
          <h2 className="font-display text-2xl text-ivory">Pagos en efectivo</h2>
          <div className="mt-4 overflow-hidden rounded-2xl border border-gold/15 bg-smoke">
            <ul className="divide-y divide-gold/5">
              {account.payouts.map((p, i) => (
                <li key={i} className="flex items-center justify-between px-6 py-4 font-body text-sm">
                  <span className="text-ivory/85">${p.cashAmount.toLocaleString("es-MX")} <span className="text-ivory/50">· {new Date(p.createdAt).toLocaleDateString("es-MX")}</span></span>
                  <span className={p.status === "paid" ? "text-emerald-400" : p.status === "rejected" ? "text-red-300" : "text-gold"}>
                    {p.status === "paid" ? "Transferido ✓" : p.status === "rejected" ? "Rechazado" : "Pendiente"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="rounded-2xl border border-gold/15 bg-smoke px-4 py-5 text-center">
      <p className="font-body text-xs uppercase tracking-wide text-ivory/60">{label}</p>
      <p className={`mt-1.5 font-display text-2xl ${highlight ? "text-gold" : "text-ivory"}`}>{value}</p>
    </div>
  );
}

function RedeemBox({ account, cashInput, setCashInput, onRedeem }: {
  account: Account; cashInput: string; setCashInput: (v: string) => void; onRedeem: (cash: number) => void;
}) {
  const total = Math.floor(account.accruedCommission);
  const maxCash = Math.floor(total * account.maxCashPct);

  if (account.maxCashPct === 0) {
    return (
      <button onClick={() => onRedeem(0)} className="w-full bg-gold px-6 py-4 font-body text-sm font-medium uppercase tracking-[0.15em] text-obsidian transition-colors hover:bg-gold-light">
        Redimir ${total.toLocaleString("es-MX")} en cupón de producto
      </button>
    );
  }

  const cash = Math.min(maxCash, Math.max(0, Math.floor(Number(cashInput) || 0)));
  const coupon = total - cash;
  return (
    <div className="space-y-4 rounded-2xl border border-gold/15 bg-smoke p-6">
      <p className="font-body text-sm text-ivory/85">
        Tienes <span className="font-medium text-gold">${total.toLocaleString("es-MX")}</span> por redimir.
        {account.maxCashPct < 1 ? ` Puedes recibir hasta $${maxCash.toLocaleString("es-MX")} en efectivo (50%).` : " Puedes recibir todo en efectivo, todo en cupón, o como prefieras."}
      </p>
      <label className="block">
        <span className="mb-1.5 block font-body text-xs uppercase tracking-wide text-ivory/60">Efectivo por transferencia (MXN)</span>
        <input inputMode="numeric" placeholder="0" className={inputClass} value={cashInput} onChange={(e) => setCashInput(e.target.value.replace(/\D/g, ""))} />
      </label>
      <div className="flex gap-2">
        <button type="button" onClick={() => setCashInput(String(maxCash))} className="rounded-md border border-gold/30 px-4 py-1.5 font-body text-xs text-gold hover:bg-gold/10">Máx efectivo</button>
        <button type="button" onClick={() => setCashInput("0")} className="rounded-md border border-gold/30 px-4 py-1.5 font-body text-xs text-gold hover:bg-gold/10">Todo en cupón</button>
      </div>
      <div className="rounded-lg border border-gold/10 bg-obsidian/40 px-4 py-3 font-body text-sm text-ivory/85">
        Efectivo: <span className="text-ivory">${cash.toLocaleString("es-MX")}</span> · Cupón: <span className="text-ivory">${coupon.toLocaleString("es-MX")}</span>
      </div>
      {cash > 0 && !account.hasBankData && (
        <p className="font-body text-sm text-amber-300">Para cobrar en efectivo, completa primero tus datos bancarios arriba.</p>
      )}
      <button onClick={() => onRedeem(cash)} disabled={cash > 0 && !account.hasBankData}
        className="w-full bg-gold px-6 py-4 font-body text-sm font-medium uppercase tracking-[0.15em] text-obsidian transition-colors hover:bg-gold-light disabled:opacity-50">
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
    } finally { setSaving(false); }
  }

  return (
    <div className="rounded-2xl border border-gold/15 bg-smoke">
      <button onClick={() => setShow(!show)} className="flex w-full items-center justify-between px-6 py-4 font-body text-sm text-ivory/85 hover:text-gold">
        <span>Datos para cobrar en efectivo {account.hasBankData ? "✓" : ""}</span>
        <span className="text-lg">{show ? "−" : "+"}</span>
      </button>
      {show && (
        <div className="space-y-3 border-t border-gold/10 p-6">
          <input placeholder="Titular de la cuenta" className={inputClass} value={b.titularCuenta} onChange={set("titularCuenta")} />
          <input inputMode="numeric" placeholder="CLABE (18 dígitos)" className={inputClass} value={b.clabe} onChange={set("clabe")} />
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="Banco" className={inputClass} value={b.banco} onChange={set("banco")} />
            <input placeholder="RFC" className={inputClass} value={b.rfc} onChange={set("rfc")} />
          </div>
          <button onClick={save} disabled={saving} className="w-full border border-gold/40 px-5 py-3 font-body text-sm uppercase tracking-wide text-gold transition-colors hover:bg-gold hover:text-obsidian disabled:opacity-50">
            {saving ? "Guardando…" : saved ? "Guardado ✓" : "Guardar datos bancarios"}
          </button>
        </div>
      )}
    </div>
  );
}
