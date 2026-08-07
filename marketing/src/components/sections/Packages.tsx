import { packages } from "@/lib/data";
import { siteConfig } from "@/lib/config";

export function Packages() {
  return (
    <section id="packages" className="section-padding bg-[var(--sand)]">
      <div className="mx-auto max-w-6xl">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[var(--lagoon)]">
          Featured packages
        </p>
        <h2 className="font-display text-3xl font-bold tracking-tight text-[var(--ink)] sm:text-4xl">
          Journeys worth packing for
        </h2>
        <p className="mt-3 max-w-xl text-[var(--ink)]/55">
          Ready-to-book packages with clear pricing — customise any itinerary to your dates.
        </p>

        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {packages.map((pkg) => (
            <article
              key={pkg.id}
              className="overflow-hidden rounded-2xl bg-white ring-1 ring-[var(--ink)]/5"
            >
              <div className="relative aspect-[16/10] bg-[var(--mist)]">
                <img
                  src={pkg.image}
                  alt={pkg.imageAlt}
                  width={640}
                  height={400}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover"
                />
                <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--ink)]">
                  {pkg.tag}
                </span>
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-display text-lg font-bold text-[var(--ink)]">{pkg.title}</h3>
                    <p className="mt-0.5 text-sm text-[var(--ink)]/45">
                      {pkg.location} · {pkg.duration}
                    </p>
                  </div>
                  <p className="shrink-0 text-right font-display text-base font-bold text-[var(--coral)]">
                    {pkg.priceFrom}
                  </p>
                </div>
                <ul className="mt-3 flex flex-wrap gap-1.5">
                  {pkg.highlights.map((h) => (
                    <li
                      key={h}
                      className="rounded-full bg-[var(--mist)] px-2.5 py-0.5 text-xs text-[var(--lagoon)]"
                    >
                      {h}
                    </li>
                  ))}
                </ul>
                <a
                  href={siteConfig.whatsapp}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-block text-sm font-semibold text-[var(--ink)] hover:text-[var(--coral)]"
                >
                  Enquire now →
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
