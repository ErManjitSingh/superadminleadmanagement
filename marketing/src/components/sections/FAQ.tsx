"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SectionHeading, FadeIn } from "@/components/effects/FadeIn";
import { faqs } from "@/lib/data";

export function FAQ() {
  return (
    <section id="faq" className="section-light section-padding">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          title="Frequently Asked Questions"
          subtitle="Everything you need to know before getting started."
          theme="light"
        />

        <FadeIn>
          <Accordion type="single" collapsible className="rounded-2xl border border-slate-200 bg-white px-6 shadow-card">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="border-slate-100">
                <AccordionTrigger className="text-left font-display font-semibold text-slate-900 hover:text-violet-600">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-slate-500">{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </FadeIn>
      </div>
    </section>
  );
}
