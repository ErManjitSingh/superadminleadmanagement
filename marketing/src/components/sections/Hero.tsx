import { siteConfig } from "@/lib/config";

export function Hero() {
  return (
    <section className="relative min-h-[88svh] overflow-hidden bg-[var(--ink)]">
      {/* CSS-only atmosphere — no hero image download */}
      <div
        className="absolute inset-0 opacity-80"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 70% 20%, rgba(26,122,114,0.45), transparent 55%), radial-gradient(ellipse 50% 40% at 10% 80%, rgba(232,72,46,0.22), transparent 50%), linear-gradient(160deg, #0c2426 0%, #134e4a 55%, #0c2426 100%)",
        }}
        aria-hidden
      />
      <div className="hero-wash absolute inset-0" aria-hidden />

      <div className="relative mx-auto flex min-h-[88svh] max-w-6xl flex-col justify-end px-4 pb-14 pt-24 sm:px-6 sm:pb-16 lg:justify-center lg:pb-20">
        <p className="hero-enter font-display text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
          India Holiday Destination
        </p>
        <div className="hero-enter hero-enter-d1 mt-3 h-0.5 w-20 bg-[var(--coral)]" />
        <h1 className="hero-enter hero-enter-d2 mt-5 max-w-2xl font-display text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
          Holiday packages that feel like home across India
        </h1>
        <p className="hero-enter hero-enter-d3 mt-4 max-w-lg text-base text-white/70">
          Beaches, mountains, heritage trails — curated stays and transfers, ready for your dates.
        </p>
        <div className="hero-enter hero-enter-d3 mt-8 flex flex-wrap gap-3">
          <a href="#packages" className="btn-primary">
            Explore Packages
          </a>
          <a href={siteConfig.whatsapp} target="_blank" rel="noreferrer" className="btn-secondary">
            Enquire on WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}
