"use client";

import { faqItems } from "@/lib/data";
import { FadeIn } from "@/components/effects/FadeIn";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export function FAQ() {
  return (
    <section id="faq" className="section-padding bg-[var(--sand)]">
      <div className="mx-auto max-w-3xl">
        <FadeIn className="mb-12 text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[var(--lagoon)]">
            FAQs
          </p>
          <h2 className="font-display text-3xl font-extrabold tracking-tight text-[var(--ink)] sm:text-4xl">
            Before you pack your bags
          </h2>
        </FadeIn>

        <FadeIn delay={0.1}>
          <Accordion type="single" collapsible className="space-y-3">
            {faqItems.map((item, i) => (
              <AccordionItem
                key={item.q}
                value={`item-${i}`}
                className="rounded-2xl border border-[var(--ink)]/8 bg-white px-5"
              >
                <AccordionTrigger className="text-left font-display text-base font-semibold text-[var(--ink)] hover:no-underline">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm leading-relaxed text-[var(--ink)]/60">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </FadeIn>
      </div>
    </section>
  );
}
