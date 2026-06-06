"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingBag, Crown } from "lucide-react";
import { useCart } from "@/hooks/useCart";

const links = [
  { href: "/#tienda", label: "Tienda" },
  { href: "/#edicion", label: "Edición Limitada" },
  { href: "/#proceso", label: "Proceso" },
  { href: "/#contacto", label: "Contacto" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const openCart = useCart((s) => s.open);
  const count = useCart((s) => s.count());

  useEffect(() => {
    setMounted(true);
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const n = mounted ? count : 0;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled
          ? "border-b border-gold/15 bg-obsidian/90 backdrop-blur-md"
          : "bg-transparent"
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-10">
        {/* Wordmark */}
        <Link href="/" className="group flex flex-col leading-none">
          <span className="font-display text-2xl font-light tracking-[0.2em] text-ivory transition-colors group-hover:text-gold">
            NOSTERRA
          </span>
          <span className="font-body text-[9px] uppercase tracking-[0.4em] text-gold/80">
            Mezcal
          </span>
        </Link>

        {/* Desktop links */}
        <div className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="font-body text-xs uppercase tracking-[0.18em] text-ivory/70 transition-colors hover:text-gold"
            >
              {l.label}
            </Link>
          ))}
          {/* Embajadores — destacado */}
          <Link
            href="/embajadores"
            className="animate-glow group flex items-center gap-1.5 rounded-full border border-gold/50 bg-gradient-to-r from-gold/20 via-copper/15 to-gold/20 px-4 py-1.5 font-body text-xs font-medium uppercase tracking-[0.15em] text-gold-light transition-all hover:from-gold hover:via-gold hover:to-gold hover:text-obsidian"
          >
            <Crown className="h-3.5 w-3.5 transition-transform group-hover:scale-110" />
            Sé Embajador
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/#tienda"
            className="hidden border border-gold/60 px-5 py-2 font-body text-xs uppercase tracking-[0.18em] text-gold transition-colors hover:bg-gold hover:text-obsidian sm:block"
          >
            Comprar
          </Link>

          {/* Carrito */}
          <button
            onClick={openCart}
            className="relative flex h-9 w-9 items-center justify-center text-ivory transition-colors hover:text-gold"
            aria-label="Carrito"
          >
            <ShoppingBag className="h-5 w-5" />
            {n > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 font-body text-[10px] font-medium text-obsidian">
                {n}
              </span>
            )}
          </button>

          {/* Mobile toggle */}
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex h-8 w-8 flex-col items-center justify-center gap-1.5 md:hidden"
            aria-label="Menú"
          >
            <span className={`h-px w-6 bg-ivory transition-transform ${open ? "translate-y-[7px] rotate-45" : ""}`} />
            <span className={`h-px w-6 bg-ivory transition-opacity ${open ? "opacity-0" : ""}`} />
            <span className={`h-px w-6 bg-ivory transition-transform ${open ? "-translate-y-[7px] -rotate-45" : ""}`} />
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-gold/10 bg-obsidian/95 px-6 py-6 backdrop-blur-md md:hidden">
          <div className="flex flex-col gap-5">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="font-body text-sm uppercase tracking-[0.18em] text-ivory/80"
              >
                {l.label}
              </Link>
            ))}
            <Link
              href="/embajadores"
              onClick={() => setOpen(false)}
              className="mt-2 flex items-center justify-center gap-2 rounded-full border border-gold/50 bg-gradient-to-r from-gold/20 to-copper/15 px-5 py-3 text-center font-body text-sm font-medium uppercase tracking-[0.15em] text-gold-light"
            >
              <Crown className="h-4 w-4" /> Sé Embajador
            </Link>
            <Link
              href="/#tienda"
              onClick={() => setOpen(false)}
              className="border border-gold/60 px-5 py-3 text-center font-body text-sm uppercase tracking-[0.18em] text-gold"
            >
              Comprar
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
