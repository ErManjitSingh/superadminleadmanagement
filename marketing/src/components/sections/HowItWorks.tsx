"use client";

import { howItWorks } from "@/lib/data";
import { FadeIn } from "@/components/effects/FadeIn";

export function HowItWorks() {
  return (
    <section id="how-it-works" className="section-padding bg-[var(--sand)]">
      <div className="mx-auto max-w-7xl">
        <FadeIn className="mb-14 max-w-2xl">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[var(--lagoon)]">
            How it works
          </p>
          <h2 className="font-display text-3xl font-extrabold tracking-tight text-[var(--ink)] sm:text-4xl lg:text-5xl">
            Three steps to your next trip
          </h2>
        </FadeIn>

        <div className="grid gap-8 lg:grid-cols-3">
          {howItWorks.map((step, i) => (
            <FadeIn key={step.step} delay={i * 0.12}>
              <div className="relative">
                <span className="font-display text-6xl font-extrabold text-[var(--lagoon)]/15">
                  {step.step}
                </span>
                <h3 className="mt-2 font-display text-2xl font-bold text-[var(--ink)]">{step.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-[var(--ink)]/55">{step.description}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
