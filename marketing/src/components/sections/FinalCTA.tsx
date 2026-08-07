import { siteConfig } from "@/lib/config";

export function FinalCTA() {
  return (
    <section className="section-padding bg-[var(--lagoon)] text-white">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Ready for your next India holiday?
        </h2>
        <p className="mx-auto mt-3 max-w-md text-white/80">
          Tell us where you want to go — we’ll send a customised package soon.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <a href={siteConfig.whatsapp} target="_blank" rel="noreferrer" className="btn-primary">
            Chat on WhatsApp
          </a>
          <a href={`mailto:${siteConfig.contactEmail}`} className="btn-secondary">
            Email enquiry
          </a>
        </div>
        <p className="mt-6 text-sm text-white/55">
          Travel agents:{" "}
          <a href={siteConfig.crmLogin} className="font-semibold text-white underline-offset-2 hover:underline">
            CRM Login
          </a>
        </p>
      </div>
    </section>
  );
}
