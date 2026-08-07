import { heroFlipCards, exploreDestinations } from "@/lib/data";

function FlipCard({
  front,
  back,
  size,
}: {
  front: string;
  back: string;
  size: number;
}) {
  return (
    <div className="th-flip shrink-0" style={{ width: size, height: size }}>
      <div className="th-flip-inner">
        <div className="th-flip-face">
          <img
            src={front}
            alt=""
            width={size}
            height={size}
            className="h-full w-full object-cover"
            loading="eager"
            decoding="async"
          />
        </div>
        <div className="th-flip-face th-flip-back">
          <img
            src={back}
            alt=""
            width={size}
            height={size}
            className="h-full w-full object-cover"
            loading="eager"
            decoding="async"
          />
        </div>
      </div>
    </div>
  );
}

export function Hero() {
  const left = heroFlipCards.slice(0, 3);
  const right = heroFlipCards.slice(3, 6);

  return (
    <section className="overflow-hidden bg-white">
      {/* Thrillophilia: wrapper height 300px, heading mt 60px, subtitle mt 15 / mb 60 */}
      <div className="relative mx-auto h-auto w-full max-w-[1440px] overflow-hidden lg:h-[300px]">
        {/* Left flip cards */}
        <div className="pointer-events-none absolute left-0 top-0 hidden h-full w-[34%] select-none lg:block" aria-hidden>
          <div
            className="flex h-[140px] items-end gap-5 overflow-hidden pt-3"
            style={{ transform: "scaleX(-1)", marginLeft: -48 }}
          >
            {left.map((c, i) => (
              <div key={i} className="pointer-events-auto" style={{ transform: "scaleX(-1)" }}>
                <FlipCard front={c.front} back={c.back} size={i === 1 ? 120 : 107} />
              </div>
            ))}
          </div>
          <div className="mt-[20px] flex items-start gap-5 overflow-hidden pl-8">
            {left.map((c, i) => (
              <FlipCard key={`b-${i}`} front={c.back} back={c.front} size={96} />
            ))}
          </div>
        </div>

        {/* Center heading — text-align center, mt 60px */}
        <div className="relative z-10 mx-auto flex w-full max-w-[560px] flex-col items-center px-4 pt-10 text-center lg:pt-[60px]">
          <h1 className="text-[35px] font-semibold capitalize leading-normal text-[#202020] sm:text-[50px]">
            Your Tour,
            <span className="hidden sm:inline"> </span>
            <br className="sm:hidden" />
            Perfectly <span className="th-gradient-text">Personalised!</span>
          </h1>
          <p className="mb-6 mt-[15px] text-[15px] font-light text-black sm:mb-[60px] sm:text-[20px] sm:font-normal sm:text-[#515151]">
            Explore expertly curated multi-day tours
          </p>

          {/* Mobile flip strip so images always show */}
          <div className="hide-scrollbar mb-4 flex w-full gap-3 overflow-x-auto px-1 pb-2 lg:hidden">
            {heroFlipCards.map((c, i) => (
              <FlipCard key={i} front={c.front} back={c.back} size={88} />
            ))}
          </div>
        </div>

        {/* Right flip cards */}
        <div className="pointer-events-none absolute right-0 top-0 hidden h-full w-[34%] select-none lg:block" aria-hidden>
          <div className="flex h-[140px] items-end justify-end gap-5 overflow-hidden pt-3" style={{ marginRight: -48 }}>
            {right.map((c, i) => (
              <div key={i} className="pointer-events-auto">
                <FlipCard front={c.front} back={c.back} size={i === 1 ? 120 : 107} />
              </div>
            ))}
          </div>
          <div className="mt-[20px] flex items-start justify-end gap-5 overflow-hidden pr-8">
            {right.map((c, i) => (
              <FlipCard key={`b-${i}`} front={c.back} back={c.front} size={96} />
            ))}
          </div>
        </div>
      </div>

      {/* Explore chips — gap ~16–20px like Thrillophilia */}
      <div className="bg-white pb-8 pt-1">
        <div className="th-container">
          <p className="mb-4 text-[14px] font-semibold text-[#515151]">Explore</p>
          <div className="hide-scrollbar flex gap-5 overflow-x-auto pb-1">
            {exploreDestinations.map((d) => (
              <a
                key={d.name}
                href={`#${["goa", "kerala", "ladakh", "kashmir", "rajasthan"].includes(d.name.toLowerCase()) ? d.name.toLowerCase() : "packages"}`}
                className="group w-[100px] shrink-0 text-center"
              >
                <div className="relative mx-auto h-[100px] w-[100px] overflow-hidden rounded-[16px] bg-[#eee]">
                  <img
                    src={d.image}
                    alt={d.name}
                    width={100}
                    height={100}
                    loading="eager"
                    decoding="async"
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  />
                  {d.trending && (
                    <span className="absolute left-1.5 top-1.5 rounded-[3px] bg-[var(--th-orange)] px-1.5 py-0.5 text-[8px] font-bold uppercase leading-none text-white">
                      Trending
                    </span>
                  )}
                </div>
                <span className="mt-2.5 block text-[13px] font-semibold text-[#202020]">{d.name}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
