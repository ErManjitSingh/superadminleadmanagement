import { trustStats } from "@/lib/data";

export function TrustBar() {
  return (
    <section className="border-y border-[var(--th-border)] bg-white">
      <div className="th-container grid grid-cols-2 gap-4 py-7 sm:grid-cols-4 sm:gap-6 sm:py-8">
        {trustStats.map((s) => (
          <div key={s.label} className="text-center">
            <p className="text-[22px] font-extrabold text-[var(--th-orange)] sm:text-[26px]">{s.value}</p>
            <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--th-muted)]">
              {s.label}
            </p>
          </div>
        ))}
      </div>
      <div className="border-t border-[var(--th-border)] bg-[var(--th-bg)] py-3.5 text-center">
        <p className="text-[13px] font-bold tracking-wide text-[var(--th-forest)]">
          AWARDED BEST LEISURE TOURS BRAND
        </p>
        <p className="mt-0.5 text-[11px] text-[var(--th-muted)]">
          Trusted by travellers across India · 4.8★ rated
        </p>
      </div>
    </section>
  );
}
