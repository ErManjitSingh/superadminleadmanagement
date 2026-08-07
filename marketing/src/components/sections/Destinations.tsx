import { exploreDestinations, destinationSections, formatInr } from "@/lib/data";

function startPrice(name: string) {
  const section = destinationSections.find(
    (s) => s.title.toLowerCase() === name.toLowerCase()
  );
  if (!section) return "Starts @ ₹16,880/person";
  const min = Math.min(...section.packages.map((p) => p.priceNow));
  return `Starts @ ${formatInr(min)}/person`;
}

/** Compact “Top Picks” strip like Thrillophilia */
export function Destinations() {
  const picks = exploreDestinations.filter((d) =>
    destinationSections.some((s) => s.title.toLowerCase() === d.name.toLowerCase())
  );

  return (
    <section id="destinations" className="bg-white py-10 sm:py-12">
      <div className="th-container">
        <div className="mb-5 flex items-end justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--th-orange)]">
              Top Picks
            </p>
            <h2 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-[28px]">
              Popular Destinations
            </h2>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {picks.map((d) => (
            <a
              key={d.name}
              href={`#${d.name.toLowerCase()}`}
              className="group relative flex h-[140px] overflow-hidden rounded-2xl sm:h-[160px]"
            >
              <img
                src={d.image}
                alt={d.name}
                width={400}
                height={160}
                loading="lazy"
                decoding="async"
                className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/40 to-transparent" />
              <div className="relative z-10 flex flex-col justify-end p-4 text-white">
                <p className="text-xs font-semibold uppercase tracking-wide text-white/70">Explore</p>
                <h3 className="text-xl font-extrabold">{d.name}</h3>
                <p className="mt-1 text-sm text-[var(--th-yellow)]">{startPrice(d.name)}</p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
