import { exploreDestinations, destinationSections } from "@/lib/data";

function startPrice(name: string) {
  const section = destinationSections.find(
    (s) => s.title.toLowerCase() === name.toLowerCase()
  );
  if (!section) return null;
  return Math.min(...section.packages.map((p) => p.priceNow));
}

/** Thrillophilia Top Picks — exact 280×167, radius 16, gap 16 */
export function Destinations() {
  const picks = exploreDestinations.filter((d) =>
    destinationSections.some((s) => s.title.toLowerCase() === d.name.toLowerCase())
  );

  return (
    <section id="destinations" className="bg-[var(--th-bg)] py-12 sm:py-16">
      <div className="th-container mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--th-orange)]">
            Handpicked for you
          </p>
          <h2 className="mt-1 text-[27px] font-extrabold leading-tight tracking-tight text-[#17213a] sm:text-[34px]">
            Popular destinations
          </h2>
        </div>
        <a href="#packages" className="shrink-0 text-[13px] font-bold text-[var(--th-orange)] hover:underline">
          View All
        </a>
      </div>

      <div className="th-container">
        <div className="hide-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:gap-4 sm:px-0">
          {picks.map((d) => {
            const price = startPrice(d.name);
            return (
              <a
                key={d.name}
                href={`#${d.name.toLowerCase()}`}
                className="group relative h-[190px] w-[290px] shrink-0 overflow-hidden rounded-[20px] bg-[#ddd] shadow-[0_8px_24px_rgba(15,23,42,.09)]"
              >
                <img
                  src={d.image}
                  alt={d.name}
                  width={280}
                  height={167}
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
                <div
                  className="absolute inset-x-0 bottom-0 h-[121px]"
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.75) 100%)",
                  }}
                />
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 px-3.5 pb-3.5 text-white">
                  <div>
                    <p className="text-[11px] font-semibold text-white/85">Explore</p>
                    <p className="text-[18px] font-bold leading-tight">{d.name}</p>
                  </div>
                  {price != null && (
                    <div className="pb-0.5 text-right">
                      <p className="text-[10px] text-white/85">Starts @</p>
                      <span className="th-price-badge">₹ {price.toLocaleString("en-IN")}</span>
                      <p className="mt-0.5 text-[10px] text-white/85">/person</p>
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
