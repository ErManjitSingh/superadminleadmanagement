"use client";

import { FadeIn } from "@/components/effects/FadeIn";
import { statsBar } from "@/lib/data";

export function StatsBar() {
  return (
    <section className="section-dark py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-5">
          {statsBar.map((s, i) => (
            <FadeIn key={s.label} delay={i * 0.08}>
              <div className="text-center">
                <p className="font-display text-2xl font-extrabold text-white sm:text-3xl">{s.value}</p>
                <p className="mt-1 text-xs text-white/50 sm:text-sm">{s.label}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
