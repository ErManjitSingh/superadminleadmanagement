import { heroFlipCards } from "@/lib/data";
import { ExploreTabs } from "@/components/sections/ExploreTabs";
import { CheckCircle2, Headphones, BadgeIndianRupee } from "lucide-react";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=2000&q=90";

function FeatureStrip() {
  return (
    <div className="bg-[#0f3d2e]">
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-center gap-x-10 gap-y-2 px-4 py-3 text-white sm:justify-between sm:px-6 sm:py-3.5">
        <div className="flex items-center gap-2.5 text-[13px] font-semibold">
          <CheckCircle2 className="h-4 w-4 text-[#f27c22]" strokeWidth={2.5} />
          100% Customisable
        </div>
        <div className="flex items-center gap-2.5 text-[13px] font-semibold">
          <Headphones className="h-4 w-4 text-[#f27c22]" strokeWidth={2.5} />
          Expert Support
        </div>
        <div className="flex items-center gap-2.5 text-[13px] font-semibold">
          <BadgeIndianRupee className="h-4 w-4 text-[#f27c22]" strokeWidth={2.5} />
          Best Price Promise
        </div>
      </div>
    </div>
  );
}

function SocialProof({ className = "" }: { className?: string }) {
  return (
    <div
      className={`inline-flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-[0_12px_36px_rgba(15,23,42,0.16)] ${className}`}
    >
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
          <span className="text-[#f27c22]">★★★★★</span> 4.8 trusted rating
        </p>
      </div>
    </div>
  );
}

/**
 * Hero matches the design mock:
 * - soft left fade (mountains stay visible)
 * - copy top-left
 * - social proof mid-right
 * - full search card visible (not clipped)
 * - green feature strip under search
 */
export function Hero() {
  return (
    <section className="bg-white">
      {/* Image + copy plane */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={HERO_IMAGE}
            alt="Misty Himalayan village — Incredible India holidays"
            className="h-full w-full object-cover object-[60%_35%]"
            width={2000}
            height={1100}
            loading="eager"
          />
          {/* Soft left wash — mountains remain visible (was too heavy before) */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(90deg, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.55) 34%, rgba(255,255,255,0.12) 58%, rgba(255,255,255,0) 72%)",
            }}
          />
        </div>

        <div className="relative z-10 mx-auto flex w-full max-w-[1200px] flex-col px-4 pb-8 pt-12 sm:px-6 sm:pb-10 sm:pt-14 lg:min-h-[420px] lg:pb-12 lg:pt-16">
          <div className="flex items-start justify-between gap-6">
            <div className="max-w-[560px]">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#f3d9c0] bg-[#fff6ec]/95 px-3.5 py-[7px] text-[10.5px] font-bold uppercase tracking-[0.14em] text-[#d96a12] sm:mb-5">
                <span className="h-[7px] w-[7px] rounded-full bg-[#f27c22]" />
                Made for your kind of holiday
              </div>

              <h1 className="text-[40px] font-extrabold leading-[1.06] tracking-[-0.035em] text-[#1a2420] sm:text-[52px] lg:text-[58px]">
                Incredible India,
                <br />
                <span className="text-[#f27c22]">made</span>{" "}
                <span className="text-[#0f3d2e]">personal.</span>
              </h1>

              <p className="mt-4 max-w-[460px] text-[15px] leading-[1.65] text-[#66756c] sm:text-[16px]">
                Handpicked stays, memorable experiences and thoughtfully planned
                journeys—all designed around you.
              </p>
            </div>

            <div className="hidden shrink-0 pt-16 lg:block xl:pt-20">
              <SocialProof />
            </div>
          </div>
        </div>

        {/* Search sits in normal flow over the image — never clipped */}
        <div className="relative z-20 mx-auto w-full max-w-[1200px] px-4 pb-5 sm:px-6 sm:pb-6">
          <div className="mx-auto max-w-[1080px]">
            <ExploreTabs />
          </div>
        </div>
      </div>

      {/* Mobile social proof */}
      <div className="px-4 py-3 lg:hidden sm:px-6">
        <SocialProof />
      </div>

      <FeatureStrip />
    </section>
  );
}
