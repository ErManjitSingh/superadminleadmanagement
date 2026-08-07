import { siteConfig } from "@/lib/config";

export function FinalCTA() {
  return (
    <section id="family" className="bg-[var(--th-orange)] py-12 text-white sm:py-14">
      <div className="th-container max-w-3xl text-center">
        <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          Ready to plan your perfect tour?
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-white/90">
          Get a personalised itinerary from our travel experts — free consultation, no obligation.
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <a
            href={siteConfig.whatsapp}
            target="_blank"
            rel="noreferrer"
            className="inline-flex rounded-lg bg-white px-6 py-3 text-sm font-bold text-[var(--th-orange)] transition hover:bg-orange-50"
          >
            Request callback
          </a>
          <a
            href={`mailto:${siteConfig.contactEmail}`}
            className="inline-flex rounded-lg border border-white/40 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/10"
          >
            Email enquiry
          </a>
        </div>
        <p className="mt-6 text-sm text-white/80">
          Travel agents:{" "}
          <a href={siteConfig.crmLogin} className="font-bold underline underline-offset-2">
            CRM Login
          </a>
        </p>
      </div>
    </section>
  );
}
