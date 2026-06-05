"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ShoppingBag, Truck } from "lucide-react";
import { featuredProduct } from "@/lib/products";
import { useCart } from "@/hooks/useCart";
import { STORE_CONFIG, formatMXN } from "@/lib/store-config";

export function Hero() {
  const add = useCart((s) => s.add);

  return (
    <section
      id="top"
      className="relative flex min-h-screen items-center overflow-hidden"
    >
      {/* Fondo */}
      <Image
        src="/images/hero-campo.png"
        alt="Botella NOSTERRA en un campo de agave al atardecer en Oaxaca"
        fill
        priority
        className="object-cover object-center"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-obsidian via-obsidian/85 to-obsidian/30" />
      <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-transparent to-obsidian/60" />

      {/* Contenido — alineado a la izquierda, enfoque comercial */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-6 lg:px-10">
        <div className="max-w-xl">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-obsidian/40 px-4 py-1.5 backdrop-blur"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-gold" />
            <span className="font-body text-[11px] uppercase tracking-[0.25em] text-gold">
              Mezcal Artesanal · Santiago Matatlán
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.3 }}
            className="mt-6 font-display text-6xl font-light leading-[1.05] tracking-tight text-ivory sm:text-7xl"
          >
            El espíritu de
            <span className="block italic text-gradient-gold">nuestra tierra</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.45 }}
            className="mt-6 max-w-md font-body text-base leading-relaxed text-ivory/80"
          >
            Mezcal joven cristalino de agave Espadín, hecho a mano en Oaxaca con
            tahona de piedra y alambique de cobre. Llévalo a tu mesa.
          </motion.p>

          {/* Precio + CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.6 }}
            className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4"
          >
            <div>
              <p className="font-body text-[11px] uppercase tracking-[0.2em] text-muted">
                Desde
              </p>
              <p className="font-display text-4xl font-light text-ivory">
                {formatMXN(featuredProduct.price)}
                <span className="ml-1 font-body text-sm text-muted">MXN</span>
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() =>
                  add({
                    slug: featuredProduct.slug,
                    name: featuredProduct.name,
                    price: featuredProduct.price,
                    image: featuredProduct.image,
                  })
                }
                className="flex items-center justify-center gap-2 border border-gold bg-gold px-8 py-3.5 font-body text-sm uppercase tracking-[0.15em] text-obsidian transition-colors hover:bg-gold-light"
              >
                <ShoppingBag className="h-4 w-4" />
                Comprar ahora
              </button>
              <Link
                href="#tienda"
                className="flex items-center justify-center border border-ivory/30 px-8 py-3.5 font-body text-sm uppercase tracking-[0.15em] text-ivory transition-colors hover:border-gold hover:text-gold"
              >
                Ver tienda
              </Link>
            </div>
          </motion.div>

          {/* Trust */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.9, delay: 0.8 }}
            className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 font-body text-xs text-ivory/60"
          >
            <span className="flex items-center gap-1.5">
              <Truck className="h-3.5 w-3.5 text-gold" />
              {STORE_CONFIG.shippingNote}
            </span>
            <span>· 100% agave</span>
            <span>· Hecho en México</span>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
