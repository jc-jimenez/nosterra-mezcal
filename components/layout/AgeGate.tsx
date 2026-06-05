"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

const STORAGE_KEY = "nosterra_age_verified";
const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

export function AgeGate() {
  const [verified, setVerified] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const ts = Number(raw);
        if (!Number.isNaN(ts) && Date.now() - ts < THIRTY_DAYS) {
          setVerified(true);
          return;
        }
      }
    } catch {
      /* localStorage no disponible */
    }
    setVerified(false);
  }, []);

  function confirm() {
    try {
      localStorage.setItem(STORAGE_KEY, String(Date.now()));
    } catch {
      /* ignore */
    }
    setVerified(true);
  }

  function reject() {
    window.location.href = "https://www.google.com";
  }

  // Mientras decide / ya verificado → no render
  if (verified === null || verified === true) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-obsidian px-6">
      <div className="bg-greca absolute inset-0 opacity-60" aria-hidden />
      <div className="relative z-10 w-full max-w-md text-center">
        <div className="mx-auto mb-8 w-40 overflow-hidden rounded-2xl border border-gold/20 shadow-2xl">
          <Image
            src="/images/logo4.svg"
            alt="NOSTERRA Mezcal"
            width={690}
            height={570}
            className="h-auto w-full"
            unoptimized
            priority
          />
        </div>

        <h1 className="font-display text-4xl font-light tracking-wide text-ivory">
          NOSTERRA
        </h1>
        <p className="mt-1 font-body text-xs uppercase tracking-[0.35em] text-gold">
          Mezcal Artesanal
        </p>

        <div className="divider-gold my-8">
          <span className="text-gold/70">◆</span>
        </div>

        <p className="font-display text-2xl font-light italic text-ivory/90">
          ¿Eres mayor de 18 años?
        </p>
        <p className="mt-3 font-body text-sm text-muted">
          Para entrar debes tener la edad legal para consumir bebidas
          alcohólicas en tu país.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={confirm}
            className="group relative overflow-hidden border border-gold bg-gold px-8 py-3 font-body text-sm uppercase tracking-[0.15em] text-obsidian transition-colors hover:bg-gold-light"
          >
            Sí, tengo más de 18
          </button>
          <button
            onClick={reject}
            className="border border-muted/40 px-8 py-3 font-body text-sm uppercase tracking-[0.15em] text-muted transition-colors hover:border-ivory/60 hover:text-ivory"
          >
            No
          </button>
        </div>

        <p className="mx-auto mt-10 max-w-sm font-body text-[11px] leading-relaxed text-muted/80">
          El abuso en el consumo de este producto es nocivo para la salud.
          Prohibida su venta a menores de edad.
        </p>
      </div>
    </div>
  );
}
