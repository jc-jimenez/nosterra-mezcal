"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  Package, Users, Crown, Megaphone, ChevronLeft, ChevronDown, ChevronUp,
  Truck, Send, StickyNote, Search,
} from "lucide-react";

const KEY_STORAGE = "nosterra_admin_key";
const input = "w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm bg-white text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-600";

// Flujo de estados de pedido
const ORDER_FLOW: Record<string, { label: string; color: string; next?: { status: string; label: string; needsTracking?: boolean } }> = {
  nuevo:      { label: "Nuevo",      color: "bg-blue-100 text-blue-700",       next: { status: "confirmado", label: "Confirmar" } },
  confirmado: { label: "Confirmado", color: "bg-indigo-100 text-indigo-700",   next: { status: "preparando", label: "Preparar" } },
  preparando: { label: "Preparando", color: "bg-purple-100 text-purple-700",   next: { status: "enviado", label: "Marcar enviado", needsTracking: true } },
  enviado:    { label: "Enviado",    color: "bg-cyan-100 text-cyan-700",       next: { status: "en_camino", label: "En camino" } },
  en_camino:  { label: "En camino",  color: "bg-teal-100 text-teal-700",       next: { status: "entregado", label: "Entregado" } },
  entregado:  { label: "Entregado",  color: "bg-emerald-100 text-emerald-700", next: { status: "cerrado", label: "Cerrar pedido" } },
  cerrado:    { label: "Cerrado",    color: "bg-neutral-200 text-neutral-600" },
  cancelled:  { label: "Cancelado",  color: "bg-red-100 text-red-600" },
};

const TIER_LABEL: Record<string, string> = { normal: "Normal", plata: "Plata", oro: "Oro" };
const TIER_COLOR: Record<string, string> = {
  normal: "bg-neutral-100 text-neutral-600",
  plata: "bg-slate-200 text-slate-700",
  oro: "bg-amber-100 text-amber-700",
};

type Tab = "pedidos" | "clientes" | "embajadores" | "campanas";

export default function CrmPage() {
  const [adminKey, setAdminKey] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("pedidos");

  useEffect(() => {
    const k = sessionStorage.getItem(KEY_STORAGE);
    setAdminKey(k);
  }, []);

  if (adminKey === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50 p-6">
        <div className="text-center">
          <p className="text-neutral-700">Necesitas iniciar sesión en el panel de administración.</p>
          <Link href="/admin" className="mt-4 inline-block rounded-lg bg-amber-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-amber-700">Ir al panel admin</Link>
        </div>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: typeof Package }[] = [
    { id: "pedidos", label: "Pedidos", icon: Package },
    { id: "clientes", label: "Clientes", icon: Users },
    { id: "embajadores", label: "Embajadores", icon: Crown },
    { id: "campanas", label: "Campañas", icon: Megaphone },
  ];

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-900"><ChevronLeft className="h-4 w-4" /> Admin</Link>
            <h1 className="text-lg font-semibold text-neutral-900">CRM Nosterra</h1>
          </div>
        </div>
        <div className="mx-auto flex max-w-6xl gap-1 px-6">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${tab === t.id ? "border-amber-600 text-amber-700" : "border-transparent text-neutral-500 hover:text-neutral-800"}`}>
              <t.icon className="h-4 w-4" /> {t.label}
            </button>
          ))}
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {tab === "pedidos" && <PedidosTab adminKey={adminKey} />}
        {tab === "clientes" && <ClientesTab adminKey={adminKey} />}
        {tab === "embajadores" && <EmbajadoresTab adminKey={adminKey} />}
        {tab === "campanas" && <CampanasTab adminKey={adminKey} />}
      </main>
    </div>
  );
}

// ─── PEDIDOS ─────────────────────────────────────────────────────────────────

function PedidosTab({ adminKey }: { adminKey: string }) {
  const active = useQuery(api.crm.listActive, { adminKey });
  const closed = useQuery(api.crm.listClosed, { adminKey, limit: 100 });
  const advance = useMutation(api.crm.advanceStatus);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showClosed, setShowClosed] = useState(false);
  const [trackingFor, setTrackingFor] = useState<string | null>(null);
  const [carrier, setCarrier] = useState("");
  const [tracking, setTracking] = useState("");

  async function doAdvance(o: NonNullable<typeof active>[number], status: string, needsTracking?: boolean) {
    if (needsTracking) {
      if (trackingFor !== o._id) { setTrackingFor(o._id); setCarrier(o.carrier ?? ""); setTracking(o.trackingNumber ?? ""); return; }
      if (!tracking.trim()) { alert("Ingresa el número de guía"); return; }
      await advance({ adminKey, id: o._id, status: status as "enviado", trackingNumber: tracking.trim(), carrier: carrier.trim() });
      setTrackingFor(null); setCarrier(""); setTracking("");
    } else {
      await advance({ adminKey, id: o._id, status: status as "confirmado" });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-neutral-900">Pedidos activos {active && <span className="text-neutral-400">({active.length})</span>}</h2>
      </div>

      {active === undefined ? (
        <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-neutral-100" />)}</div>
      ) : active.length === 0 ? (
        <p className="rounded-xl border border-neutral-200 bg-white py-12 text-center text-sm text-neutral-500">No hay pedidos activos. ¡Todo al día! 🎉</p>
      ) : (
        <div className="space-y-3">
          {active.map((o) => {
            const flow = ORDER_FLOW[o.status];
            const isOpen = expanded === o._id;
            return (
              <div key={o._id} className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
                <div className="flex items-center gap-3 px-5 py-4 cursor-pointer hover:bg-neutral-50" onClick={() => setExpanded(isOpen ? null : o._id)}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-sm font-semibold text-neutral-900">{o.orderNumber}</span>
                      <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${flow?.color}`}>{flow?.label}</span>
                      {o.trackingNumber && <span className="text-[11px] text-neutral-400">📦 {o.carrier} {o.trackingNumber}</span>}
                    </div>
                    <p className="mt-0.5 text-xs text-neutral-500">{o.customerName} · {o.shippingAddress.ciudad}, {o.shippingAddress.estado}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-neutral-900">${o.total.toLocaleString("es-MX")}</p>
                    <p className="text-[11px] text-neutral-400">{new Date(o._creationTime).toLocaleDateString("es-MX", { day: "2-digit", month: "short" })}</p>
                  </div>
                  {flow?.next && (
                    <button
                      onClick={(e) => { e.stopPropagation(); doAdvance(o, flow.next!.status, flow.next!.needsTracking); }}
                      className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700 whitespace-nowrap"
                    >
                      {flow.next.label}
                    </button>
                  )}
                  {isOpen ? <ChevronUp className="h-4 w-4 text-neutral-400" /> : <ChevronDown className="h-4 w-4 text-neutral-400" />}
                </div>

                {/* Captura de guía */}
                {trackingFor === o._id && (
                  <div className="flex flex-wrap items-end gap-2 border-t border-neutral-100 bg-amber-50 px-5 py-3">
                    <label className="text-xs text-neutral-600">
                      <span className="mb-1 block">Paquetería</span>
                      <input className={`${input} w-36`} placeholder="DHL, Estafeta…" value={carrier} onChange={(e) => setCarrier(e.target.value)} />
                    </label>
                    <label className="text-xs text-neutral-600">
                      <span className="mb-1 block">Número de guía</span>
                      <input className={`${input} w-48`} placeholder="1234567890" value={tracking} onChange={(e) => setTracking(e.target.value)} />
                    </label>
                    <button onClick={() => doAdvance(o, "enviado", true)} className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-700">
                      <Truck className="mr-1 inline h-3 w-3" /> Confirmar envío
                    </button>
                    <button onClick={() => setTrackingFor(null)} className="text-xs text-neutral-500 hover:text-neutral-800">Cancelar</button>
                  </div>
                )}

                {isOpen && <OrderDetail o={o} adminKey={adminKey} onCancel={() => advance({ adminKey, id: o._id, status: "cancelled" })} />}
              </div>
            );
          })}
        </div>
      )}

      {/* Cerrados */}
      <div className="pt-4">
        <button onClick={() => setShowClosed((v) => !v)} className="flex items-center gap-2 text-sm font-medium text-neutral-500 hover:text-neutral-800">
          {showClosed ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          Pedidos cerrados {closed && `(${closed.length})`}
        </button>
        {showClosed && closed && (
          <div className="mt-3 space-y-2">
            {closed.length === 0 ? (
              <p className="text-sm text-neutral-400">Aún no hay pedidos cerrados.</p>
            ) : closed.map((o) => (
              <div key={o._id} className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white px-5 py-3 text-sm">
                <div>
                  <span className="font-mono font-medium text-neutral-700">{o.orderNumber}</span>
                  <span className="ml-2 text-neutral-500">{o.customerName}</span>
                </div>
                <div className="text-right">
                  <span className="font-medium text-neutral-700">${o.total.toLocaleString("es-MX")}</span>
                  <span className="ml-3 text-xs text-neutral-400">{o.closedAt ? new Date(o.closedAt).toLocaleDateString("es-MX") : ""}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function OrderDetail({ o, adminKey, onCancel }: { o: any; adminKey: string; onCancel: () => void }) {
  const updateMeta = useMutation(api.crm.updateOrderMeta);
  const [notes, setNotes] = useState(o.adminNotes ?? "");
  const [savedNote, setSavedNote] = useState(false);

  return (
    <div className="border-t border-neutral-100 bg-neutral-50 px-5 py-4">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <p className="mb-2 text-[11px] uppercase tracking-wide text-neutral-400">Productos</p>
          <ul className="space-y-1">
            {o.items.map((it: any, i: number) => (
              <li key={i} className="flex justify-between text-sm text-neutral-700">
                <span>{it.name} <span className="text-neutral-400">×{it.qty}</span></span>
                <span>${(it.price * it.qty).toLocaleString("es-MX")}</span>
              </li>
            ))}
          </ul>
          <div className="mt-2 border-t border-neutral-200 pt-2 text-sm">
            <div className="flex justify-between text-neutral-500"><span>Subtotal</span><span>${o.subtotal.toLocaleString("es-MX")}</span></div>
            <div className="flex justify-between text-neutral-500"><span>Envío</span><span>${o.shipping.toLocaleString("es-MX")}</span></div>
            {(o.discount ?? 0) > 0 && <div className="flex justify-between text-emerald-600"><span>Descuento {o.couponCode && `(${o.couponCode})`}</span><span>-${o.discount.toLocaleString("es-MX")}</span></div>}
            <div className="flex justify-between font-semibold text-neutral-900"><span>Total</span><span>${o.total.toLocaleString("es-MX")}</span></div>
          </div>
        </div>
        <div className="space-y-3">
          <div>
            <p className="mb-1 text-[11px] uppercase tracking-wide text-neutral-400">Entrega</p>
            <p className="text-sm text-neutral-700 leading-relaxed">
              {o.shippingAddress.calle} {o.shippingAddress.numero}, {o.shippingAddress.colonia}<br />
              C.P. {o.shippingAddress.cp}, {o.shippingAddress.ciudad}, {o.shippingAddress.estado}
              {o.shippingAddress.referencias && <><br /><span className="text-neutral-400">Ref: {o.shippingAddress.referencias}</span></>}
            </p>
          </div>
          <div>
            <p className="mb-1 text-[11px] uppercase tracking-wide text-neutral-400">Contacto</p>
            <p className="text-sm text-neutral-700">{o.customerEmail}{o.customerPhone ? ` · ${o.customerPhone}` : ""}</p>
          </div>
          <div>
            <p className="mb-1 text-[11px] uppercase tracking-wide text-neutral-400">Notas internas</p>
            <textarea
              rows={2}
              className={`${input} resize-none`}
              placeholder="Notas del pedido…"
              value={notes}
              onChange={(e) => { setNotes(e.target.value); setSavedNote(false); }}
              onBlur={() => { updateMeta({ adminKey, id: o._id, adminNotes: notes }); setSavedNote(true); }}
            />
            {savedNote && <span className="text-[11px] text-emerald-600">✓ Guardado</span>}
          </div>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-3 border-t border-neutral-200 pt-3">
        <button onClick={() => { if (confirm(`¿Cancelar el pedido ${o.orderNumber}?`)) onCancel(); }} className="text-xs text-red-500 hover:text-red-700">Cancelar pedido</button>
        {/* Historial */}
        {o.statusHistory && o.statusHistory.length > 0 && (
          <div className="flex flex-wrap gap-2 text-[11px] text-neutral-400">
            {o.statusHistory.map((h: any, i: number) => (
              <span key={i}>{ORDER_FLOW[h.status]?.label ?? h.status} · {new Date(h.at).toLocaleDateString("es-MX", { day: "2-digit", month: "short" })}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── CLIENTES ────────────────────────────────────────────────────────────────

function ClientesTab({ adminKey }: { adminKey: string }) {
  const customers = useQuery(api.crm.listCustomers, { adminKey });
  const [search, setSearch] = useState("");
  const [openEmail, setOpenEmail] = useState<string | null>(null);

  const filtered = (customers ?? []).filter((c) =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input className={`${input} pl-9`} placeholder="Buscar cliente por nombre o correo…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        {customers && <span className="text-sm text-neutral-500">{customers.length} clientes</span>}
      </div>

      {customers === undefined ? (
        <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-neutral-100" />)}</div>
      ) : filtered.length === 0 ? (
        <p className="rounded-xl border border-neutral-200 bg-white py-12 text-center text-sm text-neutral-500">Sin clientes todavía.</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 text-left text-xs text-neutral-400">
                <th className="px-5 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium">Pedidos</th>
                <th className="px-4 py-3 font-medium">Total gastado</th>
                <th className="px-4 py-3 font-medium">Última compra</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {filtered.map((c) => (
                <>
                  <tr key={c._id} className="cursor-pointer hover:bg-neutral-50" onClick={() => setOpenEmail(openEmail === c.email ? null : c.email)}>
                    <td className="px-5 py-3">
                      <p className="font-medium text-neutral-900">{c.name}</p>
                      <p className="text-xs text-neutral-500">{c.email}</p>
                    </td>
                    <td className="px-4 py-3 text-neutral-700">{c.orderCount}</td>
                    <td className="px-4 py-3 font-medium text-neutral-900">${c.totalSpent.toLocaleString("es-MX")}</td>
                    <td className="px-4 py-3 text-neutral-500">{new Date(c.lastOrderAt).toLocaleDateString("es-MX")}</td>
                  </tr>
                  {openEmail === c.email && (
                    <tr><td colSpan={4} className="bg-neutral-50 px-5 py-4"><CustomerDetail adminKey={adminKey} email={c.email} customerId={c._id} initialNotes={c.notes ?? ""} /></td></tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function CustomerDetail({ adminKey, email, customerId, initialNotes }: { adminKey: string; email: string; customerId: Id<"customers">; initialNotes: string }) {
  const data = useQuery(api.crm.getCustomer, { adminKey, email });
  const updateNotes = useMutation(api.crm.updateCustomerNotes);
  const [notes, setNotes] = useState(initialNotes);

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <div>
        <p className="mb-2 text-[11px] uppercase tracking-wide text-neutral-400">Historial de pedidos</p>
        {data === undefined ? <p className="text-sm text-neutral-400">Cargando…</p> : data === null ? <p className="text-sm text-neutral-400">Sin datos.</p> : (
          <ul className="space-y-1.5">
            {data.orders.map((o) => (
              <li key={o._id} className="flex justify-between text-sm">
                <span className="font-mono text-neutral-600">{o.orderNumber}</span>
                <span className="text-neutral-500">{ORDER_FLOW[o.status]?.label ?? o.status}</span>
                <span className="font-medium text-neutral-700">${o.total.toLocaleString("es-MX")}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div>
        <p className="mb-1 text-[11px] uppercase tracking-wide text-neutral-400">Notas del cliente</p>
        <textarea rows={4} className={`${input} resize-none`} placeholder="Preferencias, observaciones…" value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={() => updateNotes({ adminKey, id: customerId, notes })} />
      </div>
    </div>
  );
}

// ─── EMBAJADORES ─────────────────────────────────────────────────────────────

function EmbajadoresTab({ adminKey }: { adminKey: string }) {
  const ambs = useQuery(api.crm.listAmbassadorsCRM, { adminKey });
  const updateNotes = useMutation(api.crm.updateAmbassadorNotes);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("activos");
  const [openId, setOpenId] = useState<string | null>(null);

  const THIRTY = 30 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  const filtered = (ambs ?? []).filter((a) => {
    if (search && !a.name.toLowerCase().includes(search.toLowerCase()) && !a.code.toLowerCase().includes(search.toLowerCase())) return false;
    if (filter === "activos") return a.isActive;
    if (filter === "inactivos") return a.isActive && (!a.lastSaleAt || now - a.lastSaleAt > THIRTY);
    if (filter === "vendedores") return a.isActive && a.salesCount > 0;
    if (filter === "oro" || filter === "plata" || filter === "normal") return a.isActive && a.tier === filter;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input className={`${input} pl-9`} placeholder="Buscar por nombre o código…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-1">
          {[["activos", "Activos"], ["vendedores", "Con ventas"], ["inactivos", "Inactivos 30d"], ["oro", "Oro"], ["plata", "Plata"], ["normal", "Normal"]].map(([id, label]) => (
            <button key={id} onClick={() => setFilter(id)} className={`rounded-full px-3 py-1 text-xs font-medium ${filter === id ? "bg-amber-600 text-white" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"}`}>{label}</button>
          ))}
        </div>
      </div>

      {ambs === undefined ? (
        <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-neutral-100" />)}</div>
      ) : filtered.length === 0 ? (
        <p className="rounded-xl border border-neutral-200 bg-white py-12 text-center text-sm text-neutral-500">Sin embajadores con ese filtro.</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 text-left text-xs text-neutral-400">
                <th className="px-5 py-3 font-medium">Embajador</th>
                <th className="px-4 py-3 font-medium">Nivel</th>
                <th className="px-4 py-3 font-medium">Ventas</th>
                <th className="px-4 py-3 font-medium">Vendido</th>
                <th className="px-4 py-3 font-medium">Última venta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {filtered.map((a) => {
                const inactive = a.isActive && a.salesCount > 0 && (!a.lastSaleAt || now - a.lastSaleAt > THIRTY);
                return (
                  <>
                    <tr key={a._id} className="cursor-pointer hover:bg-neutral-50" onClick={() => setOpenId(openId === a._id ? null : a._id)}>
                      <td className="px-5 py-3">
                        <p className="font-medium text-neutral-900">{a.name}</p>
                        <p className="text-xs text-neutral-500"><span className="font-mono">{a.code}</span> · {a.email}</p>
                      </td>
                      <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${TIER_COLOR[a.tier]}`}>{TIER_LABEL[a.tier]}</span></td>
                      <td className="px-4 py-3 text-neutral-700">{a.salesCount}</td>
                      <td className="px-4 py-3 text-neutral-700">${a.salesAmount.toLocaleString("es-MX")}</td>
                      <td className="px-4 py-3">
                        {a.lastSaleAt ? (
                          <span className={inactive ? "text-amber-600" : "text-neutral-500"}>{new Date(a.lastSaleAt).toLocaleDateString("es-MX")}{inactive ? " ⚠️" : ""}</span>
                        ) : <span className="text-neutral-300">Sin ventas</span>}
                      </td>
                    </tr>
                    {openId === a._id && (
                      <tr><td colSpan={5} className="bg-neutral-50 px-5 py-4">
                        <div className="grid gap-5 sm:grid-cols-2">
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <Metric label="Comisión por pagar" value={`$${a.accruedCommission.toLocaleString("es-MX")}`} />
                            <Metric label="Comisión pagada" value={`$${a.paidCommission.toLocaleString("es-MX")}`} />
                            <Metric label="% Comisión" value={`${a.commissionPct}%`} />
                            <Metric label="WhatsApp" value={a.whatsapp || "—"} />
                          </div>
                          <div>
                            <p className="mb-1 flex items-center gap-1 text-[11px] uppercase tracking-wide text-neutral-400"><StickyNote className="h-3 w-3" /> Notas de seguimiento</p>
                            <AmbNotes adminKey={adminKey} id={a._id} initial={a.crmNotes} onSave={(notes) => updateNotes({ adminKey, id: a._id, notes })} />
                          </div>
                        </div>
                      </td></tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white px-3 py-2">
      <p className="text-[10px] uppercase tracking-wide text-neutral-400">{label}</p>
      <p className="font-medium text-neutral-900">{value}</p>
    </div>
  );
}

function AmbNotes({ id, initial, onSave }: { adminKey: string; id: Id<"ambassadors">; initial: string; onSave: (n: string) => void }) {
  const [notes, setNotes] = useState(initial);
  const [saved, setSaved] = useState(false);
  return (
    <>
      <textarea rows={4} className={`${input} resize-none`} placeholder="Llamadas, compromisos, seguimiento…" value={notes}
        onChange={(e) => { setNotes(e.target.value); setSaved(false); }}
        onBlur={() => { onSave(notes); setSaved(true); }} />
      {saved && <span className="text-[11px] text-emerald-600">✓ Guardado</span>}
    </>
  );
}

// ─── CAMPAÑAS ────────────────────────────────────────────────────────────────

const AUDIENCES: { id: string; label: string; desc: string }[] = [
  { id: "all", label: "Todos los activos", desc: "Todos los embajadores con cuenta activa" },
  { id: "oro", label: "Solo Oro", desc: "Embajadores nivel Oro" },
  { id: "plata", label: "Solo Plata", desc: "Embajadores nivel Plata" },
  { id: "normal", label: "Solo Normal", desc: "Embajadores nivel Normal" },
  { id: "inactivos", label: "Inactivos (30 días)", desc: "Activos que no han vendido en 30 días" },
];

function CampanasTab({ adminKey }: { adminKey: string }) {
  const send = useAction(api.crm.sendCampaign);
  const campaigns = useQuery(api.crm.listCampaigns, { adminKey });
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState("all");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const audPreview = useQuery(api.crm.audienceForCampaign, { adminKey, audience });

  async function doSend() {
    if (!subject.trim() || !body.trim()) { alert("Completa asunto y mensaje"); return; }
    const count = audPreview?.length ?? 0;
    if (!confirm(`¿Enviar esta campaña a ${count} embajador(es)?`)) return;
    setSending(true); setResult(null);
    try {
      const r = await send({ adminKey, subject: subject.trim(), body: body.trim(), audience: audience as "all" });
      setResult(`✓ Enviada a ${r.sent} embajador(es).`);
      setSubject(""); setBody("");
    } catch (e) {
      setResult(e instanceof Error ? e.message : "Error al enviar");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
      {/* Compositor */}
      <div className="rounded-xl border border-neutral-200 bg-white p-6">
        <h2 className="flex items-center gap-2 font-semibold text-neutral-900"><Megaphone className="h-4 w-4 text-amber-600" /> Nueva campaña</h2>
        <p className="mt-1 text-sm text-neutral-500">Motiva a tus embajadores con un correo. Usa <code className="rounded bg-neutral-100 px-1">{"{nombre}"}</code> para personalizar.</p>

        <div className="mt-5 space-y-4">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-neutral-600">Audiencia</span>
            <select className={input} value={audience} onChange={(e) => setAudience(e.target.value)}>
              {AUDIENCES.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
            </select>
            <span className="mt-1 block text-[11px] text-neutral-400">
              {AUDIENCES.find((a) => a.id === audience)?.desc} · {audPreview ? `${audPreview.length} destinatarios` : "…"}
            </span>
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-neutral-600">Asunto</span>
            <input className={input} placeholder="¡Duplica tus comisiones este mes! 🚀" value={subject} onChange={(e) => setSubject(e.target.value)} />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-neutral-600">Mensaje</span>
            <textarea rows={8} className={`${input} resize-none`} placeholder={"Hola {nombre},\n\nQueremos premiar tu esfuerzo…"} value={body} onChange={(e) => setBody(e.target.value)} />
          </label>

          <button onClick={doSend} disabled={sending} className="flex items-center gap-2 rounded-lg bg-amber-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50">
            <Send className="h-4 w-4" /> {sending ? "Enviando…" : `Enviar campaña`}
          </button>
          {result && <p className="text-sm text-emerald-600">{result}</p>}
        </div>
      </div>

      {/* Historial */}
      <div className="rounded-xl border border-neutral-200 bg-white p-6">
        <h3 className="font-semibold text-neutral-900">Campañas enviadas</h3>
        {campaigns === undefined ? (
          <p className="mt-3 text-sm text-neutral-400">Cargando…</p>
        ) : campaigns.length === 0 ? (
          <p className="mt-3 text-sm text-neutral-400">Aún no has enviado campañas.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {campaigns.map((c) => (
              <li key={c._id} className="border-b border-neutral-100 pb-3 last:border-0">
                <p className="text-sm font-medium text-neutral-900">{c.subject}</p>
                <p className="mt-0.5 text-xs text-neutral-500">{AUDIENCES.find((a) => a.id === c.audience)?.label ?? c.audience} · {c.sentCount} enviados · {new Date(c.createdAt).toLocaleDateString("es-MX")}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
