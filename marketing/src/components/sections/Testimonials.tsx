"use client";

import { testimonials } from "@/lib/data";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/effects/FadeIn";

export function Testimonials() {
  return (
    <section id="testimonials" className="section-padding bg-[var(--ink)] text-white">
      <div className="mx-auto max-w-7xl">
        <FadeIn className="mb-14 mx-auto max-w-2xl text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[var(--coral)]">
            Traveller stories
          </p>
          <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
            Loved by families, couples & groups
          </h2>
        </FadeIn>

        <StaggerContainer className="grid gap-6 lg:grid-cols-3">
          {testimonials.map((t) => (
            <StaggerItem key={t.name}>
              <blockquote className="flex h-full flex-col rounded-3xl border border-white/10 bg-white/5 p-7 backdrop-blur-sm">
                <p className="flex-1 text-base leading-relaxed text-white/80">&ldquo;{t.quote}&rdquo;</p>
                <footer className="mt-6 border-t border-white/10 pt-5">
                  <cite className="not-italic font-display text-lg font-bold text-white">{t.name}</cite>
                  <p className="mt-0.5 text-sm text-white/45">{t.trip}</p>
                </footer>
              </blockquote>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
