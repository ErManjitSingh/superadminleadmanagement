"use client";

import Link from "next/link";
import { Check, X } from "lucide-react";
import { SectionHeading, FadeIn } from "@/components/effects/FadeIn";
import { comparisonRows, switchBenefits } from "@/lib/data";
import { siteConfig } from "@/lib/config";

export function ComparisonSection() {
  return (
    <section id="comparison" className="section-light section-padding">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          title="Why Travel Companies Switch to Travel CRM?"
          subtitle="Stop losing leads, double-entering data and chasing team members for updates."
          theme="light"
        />

        <div className="grid gap-10 lg:grid-cols-5">
          <FadeIn className="lg:col-span-3">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
              <div className="grid grid-cols-5 border-b border-slate-100 bg-slate-50 p-4 text-center text-xs font-bold uppercase tracking-wide text-slate-500">
                <div className="text-left">Feature</div>
                <div>Traditional</div>
                <div>Excel</div>
                <div>WhatsApp</div>
                <div className="text-violet-600">Travel CRM</div>
              </div>
              {comparisonRows.map((row, i) => (
                <div key={row.feature} className={`grid grid-cols-5 items-center p-4 text-sm ${i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}`}>
                  <div className="font-medium text-slate-800">{row.feature}</div>
                  {[row.traditional, row.excel, row.whatsapp].map((val, j) => (
                    <div key={j} className="flex justify-center">
                      <X className="h-4 w-4 text-red-400" />
                    </div>
                  ))}
                  <div className="flex flex-col items-center gap-1">
                    <Check className="h-4 w-4 text-emerald-500" />
                    <span className="text-xs font-semibold text-violet-600">{row.crm}</span>
                  </div>
                </div>
              ))}
            </div>
          </FadeIn>

          <FadeIn delay={0.15} className="lg:col-span-2">
            <div className="flex h-full flex-col rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-indigo-50 p-8">
              <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-4xl shadow-purple">
                🧳
              </div>
              <h3 className="font-display text-xl font-bold text-slate-900">
                Stop using outdated methods
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Modern travel companies are switching to Travel CRM every day.
              </p>
              <ul className="mt-6 flex-1 space-y-3">
                {switchBenefits.map((b) => (
                  <li key={b} className="flex items-start gap-2.5 text-sm text-slate-700">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    {b}
                  </li>
                ))}
              </ul>
              <Link href={siteConfig.signup} className="btn-primary mt-8 w-full justify-center">
                Start Free Demo
              </Link>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
