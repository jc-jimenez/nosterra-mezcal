import Image from "next/image";
import Link from "next/link";
import { featuredProduct as p } from "@/lib/products";
import { Reveal } from "./Reveal";

const specs = [
  { label: "Agave", value: p.agave },
  { label: "Volumen", value: p.volume },
  { label: "Alc. Vol.", value: p.alcohol },
  { label: "Origen", value: "Oaxaca" },
];

export function ProductShowcase() {
  return (
    <section id="productos" className="bg-greca bg-obsidian py-28">
      <div className="mx-auto grid max-w-7xl items-center gap-16 px-6 lg:grid-cols-2 lg:px-10">
        {/* Imagen botella */}
        <Reveal className="relative mx-auto w-full max-w-md">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,rgba(200,169,110,0.18),transparent_70%)]" />
          <Image
            src={p.image}
            alt={p.name}
            width={500}
            height={750}
            className="mx-auto h-auto w-full max-w-[380px] object-contain drop-shadow-2xl"
          />
        </Reveal>

        {/* Detalles */}
        <div>
          <Reveal>
            <p className="font-body text-xs uppercase tracking-[0.3em] text-gold">
              {p.tagline}
            </p>
            <h2 className="mt-4 font-display text-5xl font-light leading-tight text-ivory">
              Joven <span className="text-gradient-gold">Cristalino</span>
            </h2>
            <p className="mt-6 max-w-md font-body text-base leading-relaxed text-muted">
              {p.description}
            </p>
          </Reveal>

          <Reveal delay={0.15}>
            <div className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-gold/15 bg-gold/10 sm:grid-cols-4">
              {specs.map((s) => (
                <div key={s.label} className="bg-smoke p-4 text-center">
                  <p className="font-body text-[10px] uppercase tracking-[0.2em] text-muted">
                    {s.label}
                  </p>
                  <p className="mt-1 font-display text-lg text-ivory">
                    {s.value}
                  </p>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal delay={0.3}>
            <div className="mt-10 flex flex-wrap items-end gap-6">
              <div>
                <p className="font-body text-[10px] uppercase tracking-[0.2em] text-muted">
                  Precio
                </p>
                <p className="font-display text-4xl font-light text-ivory">
                  ${p.price.toLocaleString("es-MX")}
                  <span className="ml-1 font-body text-sm text-muted">MXN</span>
                </p>
              </div>
              <span className="mb-1 inline-flex items-center gap-2 rounded-full border border-agave-light/40 bg-agave/30 px-3 py-1 font-body text-xs text-agave-light">
                <span className="h-1.5 w-1.5 rounded-full bg-agave-light" />
                Disponible
              </span>
            </div>

            <Link
              href="#contacto"
              className="mt-8 inline-block border border-gold bg-gold px-10 py-3.5 font-body text-sm uppercase tracking-[0.18em] text-obsidian transition-colors hover:bg-gold-light"
            >
              Reservar botella
            </Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
