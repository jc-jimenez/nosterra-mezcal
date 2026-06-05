import Image from "next/image";
import { Reveal } from "./Reveal";

export function HistoriaSection() {
  return (
    <section id="historia" className="relative overflow-hidden bg-smoke py-28">
      <div className="mx-auto grid max-w-7xl items-center gap-16 px-6 lg:grid-cols-2 lg:px-10">
        {/* Imagen */}
        <Reveal className="relative">
          <div className="overflow-hidden rounded-xl border border-gold/15 shadow-2xl">
            <Image
              src="/images/hero-campo.png"
              alt="Campo de agave al atardecer en Santiago Matatlán, Oaxaca"
              width={800}
              height={1000}
              className="h-[460px] w-full object-cover lg:h-[560px]"
            />
          </div>
          {/* Sello flotante */}
          <div className="absolute -bottom-6 -right-4 hidden rounded-lg border border-gold/30 bg-obsidian/95 px-6 py-4 backdrop-blur sm:block">
            <p className="font-display text-3xl text-gold">100%</p>
            <p className="font-body text-[10px] uppercase tracking-[0.2em] text-muted">
              Agave Espadín
            </p>
          </div>
        </Reveal>

        {/* Texto */}
        <div>
          <Reveal>
            <p className="font-body text-xs uppercase tracking-[0.3em] text-gold">
              Nuestra historia
            </p>
            <h2 className="mt-4 font-display text-5xl font-light leading-tight text-ivory">
              Raíces que el tiempo{" "}
              <span className="italic text-gradient-gold">no separa</span>
            </h2>
          </Reveal>

          <Reveal delay={0.15}>
            <div className="mt-8 space-y-5 font-body text-base leading-relaxed text-muted">
              <p>
                NOSTERRA nace en Santiago Matatlán, Oaxaca — la capital mundial
                del mezcal — de la mano de{" "}
                <span className="text-ivory">
                  Casa Jiménez Elixirs &amp; Spirits
                </span>
                . Cada botella es un puente entre quienes partieron y la tierra
                que los vio nacer.
              </p>
              <p>
                Elaborado por maestros mezcaleros que heredaron el oficio de sus
                abuelos, NOSTERRA honra el agave, el fuego y la piedra. Un mezcal
                que sabe a origen, a memoria y a comunidad.
              </p>
              <p className="font-display text-xl italic text-gold/90">
                «Su nombre lo dice todo: <span className="not-italic">nos</span>{" "}
                + <span className="not-italic">terra</span> — nuestra tierra.»
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.3}>
            <dl className="mt-10 grid grid-cols-3 gap-6 border-t border-gold/15 pt-8">
              {[
                { k: "Origen", v: "Matatlán" },
                { k: "Tradición", v: "Artesanal" },
                { k: "Estado", v: "Oaxaca" },
              ].map((x) => (
                <div key={x.k}>
                  <dt className="font-body text-[10px] uppercase tracking-[0.2em] text-muted">
                    {x.k}
                  </dt>
                  <dd className="mt-1 font-display text-xl text-ivory">{x.v}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
