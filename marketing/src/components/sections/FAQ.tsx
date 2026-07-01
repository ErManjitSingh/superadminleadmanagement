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
    <section id="faq" className="section-padding relative">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          badge="FAQ"
          title="Frequently Asked Questions"
          subtitle="Everything you need to know before getting started."
        />

        <FadeIn>
          <Accordion type="single" collapsible className="glass-card rounded-2xl px-6">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`item-${i}`}>
                <AccordionTrigger className="text-left">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent>{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </FadeIn>
      </div>
    </section>
  );
}
