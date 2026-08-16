import { heroFlipCards } from "@/lib/data";
import { ExploreTabs } from "@/components/sections/ExploreTabs";
import { CheckCircle2, Headphones, BadgeIndianRupee } from "lucide-react";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=2000&q=90";

function FeatureStrip() {
  return (
    <div className="bg-[#0f3d2e]/92 backdrop-blur-[2px]">
      <div className="th-container flex flex-wrap items-center justify-center gap-x-10 gap-y-2 py-[13px] text-white sm:justify-between sm:gap-x-12 sm:py-[14px]">
        <div className="flex items-center gap-2.5 text-[13px] font-semibold tracking-wide">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/15">
            <CheckCircle2 className="h-3.5 w-3.5 text-[#f27c22]" strokeWidth={2.5} />
          </span>
          100% Customisable
        </div>
        <div className="flex items-center gap-2.5 text-[13px] font-semibold tracking-wide">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/15">
            <Headphones className="h-3.5 w-3.5 text-[#f27c22]" strokeWidth={2.5} />
          </span>
          Expert Support
        </div>
        <div className="flex items-center gap-2.5 text-[13px] font-semibold tracking-wide">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/15">
            <BadgeIndianRupee className="h-3.5 w-3.5 text-[#f27c22]" strokeWidth={2.5} />
          </span>
          Best Price Promise
        </div>
      </div>
    </div>
  );
}

/**
 * Exact mock composition (desktop):
 * full-bleed mountain → left wash → copy → floating search → green strip → proof card
 */
export function Hero() {
  return (
    <section className="relative overflow-hidden bg-white">
      {/* ===== Desktop / large: single composed hero ===== */}
      <div className="relative isolate hidden min-h-[760px] lg:block">
        <img
          src={HERO_IMAGE}
          alt="Misty Himalayan village — Incredible India holidays"
          className="absolute inset-0 h-full w-full object-cover object-[58%_40%]"
          width={2000}
          height={1100}
          loading="eager"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, rgba(255,255,255,0.97) 0%, rgba(255,255,255,0.88) 28%, rgba(255,255,255,0.35) 52%, rgba(255,255,255,0) 68%)",
          }}
        />
        <div
          className="absolute inset-x-0 bottom-0 h-[42%]"
          style={{
            background:
              "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(8,40,28,0.18) 55%, rgba(8,40,28,0.42) 100%)",
          }}
        />

        <div className="th-container relative z-10 pt-[72px]">
          <div className="max-w-[540px]">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#f3d9c0] bg-[#fff6ec] px-3.5 py-[7px] text-[10.5px] font-bold uppercase tracking-[0.14em] text-[#d96a12]">
              <span className="h-[7px] w-[7px] rounded-full bg-[#f27c22]" />
              Made for your kind of holiday
            </div>

            <h1 className="text-[58px] font-extrabold leading-[1.05] tracking-[-0.035em] text-[#1a2420]">
              Incredible India,
              <br />
              <span className="text-[#f27c22]">made</span>{" "}
              <span className="text-[#0f3d2e]">personal.</span>
            </h1>

            <p className="mt-4 max-w-[460px] text-[16px] leading-[1.65] text-[#66756c]">
              Handpicked stays, memorable experiences and thoughtfully planned
              journeys—all designed around you.
            </p>
          </div>
        </div>

        <div className="absolute right-10 top-[40%] z-20 -translate-y-1/2 rounded-2xl bg-white px-4 py-3 shadow-[0_12px_36px_rgba(15,23,42,0.16)] xl:right-16">
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2.5">
              {heroFlipCards.slice(0, 3).map((card) => (
                <img
                  key={card.front}
                  src={card.front}
                  alt=""
                  className="h-9 w-9 rounded-full border-[2.5px] border-white object-cover"
                  width={36}
                  height={36}
                />
              ))}
            </div>
            <div>
              <p className="text-[13px] font-extrabold leading-tight text-[#1a2420]">
                10L+ happy travellers
              </p>
              <p className="mt-0.5 text-[10.5px] font-medium text-[#6b7a72]">
                <span className="tracking-tight text-[#f27c22]">★★★★★</span> 4.8
                trusted rating
              </p>
            </div>
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-[56px] z-30">
          <div className="th-container">
            <div className="mx-auto max-w-[1080px]">
              <ExploreTabs />
            </div>
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 z-20">
          <FeatureStrip />
        </div>
      </div>

      {/* ===== Mobile / tablet: stacked but same visuals ===== */}
      <div className="lg:hidden">
        <div className="relative min-h-[420px] overflow-hidden">
          <img
            src={HERO_IMAGE}
            alt="Misty Himalayan village — Incredible India holidays"
            className="absolute inset-0 h-full w-full object-cover object-[58%_40%]"
            width={1200}
            height={800}
            loading="eager"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.72) 45%, rgba(255,255,255,0.2) 100%)",
            }}
          />
          <div className="th-container relative z-10 py-12">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#f3d9c0] bg-[#fff6ec] px-3 py-[6px] text-[10px] font-bold uppercase tracking-[0.12em] text-[#d96a12]">
              <span className="h-[6px] w-[6px] rounded-full bg-[#f27c22]" />
              Made for your kind of holiday
            </div>
            <h1 className="text-[36px] font-extrabold leading-[1.05] tracking-[-0.035em] text-[#1a2420] sm:text-[46px]">
              Incredible India,
              <br />
              <span className="text-[#f27c22]">made</span>{" "}
              <span className="text-[#0f3d2e]">personal.</span>
            </h1>
            <p className="mt-3 max-w-[460px] text-[14.5px] leading-[1.65] text-[#66756c]">
              Handpicked stays, memorable experiences and thoughtfully planned
              journeys—all designed around you.
            </p>
          </div>
        </div>

        <div className="relative z-20 -mt-8 px-4 pb-2">
          <ExploreTabs />
        </div>

        <div className="th-container py-3">
          <div className="inline-flex items-center gap-3 rounded-2xl border border-[#e8eee9] bg-white px-4 py-3 shadow-sm">
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
              <p className="text-[12px] font-extrabold text-[#1a2420]">
                10L+ happy travellers
              </p>
              <p className="text-[10px] text-[#6b7a72]">
                <span className="text-[#f27c22]">★★★★★</span> 4.8 trusted rating
              </p>
            </div>
          </div>
        </div>

        <FeatureStrip />
      </div>
    </section>
  );
}
