"use client";

import { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { SectionHeading, FadeIn, StaggerContainer, StaggerItem } from "@/components/effects/FadeIn";
import { pricingPlans } from "@/lib/data";
import { siteConfig } from "@/lib/config";
import { cn } from "@/lib/utils";

export function Pricing() {
  const [yearly, setYearly] = useState(false);

  return (
    <section id="pricing" className="section-light section-padding">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          title="Simple Pricing for Every Business"
          subtitle="Start free for 14 days. Scale as your travel business grows."
          theme="light"
        />

        <FadeIn className="mb-12 flex items-center justify-center gap-3">
          <span className={cn("text-sm font-semibold", !yearly ? "text-slate-900" : "text-slate-400")}>Monthly</span>
          <button
            onClick={() => setYearly(!yearly)}
            className={cn(
              "relative h-7 w-12 rounded-full transition-colors",
              yearly ? "bg-violet-600" : "bg-slate-200"
            )}
          >
            <span className={cn(
              "absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform",
              yearly ? "translate-x-5" : "translate-x-0.5"
            )} />
          </button>
          <span className={cn("text-sm font-semibold", yearly ? "text-slate-900" : "text-slate-400")}>Yearly</span>
          {yearly && (
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-600">Save 20%</span>
          )}
        </FadeIn>

        <StaggerContainer className="grid gap-6 lg:grid-cols-3">
          {pricingPlans.map((plan) => (
            <StaggerItem key={plan.slug}>
              <div className={cn(
                "relative flex h-full flex-col rounded-2xl border bg-white p-8 transition-all",
                plan.popular
                  ? "border-violet-500 shadow-purple scale-[1.02]"
                  : "border-slate-200 shadow-card hover:border-violet-200"
              )}>
                {plan.popular && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full gradient-purple px-4 py-1 text-xs font-bold text-white">
                    Most Popular
                  </span>
                )}
                <h3 className="font-display text-xl font-bold text-slate-900">{plan.name}</h3>
                <p className="mt-2 text-sm text-slate-500">{plan.description}</p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="font-display text-5xl font-extrabold text-slate-900">
                    ${yearly ? plan.yearly : plan.monthly}
                  </span>
                  <span className="text-slate-400">/mo</span>
                </div>
                <ul className="mt-8 flex-1 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-slate-600">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={siteConfig.signup}
                  className={cn(
                    "mt-8 w-full justify-center",
                    plan.popular ? "btn-primary flex" : "btn-outline-dark flex"
                  )}
                >
                  Start Free Demo
                </Link>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
