"use client";

import { use, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useCart } from "@/hooks/useCart";
import { formatMXN } from "@/lib/store-config";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from "@/components/store/CartDrawer";
import { ShoppingBag, ChevronLeft, Star, Check } from "lucide-react";

export default function ProductoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const product = useQuery(api.products.getBySlug, { slug });
  const reviews = useQuery(api.reviews.listApproved, { productSlug: slug });
  const add = useCart((s) => s.add);
  const [qty, setQty] = useState(1);

  return (
    <>
      <Navbar />
      <CartDrawer />
      <main className="flex-1 bg-obsidian pt-28">
        <div className="mx-auto max-w-6xl px-6 py-10 lg:px-10">
          <Link href="/#tienda" className="mb-8 inline-flex items-center gap-1 font-body text-xs uppercase tracking-wide text-muted hover:text-gold">
            <ChevronLeft className="h-4 w-4" /> Volver a la tienda
          </Link>

          {product === undefined ? (
            <div className="grid gap-10 lg:grid-cols-2">
              <div className="h-[480px] animate-pulse rounded-2xl bg-smoke" />
              <div className="space-y-4"><div className="h-10 w-2/3 animate-pulse rounded bg-smoke" /><div className="h-24 animate-pulse rounded bg-smoke" /></div>
            </div>
          ) : product === null ? (
            <div className="py-24 text-center">
              <p className="font-display text-3xl text-ivory">Producto no encontrado</p>
              <Link href="/#tienda" className="mt-4 inline-block text-gold hover:underline">Ver la tienda</Link>
            </div>
          ) : (
            <>
              <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
                {/* Imagen */}
                <div className="relative flex h-[460px] items-center justify-center overflow-hidden rounded-2xl border border-gold/15 bg-gradient-to-b from-smoke to-obsidian">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(200,169,110,0.15),transparent_70%)]" />
                  {product.image && (
                    <Image src={product.image} alt={product.name} width={360} height={500} className="relative h-[400px] w-auto object-contain" unoptimized={product.image.startsWith("http")} />
                  )}
                  {product.isLimited && (
                    <span className="absolute left-4 top-4 rounded-full border border-copper/40 bg-obsidian/80 px-3 py-1 font-body text-[10px] uppercase tracking-[0.15em] text-copper">Edición limitada</span>
                  )}
                </div>

                {/* Info */}
                <div>
                  <p className="font-body text-xs uppercase tracking-[0.25em] text-gold">{product.tagline}</p>
                  <h1 className="mt-2 font-display text-4xl font-light text-ivory">{product.name}</h1>
                  {reviews && reviews.length > 0 && <RatingSummary reviews={reviews} />}
                  <p className="mt-5 font-body text-sm leading-relaxed text-muted">{product.description}</p>

                  <dl className="mt-7 grid grid-cols-2 gap-4 border-y border-gold/10 py-6">
                    {[["Agave", product.agave], ["Volumen", product.volume], ["Alcohol", product.alcohol], ["Origen", product.origin], ["Proceso", product.process]].map(([k, v]) => (
                      <div key={k}>
                        <dt className="font-body text-[10px] uppercase tracking-[0.2em] text-muted">{k}</dt>
                        <dd className="mt-0.5 font-body text-sm text-ivory">{v}</dd>
                      </div>
                    ))}
                  </dl>

                  {product.isLimited && (
                    <p className="mt-4 font-body text-xs text-copper">{product.bottlesAvailable ?? 0} de {product.bottlesTotal ?? 0} botellas disponibles</p>
                  )}

                  <p className="mt-6 font-display text-4xl font-light text-ivory">{formatMXN(product.price)}<span className="ml-1 font-body text-sm text-muted">MXN</span></p>

                  {(() => {
                    const soldOut = product.isLimited ? (product.bottlesAvailable ?? 0) === 0 : product.stock === 0;
                    return (
                      <div className="mt-6 flex items-center gap-3">
                        <div className="flex items-center rounded-lg border border-gold/30">
                          <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="px-3 py-2.5 text-ivory hover:text-gold">−</button>
                          <span className="w-8 text-center font-body text-sm text-ivory">{qty}</span>
                          <button onClick={() => setQty((q) => q + 1)} className="px-3 py-2.5 text-ivory hover:text-gold">+</button>
                        </div>
                        <button
                          disabled={soldOut}
                          onClick={() => add({ slug: product.slug, name: product.name, price: product.price, image: product.image }, qty)}
                          className="flex flex-1 items-center justify-center gap-2 border border-gold bg-gold px-6 py-3.5 font-body text-sm uppercase tracking-[0.15em] text-obsidian transition-colors hover:bg-gold-light disabled:opacity-40"
                        >
                          {soldOut ? "Agotado" : <><ShoppingBag className="h-4 w-4" /> Agregar al carrito</>}
                        </button>
                      </div>
                    );
                  })()}

                  <ul className="mt-6 space-y-1.5 font-body text-[11px] text-muted/70">
                    {["100% agave", "Hecho en Oaxaca", "Envío a todo México · 3–5 días"].map((t) => (
                      <li key={t} className="flex items-center gap-1.5"><Check className="h-3 w-3 text-agave-light" /> {t}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Reseñas */}
              <ReviewsSection slug={slug} reviews={reviews} />
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

function Stars({ value, size = "h-4 w-4" }: { value: number; size?: string }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={`${size} ${n <= value ? "fill-gold text-gold" : "text-muted/40"}`} />
      ))}
    </div>
  );
}

function RatingSummary({ reviews }: { reviews: { rating: number }[] }) {
  const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  return (
    <div className="mt-3 flex items-center gap-2">
      <Stars value={Math.round(avg)} />
      <span className="font-body text-sm text-muted">{avg.toFixed(1)} · {reviews.length} reseña{reviews.length !== 1 ? "s" : ""}</span>
    </div>
  );
}

function ReviewsSection({ slug, reviews }: { slug: string; reviews: { _id: string; name: string; rating: number; comment: string; createdAt: number }[] | undefined }) {
  const create = useMutation(api.reviews.create);
  const [name, setName] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !comment.trim()) return;
    setSending(true);
    try {
      await create({ name, rating, comment, productSlug: slug });
      setSent(true); setName(""); setComment(""); setRating(5);
    } finally { setSending(false); }
  }

  const fld = "w-full border border-gold/30 bg-smoke px-4 py-3 font-body text-sm text-ivory placeholder:text-ivory/55 focus:border-gold focus:outline-none";

  return (
    <section className="mt-16 border-t border-gold/10 pt-12">
      <h2 className="font-display text-3xl font-light text-ivory">Reseñas</h2>
      <div className="mt-8 grid gap-10 lg:grid-cols-[1.4fr_1fr]">
        {/* Lista */}
        <div className="space-y-5">
          {reviews === undefined ? (
            <p className="font-body text-sm text-muted">Cargando…</p>
          ) : reviews.length === 0 ? (
            <p className="font-body text-sm text-muted">Aún no hay reseñas. ¡Sé el primero en compartir tu experiencia!</p>
          ) : reviews.map((r) => (
            <div key={r._id} className="rounded-2xl border border-gold/10 bg-smoke p-5">
              <div className="flex items-center justify-between">
                <p className="font-display text-lg text-ivory">{r.name}</p>
                <Stars value={r.rating} />
              </div>
              <p className="mt-2 font-body text-sm leading-relaxed text-muted">{r.comment}</p>
            </div>
          ))}
        </div>

        {/* Formulario */}
        <div className="rounded-2xl border border-gold/15 bg-smoke p-6">
          <h3 className="font-display text-xl text-ivory">Deja tu reseña</h3>
          {sent ? (
            <div className="mt-4 rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-center">
              <p className="font-body text-sm text-emerald-200">¡Gracias por tu reseña! La publicaremos tras revisarla.</p>
              <button onClick={() => setSent(false)} className="mt-2 font-body text-[11px] text-muted/70 underline">Dejar otra</button>
            </div>
          ) : (
            <form onSubmit={submit} className="mt-4 space-y-3">
              <input required placeholder="Tu nombre" className={fld} value={name} onChange={(e) => setName(e.target.value)} />
              <div className="flex items-center gap-2">
                <span className="font-body text-xs text-muted">Calificación:</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} type="button" onClick={() => setRating(n)}>
                      <Star className={`h-6 w-6 ${n <= rating ? "fill-gold text-gold" : "text-muted/40"}`} />
                    </button>
                  ))}
                </div>
              </div>
              <textarea required rows={4} placeholder="¿Qué te pareció?" className={`${fld} resize-none`} value={comment} onChange={(e) => setComment(e.target.value)} />
              <button type="submit" disabled={sending} className="w-full bg-gold px-6 py-3 font-body text-sm uppercase tracking-[0.15em] text-obsidian transition-colors hover:bg-gold-light disabled:opacity-50">
                {sending ? "Enviando…" : "Publicar reseña"}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
