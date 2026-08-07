import type { PackageCard as PackageCardType } from "@/lib/data";
import { formatInr } from "@/lib/data";
import { siteConfig } from "@/lib/config";

export function PackageCard({ pkg }: { pkg: PackageCardType }) {
  const save = pkg.priceWas - pkg.priceNow;

  return (
    <article className="flex w-[280px] shrink-0 flex-col overflow-hidden rounded-2xl border border-[var(--th-border)] bg-white shadow-[0_8px_24px_-12px_rgba(0,0,0,0.18)] sm:w-[300px]">
      <div className="relative aspect-[16/11] overflow-hidden bg-neutral-100">
        <img
          src={pkg.image}
          alt=""
          width={300}
          height={206}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
        />
        {pkg.badge && (
          <span className="absolute left-3 top-3 rounded bg-[var(--th-orange)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
            {pkg.badge}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-3.5">
        <div className="flex items-center gap-2 text-[11px] text-[var(--th-muted)]">
          <span>{pkg.duration}</span>
          <span className="text-[var(--th-border)]">|</span>
          <span className="font-semibold text-[var(--th-ink)]">
            {pkg.rating.toFixed(1)}
            <span className="text-[var(--th-yellow)]">★</span>
          </span>
          <span>({pkg.reviews})</span>
        </div>

        <h3 className="mt-2 line-clamp-2 min-h-[2.6em] text-[15px] font-bold leading-snug text-[var(--th-ink)]">
          {pkg.title}
        </h3>

        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {pkg.stays.slice(0, 4).map((s) => (
            <span
              key={`${s.place}-${s.days}`}
              className="rounded bg-[#f3f3f3] px-2 py-0.5 text-[11px] font-medium text-[var(--th-muted)]"
            >
              <span className="font-bold text-[var(--th-ink)]">{s.days}D</span> {s.place}
            </span>
          ))}
        </div>

        <div className="mt-auto pt-4">
          <div className="flex items-end justify-between gap-2">
            <div>
              <p className="text-[11px] text-[var(--th-muted)] line-through">{formatInr(pkg.priceWas)}</p>
              <p className="text-lg font-extrabold leading-none text-[var(--th-ink)]">
                {formatInr(pkg.priceNow)}
                <span className="ml-1 text-[11px] font-semibold text-[var(--th-muted)]">{pkg.per}</span>
              </p>
            </div>
            <span className="rounded bg-[#e8f7ef] px-2 py-1 text-[11px] font-bold text-[var(--th-save)]">
              save {formatInr(save)}
            </span>
          </div>

          <a
            href={siteConfig.whatsapp}
            target="_blank"
            rel="noreferrer"
            className="th-btn mt-3 w-full"
          >
            Request callback
          </a>
        </div>
      </div>
    </article>
  );
}
