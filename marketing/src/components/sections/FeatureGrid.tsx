"use client";

import { SectionHeading, StaggerContainer, StaggerItem } from "@/components/effects/FadeIn";
import { featureGrid } from "@/lib/data";

export function FeatureGrid() {
  return (
    <section className="section-padding relative border-y border-white/10 bg-card/20">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          badge="Feature Rich"
          title="30+ Premium Features"
          subtitle="Every feature is designed to save time, reduce errors and help your team close more bookings."
        />

        <StaggerContainer className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {featureGrid.map((feature) => (
            <StaggerItem key={feature.title}>
              <div className="group flex items-start gap-4 rounded-xl border border-white/5 bg-white/[0.02] p-4 transition-all duration-300 hover:border-white/15 hover:bg-white/[0.05] hover:shadow-lg hover:shadow-blue-500/5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500/20 to-violet-500/20 transition-transform group-hover:scale-110">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold">{feature.title}</h4>
                  <p className="mt-0.5 text-xs text-muted-foreground">
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
