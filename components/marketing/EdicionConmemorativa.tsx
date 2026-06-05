"use client";

import Image from "next/image";
import { ShoppingBag } from "lucide-react";
import { numberedEdition as p } from "@/lib/products";
import { useCart } from "@/hooks/useCart";
import { formatMXN } from "@/lib/store-config";
import { Reveal } from "./Reveal";

export function EdicionConmemorativa() {
  const add = useCart((s) => s.add);
  const { total, available } = p.numbered!;
  const soldPct = Math.round(((total - available) / total) * 100);

  return (
    <section
      id="edicion"
      className="relative overflow-hidden border-y border-gold/15 bg-smoke py-28"
    >
      {/* Resplandor cobre */}
      <div className="absolute left-1/2 top-0 -z-0 h-96 w-96 -translate-x-1/2 rounded-full bg-copper/10 blur-3xl" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-16 px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-10">
        {/* Texto */}
        <div>
          <Reveal>
            <p className="font-body text-xs uppercase tracking-[0.3em] text-copper">
              Edición limitada · 84 botellas
            </p>
            <h2 className="mt-4 font-display text-5xl font-light leading-tight text-ivory lg:text-6xl">
              Conmemorativa
              <span className="block font-display text-3xl italic text-gold/90">
                Gral. Artemio Brito Abarca
              </span>
            </h2>
            <p className="mt-6 max-w-lg font-body text-base leading-relaxed text-muted">
              {p.description}
            </p>
          </Reveal>

          {/* Contador de disponibilidad (tiempo real con Convex en Fase 2) */}
          <Reveal delay={0.15}>
            <div className="mt-10 max-w-md">
              <div className="flex items-end justify-between font-body">
                <span className="text-xs uppercase tracking-[0.2em] text-muted">
                  Botellas disponibles
                </span>
                <span className="font-display text-2xl text-gold">
                  {available}
                  <span className="text-base text-muted"> / {total}</span>
                </span>
              </div>
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-obsidian">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-copper to-gold"
                  style={{ width: `${Math.max(soldPct, 3)}%` }}
                />
              </div>
              <p className="mt-2 font-body text-[11px] text-muted/70">
                Cada botella lleva su número grabado del 1 al 84.
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.3}>
            <div className="mt-10 flex flex-wrap items-end gap-6">
              <p className="font-display text-4xl font-light text-ivory">
                {formatMXN(p.price)}
                <span className="ml-1 font-body text-sm text-muted">MXN</span>
              </p>
              <button
                onClick={() =>
                  add({ slug: p.slug, name: p.name, price: p.price, image: p.image })
                }
                className="flex items-center gap-2 border border-copper bg-copper/90 px-9 py-3.5 font-body text-sm uppercase tracking-[0.18em] text-ivory transition-colors hover:bg-copper"
              >
                <ShoppingBag className="h-4 w-4" />
                Comprar mi botella
              </button>
            </div>
          </Reveal>
        </div>

        {/* Etiqueta Artemio */}
        <Reveal delay={0.2} className="relative mx-auto w-full max-w-sm">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,rgba(155,107,58,0.25),transparent_70%)]" />
          <div className="overflow-hidden rounded-lg border border-gold/20 shadow-2xl">
            <Image
              src={p.image}
              alt="Etiqueta de la Edición Conmemorativa Gral. Artemio Brito Abarca"
              width={500}
              height={700}
              className="h-auto w-full object-contain"
            />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
