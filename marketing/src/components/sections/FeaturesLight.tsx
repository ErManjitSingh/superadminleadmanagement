"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SectionHeading, StaggerContainer, StaggerItem, FadeIn } from "@/components/effects/FadeIn";
import { featureCards } from "@/lib/data";
import { siteConfig } from "@/lib/config";

export function FeaturesLight() {
  return (
    <section id="features" className="section-light section-padding">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          title="Everything You Need to Manage Your Travel Business"
          subtitle="Powerful tools designed specifically for travel companies — not generic CRM features."
          theme="light"
        />

        <StaggerContainer className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featureCards.map((f) => (
            <StaggerItem key={f.title}>
              <div className="card-light group h-full">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-600 transition-colors group-hover:bg-violet-600 group-hover:text-white">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="font-display font-bold text-slate-900">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">{f.description}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>

        <FadeIn className="mt-12 text-center">
          <Link href={siteConfig.signup} className="btn-primary inline-flex">
            Explore All Features <ArrowRight className="h-4 w-4" />
          </Link>
        </FadeIn>
      </div>
    </section>
  );
}
