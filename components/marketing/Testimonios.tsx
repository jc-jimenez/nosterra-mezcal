"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Star } from "lucide-react";
import { Reveal } from "./Reveal";

export function Testimonios() {
  const reviews = useQuery(api.reviews.listFeatured);
  if (!reviews || reviews.length === 0) return null;

  return (
    <section className="bg-obsidian py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="font-body text-xs uppercase tracking-[0.3em] text-gold">Lo que dicen</p>
          <h2 className="mt-4 font-display text-5xl font-light text-ivory">
            Voces que <span className="italic text-gradient-gold">nos respaldan</span>
          </h2>
          <div className="divider-gold mt-6"><span className="text-gold/70">◆</span></div>
        </Reveal>

        <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {reviews.map((r, i) => (
            <Reveal key={r._id} delay={(i % 3) * 0.1}>
              <figure className="flex h-full flex-col rounded-2xl border border-gold/15 bg-smoke p-7">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star key={n} className={`h-4 w-4 ${n <= r.rating ? "fill-gold text-gold" : "text-muted/40"}`} />
                  ))}
                </div>
                <blockquote className="mt-4 flex-1 font-body text-sm leading-relaxed text-muted">
                  “{r.comment}”
                </blockquote>
                <figcaption className="mt-5 font-display text-lg text-ivory">— {r.name}</figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
