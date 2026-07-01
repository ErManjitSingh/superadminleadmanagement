"use client";

import { Check, X } from "lucide-react";
import { SectionHeading, FadeIn } from "@/components/effects/FadeIn";
import { comparisonRows } from "@/lib/data";

export function Comparison() {
  return (
    <section className="section-padding relative border-y border-white/10 bg-card/20">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          badge="Comparison"
          title="Why Better Than Excel?"
          subtitle="Stop losing leads, double-entering data and chasing team members for updates."
        />

        <FadeIn>
          <div className="glass-card overflow-hidden rounded-2xl">
            <div className="grid grid-cols-3 border-b border-white/10 bg-white/5 p-4 text-center text-sm font-semibold">
              <div className="text-left">Feature</div>
              <div className="text-red-400">Excel</div>
              <div className="gradient-text font-display text-lg font-bold">Travel CRM</div>
            </div>
            {comparisonRows.map((row, i) => (
              <div
                key={row.feature}
                className={`grid grid-cols-3 items-center p-4 text-sm ${
                  i % 2 === 0 ? "bg-white/[0.02]" : ""
                }`}
              >
                <div className="font-medium">{row.feature}</div>
                <div className="flex justify-center">
                  {row.excel ? (
                    <Check className="h-5 w-5 text-red-400/60" />
                  ) : (
                    <X className="h-5 w-5 text-red-400/40" />
                  )}
                </div>
                <div className="flex justify-center">
                  {row.crm ? (
                    <Check className="h-5 w-5 text-emerald-400" />
                  ) : (
                    <X className="h-5 w-5 text-muted-foreground/40" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
