"use client";

import Image from "next/image";
import { ShoppingBag, Check } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useCart } from "@/hooks/useCart";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import { formatMXN } from "@/lib/store-config";
import { Reveal } from "./Reveal";

export function Tienda() {
  const add = useCart((s) => s.add);
  const products = useQuery(api.products.listActive);
  const settings = useStoreSettings();

  return (
    <section id="tienda" className="bg-greca bg-obsidian py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="font-body text-xs uppercase tracking-[0.3em] text-gold">
            Tienda en línea
          </p>
          <h2 className="mt-4 font-display text-5xl font-light text-ivory">
            Elige tu <span className="italic text-gradient-gold">mezcal</span>
          </h2>
          <p className="mt-5 font-body text-sm text-muted">
            {settings.shippingNote} · Envío gratis desde{" "}
            {formatMXN(settings.freeShippingFrom)}
          </p>
        </Reveal>

        {products === undefined ? (
          <div className="mt-14 grid gap-8 md:grid-cols-2 lg:mx-auto lg:max-w-5xl">
            {[1, 2].map((i) => (
              <div key={i} className="h-[520px] animate-pulse rounded-2xl border border-gold/10 bg-smoke" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <p className="mt-14 text-center font-body text-sm text-muted">
            Próximamente más mezcales.
          </p>
        ) : (
          <div className="mt-14 grid gap-8 md:grid-cols-2 lg:mx-auto lg:max-w-5xl">
            {products.map((p, idx) => {
              const soldOut = p.isLimited
                ? (p.bottlesAvailable ?? 0) === 0
                : p.stock === 0;
              return (
                <Reveal key={p._id} delay={idx * 0.1}>
                  <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-gold/15 bg-smoke transition-colors hover:border-gold/40">
                    <div className="relative flex h-72 items-center justify-center overflow-hidden bg-gradient-to-b from-obsidian/40 to-smoke">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(200,169,110,0.15),transparent_70%)]" />
                      {p.image && (
                        <Image
                          src={p.image}
                          alt={p.name}
                          width={300}
                          height={400}
                          className="relative h-60 w-auto object-contain transition-transform duration-500 group-hover:scale-105"
                          unoptimized={p.image.startsWith("http")}
                        />
                      )}
                      {p.isLimited && (
                        <span className="absolute left-4 top-4 rounded-full border border-copper/40 bg-obsidian/80 px-3 py-1 font-body text-[10px] uppercase tracking-[0.15em] text-copper">
                          Edición limitada
                        </span>
                      )}
                    </div>

                    <div className="flex flex-1 flex-col p-6">
                      <p className="font-body text-[11px] uppercase tracking-[0.2em] text-gold">
                        {p.tagline}
                      </p>
                      <h3 className="mt-1.5 font-display text-2xl text-ivory">{p.name}</h3>
                      <p className="mt-3 font-body text-sm leading-relaxed text-muted line-clamp-3">
                        {p.description}
                      </p>

                      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 font-body text-xs text-muted/80">
                        <span>{p.agave}</span>
                        <span>·</span>
                        <span>{p.volume}</span>
                        <span>·</span>
                        <span>{p.alcohol}</span>
                      </div>

                      {p.isLimited && (
                        <p className="mt-3 font-body text-xs text-copper">
                          {p.bottlesAvailable ?? 0} de {p.bottlesTotal ?? 0} botellas disponibles
                        </p>
                      )}

                      <div className="mt-6 flex items-end justify-between border-t border-gold/10 pt-5">
                        <p className="font-display text-3xl font-light text-ivory">
                          {formatMXN(p.price)}
                        </p>
                      </div>

                      <div className="mt-4">
                        <button
                          disabled={soldOut}
                          onClick={() =>
                            add({ slug: p.slug, name: p.name, price: p.price, image: p.image })
                          }
                          className="flex w-full items-center justify-center gap-2 border border-gold bg-gold px-5 py-3 font-body text-xs uppercase tracking-[0.15em] text-obsidian transition-colors hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {soldOut ? (
                            "Agotado"
                          ) : (
                            <>
                              <ShoppingBag className="h-4 w-4" />
                              Comprar ahora
                            </>
                          )}
                        </button>
                      </div>

                      <ul className="mt-5 space-y-1.5 font-body text-[11px] text-muted/70">
                        {["100% agave Espadín", "Hecho en Oaxaca", "Envío a todo México"].map((t) => (
                          <li key={t} className="flex items-center gap-1.5">
                            <Check className="h-3 w-3 text-agave-light" />
                            {t}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </article>
                </Reveal>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
