"use client";

import { useState } from "react";

const businessTypes = [
  { value: "restaurante", label: "Restaurante" },
  { value: "bar", label: "Bar / Cantina" },
  { value: "tienda", label: "Tienda / Boutique" },
  { value: "distribuidor", label: "Distribuidor" },
  { value: "otro", label: "Otro" },
];

const inputClass =
  "w-full border border-gold/20 bg-obsidian/60 px-4 py-3 font-body text-sm text-ivory placeholder:text-muted/60 focus:border-gold focus:outline-none transition-colors";

export function ContactoSection() {
  const [sent, setSent] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Fase 2: enviar a Convex (distributorRequests). Por ahora, confirmación local.
    setSent(true);
  }

  return (
    <section id="contacto" className="bg-greca bg-obsidian py-28">
      <div className="mx-auto max-w-6xl px-6 lg:px-10">
        <div className="grid gap-16 lg:grid-cols-2">
          {/* Intro */}
          <div>
            <p className="font-body text-xs uppercase tracking-[0.3em] text-gold">
              Súmate a NOSTERRA
            </p>
            <h2 className="mt-4 font-display text-5xl font-light leading-tight text-ivory">
              Lleva nuestro mezcal{" "}
              <span className="italic text-gradient-gold">a tu mesa</span>
            </h2>
            <p className="mt-6 max-w-md font-body text-base leading-relaxed text-muted">
              ¿Tienes un restaurante, bar o boutique? Conviértete en punto de
              venta de NOSTERRA. Déjanos tus datos y nuestro equipo te contactará.
            </p>

            <div className="mt-10 space-y-4 font-body text-sm">
              <a
                href="mailto:hola@nosterramezcal.com"
                className="flex items-center gap-3 text-muted transition-colors hover:text-gold"
              >
                <span className="text-gold">✉</span> hola@nosterramezcal.com
              </a>
              <p className="flex items-center gap-3 text-muted">
                <span className="text-gold">⌖</span> Santiago Matatlán, Oaxaca,
                México
              </p>
              <p className="flex items-center gap-3 text-muted">
                <span className="text-gold">◈</span> Casa Jiménez Elixirs &amp;
                Spirits
              </p>
            </div>
          </div>

          {/* Formulario */}
          <div className="border border-gold/15 bg-smoke/60 p-8 backdrop-blur">
            {sent ? (
              <div className="flex h-full min-h-[400px] flex-col items-center justify-center text-center">
                <span className="font-display text-5xl text-gold">◆</span>
                <h3 className="mt-6 font-display text-3xl text-ivory">
                  ¡Gracias!
                </h3>
                <p className="mt-3 max-w-xs font-body text-sm text-muted">
                  Hemos recibido tu solicitud. Nuestro equipo te contactará muy
                  pronto para sumarte a la familia NOSTERRA.
                </p>
                <button
                  onClick={() => setSent(false)}
                  className="mt-8 border border-gold/40 px-6 py-2.5 font-body text-xs uppercase tracking-[0.15em] text-gold transition-colors hover:bg-gold hover:text-obsidian"
                >
                  Enviar otra solicitud
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <input
                    required
                    placeholder="Nombre del negocio"
                    className={inputClass}
                  />
                  <input
                    required
                    placeholder="Nombre de contacto"
                    className={inputClass}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <input
                    required
                    type="email"
                    placeholder="Correo electrónico"
                    className={inputClass}
                  />
                  <input
                    type="tel"
                    placeholder="Teléfono / WhatsApp"
                    className={inputClass}
                  />
                </div>
                <select required defaultValue="" className={inputClass}>
                  <option value="" disabled>
                    Tipo de negocio
                  </option>
                  {businessTypes.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
                <div className="grid gap-4 sm:grid-cols-2">
                  <input required placeholder="Ciudad" className={inputClass} />
                  <input required placeholder="Estado" className={inputClass} />
                </div>
                <textarea
                  rows={3}
                  placeholder="Cuéntanos sobre tu negocio (opcional)"
                  className={`${inputClass} resize-none`}
                />
                <button
                  type="submit"
                  className="w-full border border-gold bg-gold px-8 py-3.5 font-body text-sm uppercase tracking-[0.18em] text-obsidian transition-colors hover:bg-gold-light"
                >
                  Quiero ser distribuidor
                </button>
                <p className="text-center font-body text-[11px] text-muted/60">
                  Al enviar aceptas nuestra política de privacidad.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
