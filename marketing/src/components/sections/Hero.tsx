import { exploreDestinations } from "@/lib/data";
import { siteConfig } from "@/lib/config";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-[#1b1b1b] text-white">
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "url(https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=1600&q=65&fm=webp)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
        aria-hidden
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/65 to-black/35" aria-hidden />

      <div className="th-container relative py-16 sm:py-20 lg:py-24">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--th-yellow)]">
          Explore expertly curated multi-day tours
        </p>
        <h1 className="max-w-3xl text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl lg:text-[3.4rem]">
          Your Tour,
          <br />
          <span className="text-[var(--th-orange)]">Perfectly Personalised!</span>
        </h1>
        <p className="mt-4 max-w-xl text-base text-white/75 sm:text-lg">
          Handpicked holiday packages across India — beaches, mountains, heritage and islands.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <a href="#packages" className="th-btn px-6 py-3">
            Explore packages
          </a>
          <a
            href={siteConfig.whatsapp}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center rounded-lg border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold backdrop-blur-sm transition hover:bg-white/20"
          >
            Talk to an expert
          </a>
        </div>
      </div>

      <div className="relative border-t border-white/10 bg-black/30 backdrop-blur-md">
        <div className="th-container py-5">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-white/55">Explore</p>
          <div className="hide-scrollbar flex gap-3 overflow-x-auto pb-1">
            {exploreDestinations.map((d) => (
              <a
                key={d.name}
                href={`#${d.name.toLowerCase() === "himachal" ? "ladakh" : d.name.toLowerCase()}`}
                className="group relative w-[118px] shrink-0 overflow-hidden rounded-2xl"
              >
                <img
                  src={d.image}
                  alt={d.name}
                  width={118}
                  height={148}
                  loading="lazy"
                  decoding="async"
                  className="h-[148px] w-full object-cover transition duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                {d.trending && (
                  <span className="absolute left-2 top-2 rounded bg-[var(--th-orange)] px-1.5 py-0.5 text-[9px] font-bold uppercase text-white">
                    Trending
                  </span>
                )}
                <span className="absolute inset-x-0 bottom-0 p-2.5 text-center text-[13px] font-bold text-white">
                  {d.name}
                </span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
