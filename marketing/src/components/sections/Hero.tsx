import { heroFlipCards } from "@/lib/data";
import { ExploreTabs } from "@/components/sections/ExploreTabs";
import { CheckCircle2, Headphones, BadgeIndianRupee } from "lucide-react";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=1800&q=88";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="relative">
        {/* Full-bleed image plane */}
        <div className="relative min-h-[520px] sm:min-h-[600px] lg:min-h-[640px]">
          <img
            src={HERO_IMAGE}
            alt="Misty Himalayan village — Incredible India holidays"
            className="absolute inset-0 h-full w-full object-cover object-[center_35%]"
            width={1800}
            height={900}
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/88 to-white/20 sm:via-white/78 sm:to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />

          <div className="th-container relative z-10 flex min-h-[520px] flex-col justify-center py-14 sm:min-h-[600px] sm:py-16 lg:min-h-[640px] lg:pb-28">
            <div className="max-w-[560px]">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[rgba(248,128,8,0.25)] bg-[rgba(255,244,232,0.95)] px-3.5 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--th-orange-dark)] shadow-sm backdrop-blur-sm">
                <span className="h-2 w-2 rounded-full bg-[var(--th-orange)]" />
                Made for your kind of holiday
              </div>

              <h1 className="text-[40px] font-extrabold leading-[1.05] tracking-[-0.04em] text-[var(--th-ink)] sm:text-[56px] lg:text-[62px]">
                Incredible India,
                <br />
                <span className="text-[var(--th-orange)]">made</span>{" "}
                <span className="text-[var(--th-forest)]">personal.</span>
              </h1>

              <p className="mt-5 max-w-[480px] text-[15px] leading-7 text-[var(--th-muted)] sm:text-[17px]">
                Handpicked stays, memorable experiences and thoughtfully planned
                journeys—all designed around you.
              </p>
            </div>

            {/* Social proof — desktop */}
            <div className="absolute bottom-28 right-4 hidden rounded-2xl border border-white/70 bg-white/95 px-4 py-3 shadow-[0_14px_40px_rgba(15,23,42,0.16)] backdrop-blur-md lg:right-0 lg:block xl:right-4">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {heroFlipCards.slice(0, 3).map((card) => (
                    <img
                      key={card.front}
                      src={card.front}
                      alt=""
                      className="h-9 w-9 rounded-full border-2 border-white object-cover"
                      width={36}
                      height={36}
                    />
                  ))}
                </div>
                <div>
                  <p className="text-[13px] font-extrabold text-[var(--th-ink)]">
                    10L+ happy travellers
                  </p>
                  <p className="text-[10px] font-medium text-[var(--th-muted)]">
                    <span className="text-[var(--th-orange)]">★★★★★</span> 4.8
                    trusted rating
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search widget — pulls up over image + feature strip */}
        <div className="relative z-20 -mt-16 pb-0 sm:-mt-20">
          <ExploreTabs />
        </div>

        {/* Mobile social proof */}
        <div className="th-container relative z-10 mt-4 lg:hidden">
          <div className="inline-flex items-center gap-3 rounded-2xl border border-[var(--th-border)] bg-white px-4 py-3 shadow-md">
            <div className="flex -space-x-2">
              {heroFlipCards.slice(0, 3).map((card) => (
                <img
                  key={card.front}
                  src={card.front}
                  alt=""
                  className="h-8 w-8 rounded-full border-2 border-white object-cover"
                  width={32}
                  height={32}
                />
              ))}
            </div>
            <div>
              <p className="text-[12px] font-extrabold text-[var(--th-ink)]">
                10L+ happy travellers
              </p>
              <p className="text-[10px] text-[var(--th-muted)]">
                <span className="text-[var(--th-orange)]">★★★★★</span> 4.8
                trusted rating
              </p>
            </div>
          </div>
        </div>

        {/* Feature strip */}
        <div className="relative z-10 mt-6 bg-[var(--th-forest)]">
          <div className="th-container flex flex-wrap items-center justify-center gap-x-10 gap-y-3 py-3.5 text-white sm:justify-between sm:py-4">
            <div className="flex items-center gap-2 text-[13px] font-semibold">
              <CheckCircle2 className="h-4 w-4 text-[var(--th-orange)]" />
              100% Customisable
            </div>
            <div className="flex items-center gap-2 text-[13px] font-semibold">
              <Headphones className="h-4 w-4 text-[var(--th-orange)]" />
              Expert Support
              <span className="hidden font-normal text-white/70 sm:inline">
                · 24/7 assistance
              </span>
            </div>
            <div className="flex items-center gap-2 text-[13px] font-semibold">
              <BadgeIndianRupee className="h-4 w-4 text-[var(--th-orange)]" />
              Best Price Promise
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
