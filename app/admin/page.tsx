"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Lock, Plus, Pencil, Trash2, Save, X, Upload, LogOut, Settings as Cog, Ticket, Power, Crown, Copy, DollarSign, ShoppingBag } from "lucide-react";

const KEY_STORAGE = "nosterra_admin_key";

interface Draft {
  _id?: Id<"products">;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  price: string;
  agave: string;
  alcohol: string;
  volume: string;
  origin: string;
  process: string;
  stock: string;
  featured: boolean;
  isActive: boolean;
  isLimited: boolean;
  bottlesTotal: string;
  bottlesAvailable: string;
  sortOrder: string;
  imageStorageId?: Id<"_storage">;
  imageUrl: string;
  image?: string; // preview existente
}

const EMPTY_DRAFT: Draft = {
  slug: "", name: "", tagline: "", description: "", price: "", agave: "Espadín",
  alcohol: "40% Alc. Vol.", volume: "750 ml", origin: "Santiago Matatlán, Oaxaca",
  process: "Artesanal", stock: "0", featured: false, isActive: true, isLimited: false,
  bottlesTotal: "", bottlesAvailable: "", sortOrder: "0", imageUrl: "", image: "",
};

const input = "w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm bg-white text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-600";

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState<string | null>(null);
  const [pwd, setPwd] = useState("");
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    const k = sessionStorage.getItem(KEY_STORAGE);
    if (k) setAdminKey(k);
  }, []);

  const checkAdmin = useMutation(api.products.checkAdmin);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setAuthError("");
    try {
      await checkAdmin({ adminKey: pwd });
      sessionStorage.setItem(KEY_STORAGE, pwd);
      setAdminKey(pwd);
    } catch {
      setAuthError("Contraseña incorrecta");
    }
  }

  function logout() {
    sessionStorage.removeItem(KEY_STORAGE);
    setAdminKey(null);
    setPwd("");
  }

  if (!adminKey) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-100 px-6">
        <form onSubmit={login} className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
          <div className="mb-6 flex flex-col items-center text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-900">
              <Lock className="h-5 w-5 text-amber-400" />
            </div>
            <h1 className="mt-4 text-lg font-bold text-neutral-900">Panel NOSTERRA</h1>
            <p className="mt-1 text-sm text-neutral-500">Acceso de administrador</p>
          </div>
          <input
            type="password" value={pwd} onChange={(e) => setPwd(e.target.value)}
            placeholder="Contraseña" className={input} autoFocus
          />
          {authError && <p className="mt-2 text-sm text-red-600">{authError}</p>}
          <button type="submit" className="mt-4 w-full rounded-lg bg-neutral-900 py-2.5 text-sm font-medium text-white hover:bg-neutral-800">
            Entrar
          </button>
        </form>
      </div>
    );
  }

  return <AdminDashboard adminKey={adminKey} onLogout={logout} />;
}

function AdminDashboard({ adminKey, onLogout }: { adminKey: string; onLogout: () => void }) {
  const products = useQuery(api.products.listAll);
  const settings = useQuery(api.settings.get);
  const create = useMutation(api.products.create);
  const update = useMutation(api.products.update);
  const remove = useMutation(api.products.remove);
  const genUrl = useMutation(api.products.generateUploadUrl);
  const upsertSettings = useMutation(api.settings.upsert);

  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function startNew() { setDraft({ ...EMPTY_DRAFT, sortOrder: String((products?.length ?? 0) + 1) }); }
  function startEdit(p: NonNullable<typeof products>[number]) {
    setDraft({
      _id: p._id, slug: p.slug, name: p.name, tagline: p.tagline, description: p.description,
      price: String(p.price), agave: p.agave, alcohol: p.alcohol, volume: p.volume,
      origin: p.origin, process: p.process, stock: String(p.stock), featured: p.featured,
      isActive: p.isActive, isLimited: p.isLimited, bottlesTotal: p.bottlesTotal != null ? String(p.bottlesTotal) : "",
      bottlesAvailable: p.bottlesAvailable != null ? String(p.bottlesAvailable) : "",
      sortOrder: String(p.sortOrder), imageStorageId: p.imageStorageId, imageUrl: p.imageUrl ?? "", image: p.image,
    });
  }

  function set<K extends keyof Draft>(k: K, v: Draft[K]) {
    setDraft((d) => (d ? { ...d, [k]: v } : d));
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !draft) return;
    setUploading(true);
    try {
      const url = await genUrl({ adminKey });
      const res = await fetch(url, { method: "POST", headers: { "Content-Type": file.type }, body: file });
      const { storageId } = await res.json();
      set("imageStorageId", storageId as Id<"_storage">);
      set("image", URL.createObjectURL(file));
      set("imageUrl", "");
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    if (!draft) return;
    setSaving(true);
    try {
      const data = {
        slug: draft.slug.trim(),
        name: draft.name.trim(),
        tagline: draft.tagline.trim(),
        description: draft.description.trim(),
        price: Number(draft.price) || 0,
        agave: draft.agave.trim(),
        alcohol: draft.alcohol.trim(),
        volume: draft.volume.trim(),
        origin: draft.origin.trim(),
        process: draft.process.trim(),
        stock: Number(draft.stock) || 0,
        featured: draft.featured,
        isActive: draft.isActive,
        isLimited: draft.isLimited,
        sortOrder: Number(draft.sortOrder) || 0,
        ...(draft.imageStorageId ? { imageStorageId: draft.imageStorageId } : {}),
        ...(!draft.imageStorageId && draft.imageUrl ? { imageUrl: draft.imageUrl.trim() } : {}),
        ...(draft.isLimited
          ? { bottlesTotal: Number(draft.bottlesTotal) || 0, bottlesAvailable: Number(draft.bottlesAvailable) || 0 }
          : {}),
      };
      if (draft._id) await update({ adminKey, id: draft._id, data });
      else await create({ adminKey, data });
      setDraft(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  async function del(id: Id<"products">, name: string) {
    if (!confirm(`¿Eliminar "${name}"? Esta acción no se puede deshacer.`)) return;
    await remove({ adminKey, id });
  }

  return (
    <div className="min-h-screen bg-neutral-100">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-lg font-bold text-neutral-900">NOSTERRA · Panel</h1>
            <p className="text-xs text-neutral-500">Gestión de productos y configuración</p>
          </div>
          <div className="flex items-center gap-4">
            <a href="/admin/crm" className="flex items-center gap-1.5 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700">
              <ShoppingBag className="h-4 w-4" /> CRM
            </a>
            <button onClick={onLogout} className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-900">
              <LogOut className="h-4 w-4" /> Salir
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-8 px-6 py-8">
        {/* Configuración */}
        <SettingsCard
          settings={settings}
          onSave={async (data) => { await upsertSettings({ adminKey, data }); }}
        />

        {/* Productos */}
        <section className="rounded-2xl border border-neutral-200 bg-white">
          <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-4">
            <h2 className="font-semibold text-neutral-900">Productos</h2>
            <button onClick={startNew} className="flex items-center gap-1.5 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700">
              <Plus className="h-4 w-4" /> Nuevo producto
            </button>
          </div>

          {products === undefined ? (
            <div className="p-6 space-y-2">{[1, 2].map((i) => <div key={i} className="h-16 animate-pulse rounded-lg bg-neutral-100" />)}</div>
          ) : products.length === 0 ? (
            <p className="py-10 text-center text-sm text-neutral-500">Aún no hay productos.</p>
          ) : (
            <ul className="divide-y divide-neutral-50">
              {products.map((p) => (
                <li key={p._id} className="flex items-center gap-4 px-6 py-4">
                  <div className="h-14 w-11 flex-shrink-0 overflow-hidden rounded bg-neutral-100">
                    {p.image && <Image src={p.image} alt={p.name} width={44} height={56} className="h-full w-full object-contain" unoptimized />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-900">{p.name}</p>
                    <p className="text-xs text-neutral-500">
                      ${p.price.toLocaleString("es-MX")} · {p.isActive ? "Activo" : "Oculto"}
                      {p.featured ? " · Destacado" : ""}{p.isLimited ? " · Limitada" : ""}
                    </p>
                  </div>
                  <button onClick={() => startEdit(p)} className="flex items-center gap-1 text-sm text-neutral-600 hover:text-neutral-900">
                    <Pencil className="h-4 w-4" /> Editar
                  </button>
                  <button onClick={() => del(p._id, p.name)} className="flex items-center gap-1 text-sm text-red-500 hover:text-red-700">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Cupones */}
        <CouponsCard adminKey={adminKey} />

        {/* Embajadores */}
        <AmbassadorsCard adminKey={adminKey} />

        {/* Pagos en efectivo (transferencias) */}
        <PayoutsCard adminKey={adminKey} />
      </main>

      {/* Editor (modal) */}
      {draft && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
          <div className="my-8 w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-neutral-900">{draft._id ? "Editar producto" : "Nuevo producto"}</h3>
              <button onClick={() => setDraft(null)} className="text-neutral-400 hover:text-neutral-900"><X className="h-5 w-5" /></button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nombre"><input className={input} value={draft.name} onChange={(e) => set("name", e.target.value)} /></Field>
              <Field label="Slug (URL, sin espacios)"><input className={input} value={draft.slug} onChange={(e) => set("slug", e.target.value.toLowerCase().replace(/\s+/g, "-"))} /></Field>
              <Field label="Tagline (frase corta)"><input className={input} value={draft.tagline} onChange={(e) => set("tagline", e.target.value)} /></Field>
              <Field label="Precio (MXN)"><input type="number" className={input} value={draft.price} onChange={(e) => set("price", e.target.value)} /></Field>
            </div>

            <Field label="Descripción"><textarea rows={3} className={`${input} resize-none`} value={draft.description} onChange={(e) => set("description", e.target.value)} /></Field>

            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Agave"><input className={input} value={draft.agave} onChange={(e) => set("agave", e.target.value)} /></Field>
              <Field label="Volumen"><input className={input} value={draft.volume} onChange={(e) => set("volume", e.target.value)} /></Field>
              <Field label="Alcohol"><input className={input} value={draft.alcohol} onChange={(e) => set("alcohol", e.target.value)} /></Field>
              <Field label="Origen"><input className={input} value={draft.origin} onChange={(e) => set("origin", e.target.value)} /></Field>
              <Field label="Proceso"><input className={input} value={draft.process} onChange={(e) => set("process", e.target.value)} /></Field>
              <Field label="Stock"><input type="number" className={input} value={draft.stock} onChange={(e) => set("stock", e.target.value)} /></Field>
            </div>

            {/* Imagen */}
            <Field label="Imagen">
              <div className="flex items-center gap-4">
                <div className="h-24 w-20 flex-shrink-0 overflow-hidden rounded-lg border border-neutral-200 bg-neutral-50">
                  {draft.image ? <Image src={draft.image} alt="preview" width={80} height={96} className="h-full w-full object-contain" unoptimized /> : <div className="flex h-full items-center justify-center text-xs text-neutral-400">Sin imagen</div>}
                </div>
                <div className="flex-1">
                  <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="flex items-center gap-2 rounded-lg border border-neutral-300 px-4 py-2 text-sm hover:bg-neutral-50 disabled:opacity-50">
                    <Upload className="h-4 w-4" /> {uploading ? "Subiendo..." : "Subir imagen"}
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
                  <p className="mt-1.5 text-xs text-neutral-400">JPG o PNG. Recomendado fondo transparente.</p>
                </div>
              </div>
            </Field>

            {/* Flags */}
            <div className="mt-4 flex flex-wrap gap-5">
              <Check label="Activo (visible en la tienda)" checked={draft.isActive} onChange={(v) => set("isActive", v)} />
              <Check label="Destacado (Hero)" checked={draft.featured} onChange={(v) => set("featured", v)} />
              <Check label="Edición limitada (numerada)" checked={draft.isLimited} onChange={(v) => set("isLimited", v)} />
            </div>

            {draft.isLimited && (
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <Field label="Botellas totales"><input type="number" className={input} value={draft.bottlesTotal} onChange={(e) => set("bottlesTotal", e.target.value)} /></Field>
                <Field label="Botellas disponibles"><input type="number" className={input} value={draft.bottlesAvailable} onChange={(e) => set("bottlesAvailable", e.target.value)} /></Field>
                <Field label="Orden"><input type="number" className={input} value={draft.sortOrder} onChange={(e) => set("sortOrder", e.target.value)} /></Field>
              </div>
            )}
            {!draft.isLimited && (
              <Field label="Orden de aparición"><input type="number" className={input} value={draft.sortOrder} onChange={(e) => set("sortOrder", e.target.value)} /></Field>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setDraft(null)} className="rounded-lg border border-neutral-300 px-5 py-2.5 text-sm hover:bg-neutral-50">Cancelar</button>
              <button onClick={save} disabled={saving || !draft.name || !draft.slug} className="flex items-center gap-2 rounded-lg bg-neutral-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50">
                <Save className="h-4 w-4" /> {saving ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SettingsCard({
  settings,
  onSave,
}: {
  settings: { whatsappNumber: string; shippingNote: string; freeShippingFrom: number; shippingCost?: number; currency: string; ambassador?: { tierNormal: number; tierPlata: number; tierOro: number; customerDiscount: number; thresholdMetric?: "sales" | "amount"; plataMin?: number; oroMin?: number } } | undefined;
  onSave: (d: { whatsappNumber: string; shippingNote: string; freeShippingFrom: number; shippingCost: number; currency: string; ambassador: { tierNormal: number; tierPlata: number; tierOro: number; customerDiscount: number; thresholdMetric: "sales" | "amount"; plataMin: number; oroMin: number } }) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [wa, setWa] = useState("");
  const [note, setNote] = useState("");
  const [free, setFree] = useState("");
  const [cost, setCost] = useState("");
  const [tNormal, setTNormal] = useState("2");
  const [tPlata, setTPlata] = useState("3");
  const [tOro, setTOro] = useState("5");
  const [custDisc, setCustDisc] = useState("5");
  const [metric, setMetric] = useState<"sales" | "amount">("sales");
  const [plataMin, setPlataMin] = useState("10");
  const [oroMin, setOroMin] = useState("25");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (settings) {
      setWa(settings.whatsappNumber);
      setNote(settings.shippingNote);
      setFree(String(settings.freeShippingFrom));
      setCost(String(settings.shippingCost ?? 150));
      const amb = settings.ambassador;
      setTNormal(String(amb?.tierNormal ?? 2));
      setTPlata(String(amb?.tierPlata ?? 3));
      setTOro(String(amb?.tierOro ?? 5));
      setCustDisc(String(amb?.customerDiscount ?? 5));
      setMetric(amb?.thresholdMetric ?? "sales");
      setPlataMin(String(amb?.plataMin ?? 10));
      setOroMin(String(amb?.oroMin ?? 25));
    }
  }, [settings]);

  async function save() {
    setSaving(true); setSaved(false);
    try {
      await onSave({
        whatsappNumber: wa.trim(), shippingNote: note.trim(),
        freeShippingFrom: Number(free) || 0, shippingCost: Number(cost) || 0, currency: "MXN",
        ambassador: {
          tierNormal: Number(tNormal) || 0, tierPlata: Number(tPlata) || 0,
          tierOro: Number(tOro) || 0, customerDiscount: Number(custDisc) || 0,
          thresholdMetric: metric, plataMin: Number(plataMin) || 0, oroMin: Number(oroMin) || 0,
        },
      });
      setSaved(true); setTimeout(() => setSaved(false), 2000);
    } finally { setSaving(false); }
  }

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white">
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between px-6 py-4">
        <span className="flex items-center gap-2 font-semibold text-neutral-900"><Cog className="h-4 w-4 text-neutral-500" /> Configuración de la tienda</span>
        <span className="text-sm text-neutral-400">{open ? "Ocultar" : "Editar"}</span>
      </button>
      {open && (
        <div className="space-y-4 border-t border-neutral-100 px-6 py-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="WhatsApp (52 + 10 dígitos)"><input className={input} value={wa} onChange={(e) => setWa(e.target.value)} placeholder="527775238569" /></Field>
            <Field label="Costo de envío (MXN)"><input type="number" className={input} value={cost} onChange={(e) => setCost(e.target.value)} /></Field>
            <Field label="Envío gratis desde (MXN)"><input type="number" className={input} value={free} onChange={(e) => setFree(e.target.value)} /></Field>
            <Field label="Nota de envío"><input className={input} value={note} onChange={(e) => setNote(e.target.value)} /></Field>
          </div>

          <div className="border-t border-neutral-100 pt-4">
            <p className="mb-3 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-amber-600"><Crown className="h-3.5 w-3.5" /> Comisiones de embajadores (%)</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="Nivel Normal (%)"><input type="number" className={input} value={tNormal} onChange={(e) => setTNormal(e.target.value)} /></Field>
              <Field label="Nivel Plata (%)"><input type="number" className={input} value={tPlata} onChange={(e) => setTPlata(e.target.value)} /></Field>
              <Field label="Nivel Oro (%)"><input type="number" className={input} value={tOro} onChange={(e) => setTOro(e.target.value)} /></Field>
              <Field label="Descuento al cliente (%)"><input type="number" className={input} value={custDisc} onChange={(e) => setCustDisc(e.target.value)} /></Field>
            </div>
            <p className="mt-2 text-xs text-neutral-400">El cambio aplica a nuevos embajadores y al reasignar nivel. El descuento al cliente aplica a embajadores nuevos.</p>
          </div>

          <div className="border-t border-neutral-100 pt-4">
            <p className="mb-3 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-amber-600"><Crown className="h-3.5 w-3.5" /> Ascenso automático de nivel</p>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Medir por">
                <select className={input} value={metric} onChange={(e) => setMetric(e.target.value as "sales" | "amount")}>
                  <option value="sales">Número de ventas</option>
                  <option value="amount">Monto vendido (MXN)</option>
                </select>
              </Field>
              <Field label={metric === "amount" ? "Plata desde ($)" : "Plata desde (ventas)"}><input type="number" className={input} value={plataMin} onChange={(e) => setPlataMin(e.target.value)} /></Field>
              <Field label={metric === "amount" ? "Oro desde ($)" : "Oro desde (ventas)"}><input type="number" className={input} value={oroMin} onChange={(e) => setOroMin(e.target.value)} /></Field>
            </div>
            <p className="mt-2 text-xs text-neutral-400">Al alcanzar el umbral, el embajador sube de nivel automáticamente. Canje: Normal solo producto · Plata hasta 50% efectivo · Oro libre.</p>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={save} disabled={saving} className="flex items-center gap-2 rounded-lg bg-neutral-900 px-5 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50">
              <Save className="h-4 w-4" /> {saving ? "Guardando..." : "Guardar configuración"}
            </button>
            {saved && <span className="text-sm text-emerald-600">✓ Guardado</span>}
          </div>
        </div>
      )}
    </section>
  );
}

function CouponsCard({ adminKey }: { adminKey: string }) {
  const coupons = useQuery(api.coupons.listAll, { adminKey });
  const create = useMutation(api.coupons.create);
  const toggle = useMutation(api.coupons.toggle);
  const remove = useMutation(api.coupons.remove);

  const [showForm, setShowForm] = useState(false);
  const [code, setCode] = useState("");
  const [type, setType] = useState<"percent" | "fixed" | "freeship">("percent");
  const [value, setValue] = useState("10");
  const [minPurchase, setMin] = useState("0");
  const [maxUses, setMaxUses] = useState("0");
  const [expires, setExpires] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!code.trim()) return;
    setSaving(true);
    try {
      await create({
        adminKey,
        data: {
          code: code.trim().toUpperCase(),
          discountType: type,
          discountValue: type === "freeship" ? 0 : Number(value) || 0,
          minPurchase: Number(minPurchase) || 0,
          maxUses: Number(maxUses) || 0,
          expiresAt: expires ? new Date(expires + "T23:59:59").getTime() : undefined,
          note: note.trim() || undefined,
          isActive: true,
        },
      });
      setCode(""); setValue("10"); setMin("0"); setMaxUses("0"); setExpires(""); setNote("");
      setShowForm(false);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  function describe(c: NonNullable<typeof coupons>[number]) {
    if (c.discountType === "percent") return `${c.discountValue}% de descuento`;
    if (c.discountType === "fixed") return `$${c.discountValue.toLocaleString("es-MX")} de descuento`;
    return "Envío gratis";
  }

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white">
      <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-4">
        <h2 className="flex items-center gap-2 font-semibold text-neutral-900"><Ticket className="h-4 w-4 text-amber-600" /> Cupones de descuento</h2>
        <button onClick={() => setShowForm((v) => !v)} className="flex items-center gap-1.5 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700">
          <Plus className="h-4 w-4" /> Nuevo cupón
        </button>
      </div>

      {showForm && (
        <div className="space-y-4 border-b border-neutral-100 bg-neutral-50 px-6 py-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Código"><input className={input} value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="MEZCAL15" /></Field>
            <Field label="Tipo de descuento">
              <select className={input} value={type} onChange={(e) => setType(e.target.value as typeof type)}>
                <option value="percent">% de descuento</option>
                <option value="fixed">Monto fijo ($)</option>
                <option value="freeship">Envío gratis</option>
              </select>
            </Field>
            {type !== "freeship" && (
              <Field label={type === "percent" ? "Porcentaje (%)" : "Monto (MXN)"}>
                <input type="number" className={input} value={value} onChange={(e) => setValue(e.target.value)} />
              </Field>
            )}
            <Field label="Compra mínima (MXN, 0 = sin mínimo)"><input type="number" className={input} value={minPurchase} onChange={(e) => setMin(e.target.value)} /></Field>
            <Field label="Usos máximos (0 = ilimitado)"><input type="number" className={input} value={maxUses} onChange={(e) => setMaxUses(e.target.value)} /></Field>
            <Field label="Expira (opcional)"><input type="date" className={input} value={expires} onChange={(e) => setExpires(e.target.value)} /></Field>
            <Field label="Nota (opcional)"><input className={input} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Promo Día de Muertos" /></Field>
          </div>
          <button onClick={save} disabled={saving || !code.trim()} className="flex items-center gap-2 rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50">
            <Save className="h-4 w-4" /> {saving ? "Guardando..." : "Crear cupón"}
          </button>
        </div>
      )}

      {coupons === undefined ? (
        <div className="p-6 space-y-2">{[1, 2].map((i) => <div key={i} className="h-12 animate-pulse rounded-lg bg-neutral-100" />)}</div>
      ) : coupons.length === 0 ? (
        <p className="py-10 text-center text-sm text-neutral-500">Aún no hay cupones. Crea uno para tus promociones.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-neutral-400 border-b border-neutral-100">
                <th className="px-6 py-3 font-medium">Código</th>
                <th className="px-4 py-3 font-medium">Descuento</th>
                <th className="px-4 py-3 font-medium">Usos</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {coupons.map((c) => {
                const expired = c.expiresAt && c.expiresAt < Date.now();
                const exhausted = c.maxUses > 0 && c.usedCount >= c.maxUses;
                const live = c.isActive && !expired && !exhausted;
                return (
                  <tr key={c._id} className="hover:bg-neutral-50">
                    <td className="px-6 py-3 font-mono font-medium text-neutral-800">{c.code}</td>
                    <td className="px-4 py-3 text-neutral-700">{describe(c)}{c.minPurchase > 0 ? ` · mín $${c.minPurchase.toLocaleString("es-MX")}` : ""}</td>
                    <td className="px-4 py-3 text-neutral-700">{c.usedCount}{c.maxUses > 0 ? `/${c.maxUses}` : ""}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${live ? "bg-emerald-100 text-emerald-700" : !c.isActive ? "bg-neutral-100 text-neutral-500" : "bg-amber-100 text-amber-700"}`}>
                        {live ? "Activo" : !c.isActive ? "Desactivado" : exhausted ? "Agotado" : "Expirado"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => toggle({ adminKey, id: c._id, isActive: !c.isActive })} className="mr-3 inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-900">
                        <Power className="h-3.5 w-3.5" /> {c.isActive ? "Desactivar" : "Activar"}
                      </button>
                      <button onClick={() => { if (confirm(`¿Eliminar cupón ${c.code}?`)) remove({ adminKey, id: c._id }); }} className="inline-flex items-center text-xs text-red-500 hover:text-red-700">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function AmbassadorsCard({ adminKey }: { adminKey: string }) {
  const ambassadors = useQuery(api.ambassadors.listAll, { adminKey });
  const approve = useMutation(api.ambassadors.approve);
  const reject = useMutation(api.ambassadors.reject);
  const setTier = useMutation(api.ambassadors.setTier);
  const payCommission = useMutation(api.ambassadors.payCommission);
  const remove = useMutation(api.ambassadors.remove);
  const adminCreate = useMutation(api.ambassadors.adminCreate);
  const resetPin = useMutation(api.ambassadors.resetPin);
  const [payResult, setPayResult] = useState<{ name: string; code: string; amount: number } | null>(null);

  async function doResetPin(a: NonNullable<typeof ambassadors>[number]) {
    if (!confirm(`¿Regenerar el PIN de ${a.name}? El PIN anterior dejará de funcionar.`)) return;
    const r = await resetPin({ adminKey, id: a._id });
    alert(`Nuevo PIN de ${a.name}: ${r.pin}\nCompártelo con el embajador.`);
  }

  // Alta manual
  const [showForm, setShowForm] = useState(false);
  const [fName, setFName] = useState("");
  const [fEmail, setFEmail] = useState("");
  const [fTier, setFTier] = useState<"normal" | "plata" | "oro">("normal");
  const [fCode, setFCode] = useState("");
  const [creating, setCreating] = useState(false);

  async function createAmb() {
    if (!fName.trim() || !fEmail.trim()) return;
    setCreating(true);
    try {
      await adminCreate({ adminKey, name: fName, email: fEmail, tier: fTier, customCode: fCode || undefined });
      setFName(""); setFEmail(""); setFTier("normal"); setFCode(""); setShowForm(false);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error");
    } finally {
      setCreating(false);
    }
  }

  const pending = (ambassadors ?? []).filter((a) => a.status === "pending");
  const others = (ambassadors ?? []).filter((a) => a.status !== "pending");

  async function pay(a: NonNullable<typeof ambassadors>[number]) {
    const r = await payCommission({ adminKey, id: a._id });
    if (r.code) setPayResult({ name: a.name, code: r.code, amount: r.amount });
    else alert("Este embajador no tiene comisión por pagar.");
  }

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white">
      <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-4">
        <h2 className="flex items-center gap-2 font-semibold text-neutral-900"><Crown className="h-4 w-4 text-amber-600" /> Embajadores de marca</h2>
        <div className="flex items-center gap-4">
          <a href="/embajadores" target="_blank" className="text-sm text-amber-600 hover:text-amber-700">Página pública ↗</a>
          <button onClick={() => setShowForm((v) => !v)} className="flex items-center gap-1.5 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700">
            <Plus className="h-4 w-4" /> Nuevo embajador
          </button>
        </div>
      </div>

      {showForm && (
        <div className="space-y-4 border-b border-neutral-100 bg-neutral-50 px-6 py-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Nombre"><input className={input} value={fName} onChange={(e) => setFName(e.target.value)} /></Field>
            <Field label="Correo"><input type="email" className={input} value={fEmail} onChange={(e) => setFEmail(e.target.value)} /></Field>
            <Field label="Nivel">
              <select className={input} value={fTier} onChange={(e) => setFTier(e.target.value as typeof fTier)}>
                <option value="normal">Normal</option>
                <option value="plata">Plata</option>
                <option value="oro">Oro</option>
              </select>
            </Field>
            <Field label="Código (opcional, se genera solo)"><input className={input} value={fCode} onChange={(e) => setFCode(e.target.value.toUpperCase())} placeholder="MARIA" /></Field>
          </div>
          <button onClick={createAmb} disabled={creating || !fName.trim() || !fEmail.trim()} className="flex items-center gap-2 rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50">
            <Save className="h-4 w-4" /> {creating ? "Creando..." : "Crear embajador (activo)"}
          </button>
        </div>
      )}

      {payResult && (
        <div className="mx-6 mt-4 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
          <p className="text-sm text-emerald-800">
            Cupón de pago para <strong>{payResult.name}</strong> por ${payResult.amount.toLocaleString("es-MX")}:{" "}
            <span className="font-mono font-semibold">{payResult.code}</span> — envíaselo.
          </p>
          <button onClick={() => { navigator.clipboard?.writeText(payResult.code); }} className="ml-3 text-emerald-700 hover:text-emerald-900"><Copy className="h-4 w-4" /></button>
        </div>
      )}

      {/* Solicitudes pendientes */}
      {pending.length > 0 && (
        <div className="border-b border-neutral-100 px-6 py-4">
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-amber-600">Solicitudes por aprobar ({pending.length})</p>
          <ul className="space-y-2">
            {pending.map((a) => (
              <li key={a._id} className="flex items-center gap-3 rounded-lg border border-neutral-200 px-4 py-3">
                <div className="flex-1">
                  <p className="text-sm font-medium text-neutral-900">{a.name}</p>
                  <p className="text-xs text-neutral-500">{a.email} · código sugerido: <span className="font-mono">{a.code}</span></p>
                </div>
                <button onClick={() => approve({ adminKey, id: a._id })} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700">Aprobar</button>
                <button onClick={() => reject({ adminKey, id: a._id })} className="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs text-neutral-600 hover:bg-neutral-50">Rechazar</button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Embajadores */}
      {ambassadors === undefined ? (
        <div className="p-6 space-y-2">{[1, 2].map((i) => <div key={i} className="h-14 animate-pulse rounded-lg bg-neutral-100" />)}</div>
      ) : others.length === 0 ? (
        <p className="py-10 text-center text-sm text-neutral-500">Aún no hay embajadores activos.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-neutral-400 border-b border-neutral-100">
                <th className="px-6 py-3 font-medium">Embajador</th>
                <th className="px-4 py-3 font-medium">Código</th>
                <th className="px-4 py-3 font-medium">PIN</th>
                <th className="px-4 py-3 font-medium">Nivel</th>
                <th className="px-4 py-3 font-medium">Ventas</th>
                <th className="px-4 py-3 font-medium">Por pagar</th>
                <th className="px-4 py-3 font-medium text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {others.map((a) => (
                <tr key={a._id} className="hover:bg-neutral-50">
                  <td className="px-6 py-3">
                    <p className="font-medium text-neutral-900">{a.name}</p>
                    <p className="text-xs text-neutral-500">{a.email}{a.status === "rejected" ? " · rechazado" : ""}</p>
                  </td>
                  <td className="px-4 py-3 font-mono text-neutral-800">{a.code}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="font-mono tracking-widest text-neutral-800">{a.pin ?? "—"}</span>
                    <button onClick={() => doResetPin(a)} title="Regenerar PIN" className="ml-2 text-xs text-amber-600 hover:text-amber-700">↻</button>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={a.tier}
                      onChange={(e) => setTier({ adminKey, id: a._id, tier: e.target.value as "normal" | "plata" | "oro" })}
                      className="rounded-md border border-neutral-300 px-2 py-1 text-xs"
                    >
                      <option value="normal">Normal ({a.commissionPct}%)</option>
                      <option value="plata">Plata</option>
                      <option value="oro">Oro</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-neutral-700">{a.salesCount}</td>
                  <td className="px-4 py-3 font-medium text-neutral-900">${a.accruedCommission.toLocaleString("es-MX")}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    {a.accruedCommission > 0 && (
                      <button onClick={() => pay(a)} className="mr-2 inline-flex items-center gap-1 rounded-md bg-amber-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-amber-700">
                        <DollarSign className="h-3 w-3" /> Pagar
                      </button>
                    )}
                    <button onClick={() => { if (confirm(`¿Eliminar al embajador ${a.name}?`)) remove({ adminKey, id: a._id }); }} className="inline-flex items-center text-xs text-red-500 hover:text-red-700">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}


function PayoutsCard({ adminKey }: { adminKey: string }) {
  const payouts = useQuery(api.ambassadors.listPayouts, { adminKey });
  const markPaid = useMutation(api.ambassadors.markPayoutPaid);
  const reject = useMutation(api.ambassadors.rejectPayout);

  const pending = (payouts ?? []).filter((p) => p.status === "pending");

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white">
      <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-4">
        <h2 className="flex items-center gap-2 font-semibold text-neutral-900"><DollarSign className="h-4 w-4 text-amber-600" /> Pagos en efectivo (transferencias)</h2>
        {pending.length > 0 && <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">{pending.length} por transferir</span>}
      </div>

      {payouts === undefined ? (
        <div className="p-6 space-y-2">{[1, 2].map((i) => <div key={i} className="h-14 animate-pulse rounded-lg bg-neutral-100" />)}</div>
      ) : payouts.length === 0 ? (
        <p className="py-10 text-center text-sm text-neutral-500">No hay solicitudes de pago en efectivo.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-neutral-400 border-b border-neutral-100">
                <th className="px-6 py-3 font-medium">Embajador</th>
                <th className="px-4 py-3 font-medium">Datos bancarios</th>
                <th className="px-4 py-3 font-medium">Efectivo</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {payouts.map((p) => (
                <tr key={p._id} className="hover:bg-neutral-50 align-top">
                  <td className="px-6 py-3">
                    <p className="font-medium text-neutral-900">{p.ambassadorName}</p>
                    <p className="text-xs text-neutral-500"><span className="font-mono">{p.ambassadorCode}</span> · {new Date(p.createdAt).toLocaleDateString("es-MX")}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-neutral-600">
                    {p.bank ? (
                      <>
                        <p>{p.bank.titular ?? "—"}</p>
                        <p className="font-mono">CLABE: {p.bank.clabe ?? "—"}</p>
                        <p>{p.bank.banco ?? ""}{p.bank.rfc ? ` · RFC: ${p.bank.rfc}` : ""}</p>
                      </>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-3 font-medium text-neutral-900">
                    ${p.cashAmount.toLocaleString("es-MX")}
                    {p.couponAmount > 0 && <p className="text-xs font-normal text-neutral-400">+ ${p.couponAmount.toLocaleString("es-MX")} en cupón {p.couponCode ?? ""}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${p.status === "paid" ? "bg-emerald-100 text-emerald-700" : p.status === "rejected" ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-700"}`}>
                      {p.status === "paid" ? "Transferido" : p.status === "rejected" ? "Rechazado" : "Pendiente"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    {p.status === "pending" && (
                      <>
                        <button onClick={() => { if (confirm(`¿Marcar como transferido el pago de $${p.cashAmount.toLocaleString("es-MX")} a ${p.ambassadorName}?`)) markPaid({ adminKey, id: p._id }); }} className="mr-2 inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-emerald-700">
                          ✓ Transferido
                        </button>
                        <button onClick={() => { if (confirm(`¿Rechazar el pago? El monto regresa al saldo del embajador.`)) reject({ adminKey, id: p._id }); }} className="inline-flex items-center text-xs text-red-500 hover:text-red-700">
                          Rechazar
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-neutral-600">{label}</span>
      {children}
    </label>
  );
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm text-neutral-700">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-amber-600" />
      {label}
    </label>
  );
}
