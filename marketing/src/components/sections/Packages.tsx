import { packages } from "@/lib/data";
import { siteConfig } from "@/lib/config";

export function Packages() {
  return (
    <section id="packages" className="section-pad bg-[var(--sand)]">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-2xl">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-[var(--lagoon)]">
            Featured packages
          </p>
          <h2 className="font-display text-4xl font-extrabold tracking-tight text-[var(--ink)] sm:text-5xl">
            Journeys worth packing for
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-[var(--ink)]/55">
            Clear pricing, flexible dates, and itineraries you can actually enjoy —
            not a rushed checklist.
          </p>
        </div>

        <div className="mt-14 grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
          {packages.map((pkg) => (
            <article
              key={pkg.id}
              className="group overflow-hidden rounded-[1.75rem] bg-white shadow-[0_24px_60px_-32px_rgba(7,28,30,0.45)] ring-1 ring-[var(--ink)]/5 transition duration-500 hover:-translate-y-1.5"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-[var(--mist)]">
                <img
                  src={pkg.image}
                  alt={pkg.imageAlt}
                  width={800}
                  height={600}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
                <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[var(--ink)]">
                  {pkg.tag}
                </span>
              </div>

              <div className="p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-display text-xl font-bold text-[var(--ink)]">{pkg.title}</h3>
                    <p className="mt-1 text-sm text-[var(--ink)]/45">
                      {pkg.location} · {pkg.duration}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--ink)]/35">
                      From
                    </p>
                    <p className="font-display text-lg font-bold text-[var(--coral)]">{pkg.priceFrom}</p>
                  </div>
                </div>

                <ul className="mt-4 flex flex-wrap gap-2">
                  {pkg.highlights.map((h) => (
                    <li
                      key={h}
                      className="rounded-full bg-[var(--mist)] px-3 py-1 text-xs font-medium text-[var(--lagoon)]"
                    >
                      {h}
                    </li>
                  ))}
                </ul>

                <a
                  href={siteConfig.whatsapp}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-[var(--ink)] transition hover:text-[var(--coral)]"
                >
                  Enquire now
                  <span aria-hidden>→</span>
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
