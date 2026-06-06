import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-gold/15 bg-smoke">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-10">
        <div className="grid gap-12 md:grid-cols-4">
          {/* Marca */}
          <div className="md:col-span-2">
            <span className="font-display text-3xl font-light tracking-[0.2em] text-ivory">
              NOSTERRA
            </span>
            <p className="mt-4 max-w-sm font-body text-sm leading-relaxed text-muted">
              Mezcal artesanal de Santiago Matatlán, Oaxaca. Elaborado con agave
              Espadín, tahona de piedra y alambique de cobre por Casa Jiménez
              Elixirs &amp; Spirits.
            </p>
            <p className="mt-6 font-display text-lg font-light italic text-gold/90">
              «La distancia puede separar caminos… pero nunca nuestras raíces.»
            </p>
          </div>

          {/* Navegación */}
          <div>
            <h4 className="font-body text-xs uppercase tracking-[0.25em] text-gold">
              Explora
            </h4>
            <ul className="mt-5 space-y-3 font-body text-sm text-muted">
              {[
                { href: "/#historia", label: "Historia" },
                { href: "/#proceso", label: "Proceso artesanal" },
                { href: "/#edicion", label: "Edición conmemorativa" },
                { href: "/#tienda", label: "Comprar" },
                { href: "/embajadores", label: "Embajadores" },
              ].map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="transition-colors hover:text-ivory"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contacto */}
          <div>
            <h4 className="font-body text-xs uppercase tracking-[0.25em] text-gold">
              Contacto
            </h4>
            <ul className="mt-5 space-y-3 font-body text-sm text-muted">
              <li>
                <a
                  href="mailto:hola@nosterramezcal.com"
                  className="transition-colors hover:text-ivory"
                >
                  hola@nosterramezcal.com
                </a>
              </li>
              <li>Santiago Matatlán, Oaxaca</li>
              <li>Casa Jiménez Elixirs &amp; Spirits</li>
            </ul>
          </div>
        </div>

        {/* Leyenda legal */}
        <div className="mt-14 border-t border-gold/10 pt-8">
          <p className="font-body text-[11px] leading-relaxed text-muted/70">
            El abuso en el consumo de este producto es nocivo para la salud.
            Prohibida su venta a menores de edad. Evita el exceso. NOM-070-SCFI.
          </p>
          <div className="mt-4 flex flex-col justify-between gap-2 font-body text-[11px] text-muted/60 sm:flex-row">
            <span>
              © {new Date().getFullYear()} NOSTERRA Mezcal · Casa Jiménez Elixirs
              &amp; Spirits.
            </span>
            <div className="flex gap-5">
              <Link href="/privacidad" className="hover:text-ivory">
                Privacidad
              </Link>
              <Link href="/terminos" className="hover:text-ivory">
                Términos
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
