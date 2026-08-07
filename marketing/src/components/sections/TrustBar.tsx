import { trustStats } from "@/lib/data";

export function TrustBar() {
  return (
    <section className="border-y border-[var(--th-border)] bg-white">
      <div className="th-container grid grid-cols-2 gap-6 py-8 sm:grid-cols-4 sm:py-10">
        {trustStats.map((s) => (
          <div key={s.label} className="text-center">
            <p className="text-2xl font-extrabold text-[var(--th-orange)] sm:text-3xl">{s.value}</p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-[var(--th-muted)] sm:text-sm">
              {s.label}
            </p>
          </div>
        ))}
      </div>
      <div className="border-t border-[var(--th-border)] bg-[#fff8f2] py-4 text-center">
        <p className="text-sm font-bold text-[var(--th-ink)]">
          AWARDED BEST LEISURE TOURS BRAND
        </p>
        <p className="mt-0.5 text-xs text-[var(--th-muted)]">
          Trusted by travellers across India for curated holiday packages
        </p>
      </div>
    </section>
  );
}
