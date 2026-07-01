"use client";

import { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { SectionHeading, FadeIn, StaggerContainer, StaggerItem } from "@/components/effects/FadeIn";
import { pricingPlans } from "@/lib/data";
import { siteConfig } from "@/lib/config";
import { cn } from "@/lib/utils";

export function Pricing() {
  const [yearly, setYearly] = useState(false);

  return (
    <section id="pricing" className="section-padding relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          badge="Pricing"
          title="Simple, Transparent Pricing"
          subtitle="Start free for 14 days. Scale as your travel business grows."
        />

        <FadeIn className="mb-12 flex items-center justify-center gap-3">
          <span className={cn("text-sm font-medium", !yearly && "text-foreground")}>
            Monthly
          </span>
          <Switch checked={yearly} onCheckedChange={setYearly} />
          <span className={cn("text-sm font-medium", yearly && "text-foreground")}>
            Yearly
          </span>
          {yearly && (
            <Badge variant="default" className="ml-1">
              Save 20%
            </Badge>
          )}
        </FadeIn>

        <StaggerContainer className="grid gap-8 lg:grid-cols-3">
          {pricingPlans.map((plan) => (
            <StaggerItem key={plan.slug}>
              <div
                className={cn(
                  "glass-card relative flex h-full flex-col rounded-2xl p-8 transition-all duration-500",
                  plan.popular
                    ? "border-primary/40 shadow-2xl shadow-primary/10 scale-[1.02]"
                    : "hover:border-white/20"
                )}
              >
                {plan.popular && (
                  <Badge variant="popular" className="absolute -top-3 left-1/2 -translate-x-1/2">
                    Most Popular
                  </Badge>
                )}
                <h3 className="text-xl font-bold">{plan.name}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-bold">
                    ${yearly ? plan.yearly : plan.monthly}
                  </span>
                  <span className="text-muted-foreground">/user/mo</span>
                </div>
                <ul className="mt-8 flex-1 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-3 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  variant={plan.popular ? "gradient" : "outline"}
                  className="mt-8 w-full"
                  size="lg"
                  asChild
                >
                  <Link href={siteConfig.signup}>Start Free Demo</Link>
                </Button>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
