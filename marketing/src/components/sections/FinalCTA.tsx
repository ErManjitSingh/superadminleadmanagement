import { siteConfig } from "@/lib/config";

export function FinalCTA() {
  return (
    <section className="relative overflow-hidden bg-[var(--lagoon)] section-pad">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(circle at 15% 20%, rgba(255,255,255,0.35), transparent 40%), radial-gradient(circle at 85% 70%, rgba(226,62,43,0.4), transparent 42%)",
        }}
        aria-hidden
      />
      <div className="relative mx-auto max-w-3xl text-center text-white">
        <h2 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
          Ready for your next India holiday?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-lg text-white/80">
          Tell us where you want to go — we will send a customised package within hours.
        </p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <a href={siteConfig.whatsapp} target="_blank" rel="noreferrer" className="btn-primary">
            Chat on WhatsApp
          </a>
          <a href={`mailto:${siteConfig.contactEmail}`} className="btn-ghost">
            Email enquiry
          </a>
        </div>
        <p className="mt-8 text-sm text-white/60">
          Travel agents &amp; team:{" "}
          <a href={siteConfig.crmLogin} className="font-semibold text-white underline-offset-4 hover:underline">
            open CRM Login
          </a>
        </p>
      </div>
    </section>
  );
}
