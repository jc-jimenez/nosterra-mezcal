import { Reveal } from "./Reveal";

const pasos = [
  {
    n: "01",
    title: "Horno cónico de piedra",
    desc: "Las piñas de agave Espadín se cuecen lentamente bajo tierra, sobre piedra volcánica y leña, ganando su carácter ahumado y dulce.",
  },
  {
    n: "02",
    title: "Molienda en tahona",
    desc: "Una rueda de piedra molida por tracción tradicional exprime el agave cocido, liberando las mieles que darán vida al mezcal.",
  },
  {
    n: "03",
    title: "Fermentación natural",
    desc: "En tinas de madera, las levaduras del ambiente oaxaqueño transforman el mosto a su propio ritmo. Sin prisas, sin atajos.",
  },
  {
    n: "04",
    title: "Alambique de cobre",
    desc: "Doble destilación en cobre que pule el destilado hasta su expresión más limpia y cristalina, fiel a la tradición matatleca.",
  },
];

export function ProcesoArtesanal() {
  return (
    <section id="proceso" className="bg-obsidian py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="font-body text-xs uppercase tracking-[0.3em] text-gold">
            Saber hacer ancestral
          </p>
          <h2 className="mt-4 font-display text-5xl font-light text-ivory">
            El proceso{" "}
            <span className="italic text-gradient-gold">artesanal</span>
          </h2>
          <div className="divider-gold mt-6">
            <span className="text-gold/70">◆</span>
          </div>
          <p className="mt-6 font-body text-base leading-relaxed text-muted">
            Cuatro etapas que no han cambiado en generaciones. Así nace cada
            botella de NOSTERRA en Santiago Matatlán, capital mundial del mezcal.
          </p>
        </Reveal>

        <div className="mt-16 grid gap-px overflow-hidden rounded-xl border border-gold/15 bg-gold/10 sm:grid-cols-2 lg:grid-cols-4">
          {pasos.map((p, i) => (
            <Reveal key={p.n} delay={i * 0.1}>
              <div className="group h-full bg-smoke p-8 transition-colors hover:bg-agave/20">
                <span className="font-display text-5xl font-light text-gold/40 transition-colors group-hover:text-gold">
                  {p.n}
                </span>
                <h3 className="mt-4 font-display text-2xl text-ivory">
                  {p.title}
                </h3>
                <p className="mt-3 font-body text-sm leading-relaxed text-muted">
                  {p.desc}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
