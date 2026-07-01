"use client";

import { SectionHeading, StaggerContainer, StaggerItem } from "@/components/effects/FadeIn";
import { whyFeatures } from "@/lib/data";

export function WhyFeatures() {
  return (
    <section id="features" className="section-padding relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,hsl(168_76%_42%_/_0.06),transparent)]" />
      <div className="relative mx-auto max-w-7xl">
        <SectionHeading
          badge="Why Travel CRM"
          title="Everything Your Travel Business Needs"
          subtitle="19 powerful modules designed specifically for travel companies — not generic CRM features bolted on."
        />

        <StaggerContainer className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {whyFeatures.map((feature) => (
            <StaggerItem key={feature.title}>
              <div className="group shine-border relative overflow-hidden rounded-2xl p-6 transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl hover:shadow-emerald-500/10">
                <div
                  className={`mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${feature.color} shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}
                >
                  <feature.icon className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-display font-bold">{feature.title}</h3>
                <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100" />
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
