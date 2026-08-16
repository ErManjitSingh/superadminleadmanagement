import { heroFlipCards } from "@/lib/data";
import { ExploreTabs } from "@/components/sections/ExploreTabs";
import { CheckCircle2, Headphones, BadgeIndianRupee } from "lucide-react";

/** HD Himachal mountain banner (3000px wide). */
const HERO_IMAGE = "/hero-banner.jpg";

const valueProps = [
  {
    icon: CheckCircle2,
    title: "100% Customisable",
    desc: "Trips tailored to your needs",
  },
  {
    icon: Headphones,
    title: "Expert Support",
    desc: "24/7 assistance",
  },
  {
    icon: BadgeIndianRupee,
    title: "Best Price Promise",
    desc: "Best value, guaranteed",
  },
];

function SocialProof({ className = "" }: { className?: string }) {
  return (
    <div
      className={`inline-flex items-center gap-3 rounded-2xl border border-black/[0.04] bg-white px-4 py-3 shadow-[0_10px_30px_rgba(15,23,42,0.12)] ${className}`}
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
          <span className="text-[#f47920]">★★★★★</span> 4.8 trusted rating
        </p>
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-white lg:min-h-[640px]">
      {/* HD banner — full bleed, soft left wash for text */}
      <div className="pointer-events-none absolute inset-0 hidden lg:block">
        <img
          src={HERO_IMAGE}
          alt="Himachal green mountains — Incredible India holidays"
          className="h-full w-full object-cover object-[58%_40%]"
          width={3000}
          height={2000}
          loading="eager"
          decoding="async"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, #ffffff 0%, rgba(255,255,255,0.94) 26%, rgba(255,255,255,0.55) 46%, rgba(255,255,255,0.12) 68%, rgba(255,255,255,0) 82%)",
          }}
        />
      </div>

      {/* Mobile HD banner */}
      <div className="relative h-[240px] overflow-hidden sm:h-[280px] lg:hidden">
        <img
          src={HERO_IMAGE}
          alt="Himachal green mountains — Incredible India holidays"
          className="h-full w-full object-cover object-[58%_40%]"
          width={1600}
          height={1000}
          loading="eager"
          decoding="async"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/50 to-transparent" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[1200px] px-4 pb-8 pt-8 sm:px-6 sm:pb-10 sm:pt-10 lg:pt-14">
        <div className="max-w-[560px]">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#f3d9c0] bg-[#fff7ef] px-3.5 py-[7px] text-[10.5px] font-bold uppercase tracking-[0.14em] text-[#d96a12]">
            <span className="h-[7px] w-[7px] rounded-full bg-[#f47920]" />
            Made for your kind of holiday
          </div>

          <h1 className="text-[40px] font-extrabold leading-[1.06] tracking-[-0.035em] text-[#1a2420] sm:text-[52px] lg:text-[56px]">
            Incredible India,
            <br />
            <span className="text-[#f47920]">made</span>{" "}
            <span className="text-[#00332b]">personal.</span>
          </h1>

          <p className="mt-4 max-w-[460px] text-[15px] leading-[1.65] text-[#6b7280] sm:text-[16px]">
            Handpicked stays, memorable experiences and thoughtfully planned
            journeys—all designed around you.
          </p>
        </div>

        <div className="relative z-20 mt-8 max-w-[1080px] sm:mt-10">
          <ExploreTabs />
        </div>

        <div className="relative z-10 mt-6 flex flex-col gap-5 sm:mt-7 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
          <div className="grid flex-1 grid-cols-1 gap-5 sm:grid-cols-3 sm:gap-6">
            {valueProps.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#00332b] text-white shadow-sm">
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

          <div className="shrink-0">
            <SocialProof />
          </div>
        </div>
      </div>
    </section>
  );
}
