"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { X, Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import { formatMXN } from "@/lib/store-config";

export function CartDrawer() {
  const { items, isOpen, close, setQty, remove, subtotal, count } = useCart();
  const settings = useStoreSettings();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Evitar mismatch de hidratación con el carrito persistido
  const total = mounted ? subtotal() : 0;
  const n = mounted ? count() : 0;
  const freeShip = total >= settings.freeShippingFrom;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={close}
        className={`fixed inset-0 z-[60] bg-obsidian/70 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden
      />

      {/* Drawer */}
      <aside
        className={`fixed right-0 top-0 z-[70] flex h-full w-full max-w-md flex-col border-l border-gold/20 bg-smoke transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        aria-label="Carrito de compra"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gold/15 px-6 py-5">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="h-5 w-5 text-gold" />
            <h2 className="font-display text-xl text-ivory">
              Tu pedido{" "}
              {n > 0 && <span className="text-gold">({n})</span>}
            </h2>
          </div>
          <button
            onClick={close}
            className="text-muted transition-colors hover:text-ivory"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {!mounted || items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <ShoppingBag className="h-10 w-10 text-muted/40" />
              <p className="mt-4 font-body text-sm text-muted">
                Tu carrito está vacío
              </p>
              <button
                onClick={close}
                className="mt-6 border border-gold/40 px-6 py-2.5 font-body text-xs uppercase tracking-[0.15em] text-gold transition-colors hover:bg-gold hover:text-obsidian"
              >
                Explorar mezcales
              </button>
            </div>
          ) : (
            <ul className="space-y-4">
              {items.map((i) => (
                <li
                  key={i.slug}
                  className="flex gap-4 border-b border-gold/10 pb-4"
                >
                  <div className="h-20 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-obsidian/60">
                    <Image
                      src={i.image}
                      alt={i.name}
                      width={80}
                      height={100}
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <div className="flex flex-1 flex-col">
                    <p className="font-body text-sm text-ivory">{i.name}</p>
                    <p className="font-body text-xs text-gold">
                      {formatMXN(i.price)}
                    </p>
                    <div className="mt-auto flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setQty(i.slug, i.qty - 1)}
                          className="flex h-6 w-6 items-center justify-center border border-gold/30 text-muted transition-colors hover:text-ivory"
                          aria-label="Menos"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-6 text-center font-body text-sm text-ivory">
                          {i.qty}
                        </span>
                        <button
                          onClick={() => setQty(i.slug, i.qty + 1)}
                          className="flex h-6 w-6 items-center justify-center border border-gold/30 text-muted transition-colors hover:text-ivory"
                          aria-label="Más"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <button
                        onClick={() => remove(i.slug)}
                        className="text-muted/60 transition-colors hover:text-red-400"
                        aria-label="Quitar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <p className="font-display text-lg text-ivory">
                    {formatMXN(i.price * i.qty)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer / checkout */}
        {mounted && items.length > 0 && (
          <div className="border-t border-gold/15 px-6 py-5">
            <div className="mb-2 flex items-center justify-between font-body">
              <span className="text-sm text-muted">Subtotal</span>
              <span className="font-display text-2xl text-ivory">
                {formatMXN(total)}
              </span>
            </div>
            <p className="mb-4 font-body text-xs text-muted/70">
              {freeShip
                ? "🎉 ¡Tu pedido califica para envío gratis!"
                : `${settings.shippingNote} · Envío gratis desde ${formatMXN(
                    settings.freeShippingFrom
                  )}`}
            </p>
            <Link
              href="/checkout"
              onClick={close}
              className="flex w-full items-center justify-center gap-2 bg-gold px-6 py-3.5 font-body text-sm uppercase tracking-[0.15em] text-obsidian transition-colors hover:bg-gold-light"
            >
              Finalizar compra
            </Link>
            <p className="mt-3 text-center font-body text-[11px] text-muted/60">
              Siguiente paso: datos de envío. El pago se acuerda por WhatsApp.
            </p>
          </div>
        )}
      </aside>
    </>
  );
}
