"use client";

import { Star } from "lucide-react";
import { SectionHeading, StaggerContainer, StaggerItem } from "@/components/effects/FadeIn";
import { testimonials } from "@/lib/data";

export function Testimonials() {
  return (
    <section id="testimonials" className="section-muted section-padding">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          title="Loved by Travel Companies"
          subtitle="See what travel business owners say about Travel CRM."
          theme="light"
        />

        <StaggerContainer className="grid gap-6 md:grid-cols-3">
          {testimonials.map((t) => (
            <StaggerItem key={t.author}>
              <div className="card-light flex h-full flex-col">
                <div className="mb-4 flex gap-0.5">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="flex-1 text-sm leading-relaxed text-slate-600">&ldquo;{t.quote}&rdquo;</p>
                <div className="mt-6 flex items-center gap-3 border-t border-slate-100 pt-5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full gradient-purple text-sm font-bold text-white">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="font-display text-sm font-bold text-slate-900">{t.author}</p>
                    <p className="text-xs text-slate-500">{t.role}</p>
                  </div>
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
