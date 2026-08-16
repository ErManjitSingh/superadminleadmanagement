import { ExploreTabs } from "@/components/sections/ExploreTabs";
import { heroFlipCards } from "@/lib/data";
import { Headphones, BadgePercent, SlidersHorizontal } from "lucide-react";

const HERO_IMAGE = "/hero-banner.jpg";

const valueProps = [
  {
    icon: SlidersHorizontal,
    title: "100% Customisable",
    desc: "Trips tailored to your needs",
  },
  {
    icon: Headphones,
    title: "Expert Support",
    desc: "24/7 assistance anytime",
  },
  {
    icon: BadgePercent,
    title: "Best Price Promise",
    desc: "Best value, guaranteed",
  },
];

function SocialProof() {
  return (
    <div className="hidden items-center gap-3 rounded-2xl border border-black/[0.04] bg-white px-4 py-3 shadow-[0_10px_30px_rgba(15,23,42,0.12)] lg:inline-flex">
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
          <span className="text-[#f46c14]">★★★★★</span> 4.8 trusted rating
        </p>
      </div>
    </div>
  );
}

function ValuePropsBar() {
  return (
    <div className="rounded-[14px] bg-[#f3f4f6] px-2 py-3.5 sm:rounded-none sm:bg-transparent sm:px-0 sm:py-0">
      <div className="grid grid-cols-3 gap-1 sm:gap-6">
        {valueProps.map((item, i) => {
          const Icon = item.icon;
          return (
            <div
              key={item.title}
              className={`flex flex-col items-center px-1 text-center sm:flex-row sm:items-start sm:gap-3 sm:px-0 sm:text-left ${
                i < valueProps.length - 1
                  ? "border-r border-[#e5e7eb] sm:border-0"
                  : ""
              }`}
            >
              <span className="mb-1.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#003322] text-white sm:mb-0 sm:h-10 sm:w-10">
                <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={2.4} />
              </span>
              <div>
                <p className="text-[10px] font-bold leading-tight text-[#1a2420] sm:text-[14px]">
                  {item.title}
                </p>
                <p className="mt-0.5 text-[9px] leading-snug text-[#6b7280] sm:text-[12.5px]">
                  {item.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <section className="relative bg-white lg:min-h-[640px] lg:overflow-hidden">
      {/* ===== Desktop banner ===== */}
      <div className="pointer-events-none absolute inset-0 hidden lg:block">
        <img
          src={HERO_IMAGE}
          alt="Himachal green mountains — Incredible India holidays"
          className="h-full w-full object-cover object-[58%_40%]"
          width={3000}
          height={2000}
          loading="eager"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, #ffffff 0%, rgba(255,255,255,0.94) 26%, rgba(255,255,255,0.55) 46%, rgba(255,255,255,0.12) 68%, rgba(255,255,255,0) 82%)",
          }}
        />
      </div>

      {/* ===== Mobile: image + copy as one hero plane ===== */}
      <div className="relative lg:hidden">
        <div className="relative min-h-[340px] overflow-hidden">
          <img
            src={HERO_IMAGE}
            alt="Himachal green mountains — Incredible India holidays"
            className="absolute inset-0 h-full w-full object-cover object-[50%_35%]"
            width={1600}
            height={1200}
            loading="eager"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.72) 0%, rgba(255,255,255,0.45) 35%, rgba(255,255,255,0.15) 60%, rgba(255,255,255,0.55) 100%)",
            }}
          />
          <div className="relative z-10 px-4 pb-24 pt-8">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#f3d9c0] bg-white/95 px-3 py-[6px] text-[9.5px] font-bold uppercase tracking-[0.12em] text-[#d96a12] shadow-sm">
              <span className="h-[6px] w-[6px] rounded-full bg-[#f46c14]" />
              Made for your kind of holiday
            </div>
            <h1 className="text-[32px] font-extrabold leading-[1.08] tracking-[-0.03em] text-[#003322]">
              Incredible India,
              <br />
              <span className="text-[#f46c14]">made</span> personal.
            </h1>
            <p className="mt-3 max-w-[340px] text-[13.5px] leading-[1.55] text-[#4b5563]">
              Handpicked stays, memorable experiences and thoughtfully planned
              journeys—all designed around you.
            </p>
          </div>
        </div>

        {/* Search overlaps bottom of hero image */}
        <div className="relative z-20 -mt-16 px-3">
          <ExploreTabs />
        </div>

        <div className="px-3 pb-2 pt-4">
          <ValuePropsBar />
        </div>
      </div>

      {/* ===== Desktop content ===== */}
      <div className="relative z-10 mx-auto hidden w-full max-w-[1200px] px-6 pb-10 pt-14 lg:block">
        <div className="flex items-start justify-between gap-6">
          <div className="max-w-[560px]">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#f3d9c0] bg-[#fff7ef] px-3.5 py-[7px] text-[10.5px] font-bold uppercase tracking-[0.14em] text-[#d96a12]">
              <span className="h-[7px] w-[7px] rounded-full bg-[#f46c14]" />
              Made for your kind of holiday
            </div>
            <h1 className="text-[56px] font-extrabold leading-[1.06] tracking-[-0.035em] text-[#1a2420]">
              Incredible India,
              <br />
              <span className="text-[#f46c14]">made</span>{" "}
              <span className="text-[#003322]">personal.</span>
            </h1>
            <p className="mt-4 max-w-[460px] text-[16px] leading-[1.65] text-[#6b7280]">
              Handpicked stays, memorable experiences and thoughtfully planned
              journeys—all designed around you.
            </p>
          </div>
          <div className="pt-16">
            <SocialProof />
          </div>
        </div>

        <div className="relative z-20 mt-10 max-w-[1080px]">
          <ExploreTabs />
        </div>

        <div className="mt-7 flex items-start justify-between gap-8">
          <div className="grid flex-1 grid-cols-3 gap-6">
            {valueProps.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#003322] text-white">
                    <Icon className="h-4 w-4" strokeWidth={2.4} />
                  </span>
                  <div>
                    <p className="text-[14px] font-bold text-[#1a2420]">{item.title}</p>
                    <p className="mt-0.5 text-[12.5px] text-[#6b7280]">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
