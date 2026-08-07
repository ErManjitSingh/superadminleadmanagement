"use client";

import { ArrowRight, MessageCircle } from "lucide-react";
import { siteConfig } from "@/lib/config";
import { FadeIn } from "@/components/effects/FadeIn";

export function FinalCTA() {
  return (
    <section className="relative overflow-hidden bg-[var(--lagoon)] section-padding">
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.35), transparent 40%), radial-gradient(circle at 80% 70%, rgba(232,72,46,0.35), transparent 45%)",
        }}
        aria-hidden
      />
      <div className="relative mx-auto max-w-3xl text-center text-white">
        <FadeIn>
          <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
            Ready for your next India holiday?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-white/80">
            Tell us where you want to go — we will send a customised package within hours.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <a href={siteConfig.whatsapp} target="_blank" rel="noreferrer" className="btn-primary">
              <MessageCircle className="h-4 w-4" />
              Chat on WhatsApp
            </a>
            <a href={`mailto:${siteConfig.contactEmail}`} className="btn-secondary">
              Email enquiry
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
          <p className="mt-8 text-sm text-white/55">
            Travel agents &amp; team members:{" "}
            <a href={siteConfig.crmLogin} className="font-semibold text-white underline-offset-4 hover:underline">
              open CRM Login
            </a>
          </p>
        </FadeIn>
      </div>
    </section>
  );
}
