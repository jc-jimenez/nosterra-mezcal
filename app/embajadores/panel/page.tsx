"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from "@/components/store/CartDrawer";
import { AccountDashboard } from "@/components/embajador/AccountDashboard";

const STORAGE = "nosterra_emb_session";

export default function PanelEmbajadorPage() {
  const router = useRouter();
  const [creds, setCreds] = useState<{ email: string; pin: string } | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem(STORAGE);
    if (raw) {
      try { setCreds(JSON.parse(raw)); } catch { /* noop */ }
    }
    setReady(true);
  }, []);

  function logout() {
    sessionStorage.removeItem(STORAGE);
    router.push("/embajadores");
  }

  return (
    <>
      <Navbar />
      <CartDrawer />
      <main className="flex-1 bg-greca bg-obsidian pt-24">
        {!ready ? null : creds ? (
          <AccountDashboard email={creds.email} pin={creds.pin} onLogout={logout} />
        ) : (
          <div className="mx-auto max-w-md px-6 py-24 text-center">
            <p className="font-body text-base text-ivory">Inicia sesión para ver tu panel.</p>
            <a href="/embajadores" className="mt-6 inline-block border border-gold/40 px-6 py-3 font-body text-sm uppercase tracking-wide text-gold transition-colors hover:bg-gold hover:text-obsidian">
              Ir a iniciar sesión
            </a>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
