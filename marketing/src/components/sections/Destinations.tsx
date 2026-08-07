import { destinations } from "@/lib/data";

export function Destinations() {
  return (
    <section id="destinations" className="section-pad bg-[var(--ink)] text-white">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-2xl">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-[var(--glow)]">
            Destinations
          </p>
          <h2 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
            Where will India take you next?
          </h2>
          <p className="mt-4 text-lg text-white/55">
            From coastline sunsets to Himalayan mornings — pick a region and we craft the days.
          </p>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {destinations.map((d) => (
            <a
              key={d.name}
              href="#packages"
              className="group relative block aspect-[3/4] overflow-hidden rounded-[1.75rem]"
            >
              <img
                src={d.image}
                alt={d.name}
                width={700}
                height={933}
                loading="lazy"
                decoding="async"
                className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5">
                <h3 className="font-display text-2xl font-bold">{d.name}</h3>
                <p className="mt-1 text-sm text-white/70">{d.blurb}</p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
