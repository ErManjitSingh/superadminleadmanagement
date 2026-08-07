import { exploreDestinations, destinationSections } from "@/lib/data";

function startPrice(name: string) {
  const section = destinationSections.find(
    (s) => s.title.toLowerCase() === name.toLowerCase()
  );
  if (!section) return null;
  return Math.min(...section.packages.map((p) => p.priceNow));
}

/** Thrillophilia Top Picks — 280×167 cards, yellow price badge */
export function Destinations() {
  const picks = exploreDestinations.filter((d) =>
    destinationSections.some((s) => s.title.toLowerCase() === d.name.toLowerCase())
  );

  return (
    <section id="destinations" className="bg-[var(--th-bg)] py-8 sm:py-10">
      <div className="th-container mb-4 flex items-end justify-between">
        <div>
          <p className="text-[12px] font-bold uppercase tracking-wide text-[var(--th-orange)]">Top Picks</p>
          <h2 className="mt-0.5 text-[22px] font-bold text-[var(--th-ink)] sm:text-[26px]">
            Popular Destinations
          </h2>
        </div>
        <a href="#packages" className="text-[13px] font-bold text-[var(--th-orange)] hover:underline">
          View All
        </a>
      </div>

      <div className="th-container">
        <div className="hide-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
          {picks.map((d) => {
            const price = startPrice(d.name);
            return (
              <a
                key={d.name}
                href={`#${d.name.toLowerCase()}`}
                className="relative h-[167px] w-[280px] shrink-0 overflow-hidden rounded-2xl"
              >
                <img
                  src={d.image}
                  alt={d.name}
                  width={280}
                  height={167}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3.5 text-white">
                  <div>
                    <p className="text-[11px] font-semibold text-white/80">Explore</p>
                    <p className="text-[18px] font-bold leading-tight">{d.name}</p>
                  </div>
                  {price != null && (
                    <div className="text-right">
                      <p className="text-[10px] text-white/80">Starts @</p>
                      <span className="th-price-badge">₹ {price.toLocaleString("en-IN")}</span>
                      <p className="mt-0.5 text-[10px] text-white/80">/person</p>
                    </div>
                  )}
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
