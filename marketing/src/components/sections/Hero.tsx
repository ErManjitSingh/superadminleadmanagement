import { heroImage } from "@/lib/data";
import { siteConfig } from "@/lib/config";

export function Hero() {
  return (
    <section className="relative min-h-[100svh] overflow-hidden">
      <img
        src={heroImage}
        alt=""
        width={1600}
        height={1000}
        fetchPriority="high"
        decoding="async"
        className="anim-kenburns absolute inset-0 h-full w-full object-cover"
        aria-hidden
      />
      <div className="hero-veil absolute inset-0" aria-hidden />

      <div className="relative mx-auto flex min-h-[100svh] max-w-7xl flex-col justify-end px-4 pb-16 pt-28 sm:px-6 sm:pb-20 lg:justify-center lg:px-8 lg:pb-24">
        <p className="anim-rise font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl md:text-5xl lg:text-6xl">
          India Holiday Destination
        </p>

        <div className="anim-line mt-5 h-[3px] w-28 bg-[var(--coral)] sm:w-36" />

        <h1 className="anim-rise anim-rise-2 mt-7 max-w-3xl font-display text-[2rem] font-bold leading-[1.12] tracking-tight text-white sm:text-5xl lg:text-[3.4rem]">
          Holidays that feel like home — across every corner of India
        </h1>

        <p className="anim-rise anim-rise-3 mt-5 max-w-xl text-base leading-relaxed text-white/78 sm:text-lg">
          Handpicked packages for beaches, mountains, heritage cities and islands —
          with stays, transfers and local experiences ready for your dates.
        </p>

        <div className="anim-rise anim-rise-4 mt-9 flex flex-wrap items-center gap-3">
          <a href="#packages" className="btn-primary">
            Explore packages
          </a>
          <a href={siteConfig.whatsapp} target="_blank" rel="noreferrer" className="btn-ghost">
            Enquire on WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}
