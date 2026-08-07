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
          <img src={front} alt="" width={size} height={size} className="h-full w-full object-cover" loading="lazy" />
        </div>
        <div className="th-flip-face th-flip-back">
          <img src={back} alt="" width={size} height={size} className="h-full w-full object-cover" loading="lazy" />
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
      {/* Exact Thrillophilia hero structure: flip rows + centered headline */}
      <div className="relative mx-auto flex min-h-[280px] max-w-[1400px] items-start justify-between overflow-hidden pt-6 sm:min-h-[300px] sm:pt-8">
        {/* Left flip cards */}
        <div className="pointer-events-none absolute left-0 top-4 hidden w-[38%] select-none lg:block" aria-hidden>
          <div className="flex items-end gap-5 overflow-hidden pl-2" style={{ transform: "scaleX(-1)", marginLeft: -48 }}>
            {left.map((c, i) => (
              <div key={i} className="pointer-events-auto" style={{ transform: "scaleX(-1)" }}>
                <FlipCard front={c.front} back={c.back} size={i === 1 ? 120 : 107} />
              </div>
            ))}
          </div>
          <div className="mt-5 flex items-start gap-5 overflow-hidden pl-8">
            {left.map((c, i) => (
              <FlipCard key={`b-${i}`} front={c.back} back={c.front} size={96} />
            ))}
          </div>
        </div>

        {/* Center heading */}
        <div className="relative z-10 mx-auto w-full max-w-xl px-4 pt-10 text-center sm:pt-14">
          <h1 className="text-[35px] font-semibold capitalize leading-tight text-[#202020] sm:text-[50px]">
            Your Tour,
            <br className="hidden sm:block" />
            Perfectly{" "}
            <span className="th-gradient-text">Personalised!</span>
          </h1>
          <p className="mt-3 text-[15px] font-light text-black sm:mt-4 sm:text-[20px] sm:font-normal sm:text-[#515151]">
            Explore expertly curated multi-day tours
          </p>
        </div>

        {/* Right flip cards */}
        <div className="pointer-events-none absolute right-0 top-4 hidden w-[38%] select-none lg:block" aria-hidden>
          <div className="flex items-end justify-end gap-5 overflow-hidden pr-2" style={{ marginRight: -48 }}>
            {right.map((c, i) => (
              <div key={i} className="pointer-events-auto">
                <FlipCard front={c.front} back={c.back} size={i === 1 ? 120 : 107} />
              </div>
            ))}
          </div>
          <div className="mt-5 flex items-start justify-end gap-5 overflow-hidden pr-8">
            {right.map((c, i) => (
              <FlipCard key={`b-${i}`} front={c.back} back={c.front} size={96} />
            ))}
          </div>
        </div>
      </div>

      {/* Explore destination chips — Thrillophilia style */}
      <div className="border-t border-[var(--th-border)] bg-white pb-6 pt-2">
        <div className="th-container">
          <p className="mb-3 text-[13px] font-semibold text-[var(--th-muted)]">Explore</p>
          <div className="hide-scrollbar flex gap-4 overflow-x-auto pb-1">
            {exploreDestinations.map((d) => (
              <a
                key={d.name}
                href={`#${["goa", "kerala", "ladakh", "kashmir", "rajasthan"].includes(d.name.toLowerCase()) ? d.name.toLowerCase() : "packages"}`}
                className="group relative w-[92px] shrink-0 text-center sm:w-[100px]"
              >
                <div className="relative mx-auto h-[92px] w-[92px] overflow-hidden rounded-2xl sm:h-[100px] sm:w-[100px]">
                  <img
                    src={d.image}
                    alt={d.name}
                    width={100}
                    height={100}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  />
                  {d.trending && (
                    <span className="absolute left-1 top-1 rounded bg-[var(--th-orange)] px-1 py-0.5 text-[8px] font-bold uppercase text-white">
                      Trending
                    </span>
                  )}
                </div>
                <span className="mt-2 block text-[13px] font-semibold text-[var(--th-ink)]">{d.name}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
