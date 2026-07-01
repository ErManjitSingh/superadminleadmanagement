"use client";

import { SectionHeading, StaggerContainer, StaggerItem } from "@/components/effects/FadeIn";
import { whyFeatures } from "@/lib/data";

export function WhyFeatures() {
  return (
    <section id="features" className="section-padding relative">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          badge="Why UNO Travel CRM"
          title="Everything Your Travel Business Needs"
          subtitle="19 powerful modules designed specifically for travel companies — not generic CRM features bolted on."
        />

        <StaggerContainer className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {whyFeatures.map((feature) => (
            <StaggerItem key={feature.title}>
              <div className="group glass-card relative overflow-hidden p-6 transition-all duration-500 hover:scale-[1.02] hover:border-white/20 hover:shadow-2xl hover:shadow-blue-500/10">
                <div
                  className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${feature.color} shadow-lg`}
                >
                  <feature.icon className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-semibold">{feature.title}</h3>
                <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-gradient-to-br from-white/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
