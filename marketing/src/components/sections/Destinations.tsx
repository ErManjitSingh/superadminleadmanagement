import { destinations } from "@/lib/data";

const toneClass: Record<string, string> = {
  goa: "dest-goa",
  kerala: "dest-kerala",
  himachal: "dest-himachal",
  rajasthan: "dest-rajasthan",
};

export function Destinations() {
  return (
    <section id="destinations" className="section-padding bg-[var(--ink)] text-white">
      <div className="mx-auto max-w-6xl">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[var(--coral)]">
          Destinations
        </p>
        <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Where will India take you next?
        </h2>
        <p className="mt-3 max-w-xl text-white/50">
          Pick a region — we craft the days around your dates.
        </p>

        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {destinations.map((d) => (
            <a
              key={d.name}
              href="#packages"
              className={`rounded-2xl p-6 text-white ${toneClass[d.tone] || "dest-goa"}`}
            >
              <h3 className="font-display text-xl font-bold">{d.name}</h3>
              <p className="mt-1 text-sm text-white/75">{d.blurb}</p>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
