"use client";

import { SectionHeading, StaggerContainer, StaggerItem } from "@/components/effects/FadeIn";
import { featureGrid } from "@/lib/data";

export function FeatureGrid() {
  return (
    <section className="section-padding relative border-y border-white/[0.06]">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_30%_at_50%_100%,hsl(199_89%_48%_/_0.06),transparent)]" />
      <div className="relative mx-auto max-w-7xl">
        <SectionHeading
          badge="Feature Rich"
          title="33+ Premium Features"
          subtitle="Every feature is designed to save time, reduce errors and help your team close more bookings."
        />

        <StaggerContainer className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {featureGrid.map((feature) => (
            <StaggerItem key={feature.title}>
              <div className="group flex items-start gap-4 rounded-2xl border border-white/[0.05] bg-white/[0.02] p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-500/20 hover:bg-emerald-500/[0.04] hover:shadow-lg hover:shadow-emerald-500/5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/10 transition-transform duration-300 group-hover:scale-110">
                  <feature.icon className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <h4 className="font-display text-sm font-bold">{feature.title}</h4>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
