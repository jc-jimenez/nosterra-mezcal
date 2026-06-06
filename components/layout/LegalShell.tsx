import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export function LegalShell({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="flex-1 bg-obsidian pt-28">
        <section className="mx-auto max-w-3xl px-6 py-12">
          <p className="font-body text-xs uppercase tracking-[0.3em] text-gold">NOSTERRA Mezcal</p>
          <h1 className="mt-3 font-display text-4xl font-light text-ivory">{title}</h1>
          <p className="mt-2 font-body text-xs text-muted">Última actualización: {updated}</p>
          <div className="legal mt-10 space-y-6 pb-8">{children}</div>
        </section>
      </main>
      <Footer />
    </>
  );
}

export function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="mt-10 font-display text-2xl text-ivory">{children}</h2>;
}

export function P({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <p className={`font-body text-sm leading-relaxed text-muted ${className}`}>{children}</p>;
}

export function UL({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="ml-5 list-disc space-y-1.5 font-body text-sm leading-relaxed text-muted">
      {items.map((it, i) => <li key={i}>{it}</li>)}
    </ul>
  );
}
