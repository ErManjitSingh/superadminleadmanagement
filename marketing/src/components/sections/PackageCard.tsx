import type { PackageCard as PackageCardType } from "@/lib/data";
import { formatInr } from "@/lib/data";
import { siteConfig } from "@/lib/config";

/** Thrillophilia-style tour package card */
export function PackageCard({ pkg }: { pkg: PackageCardType }) {
  const save = pkg.priceWas - pkg.priceNow;

  return (
    <article className="flex w-[272px] shrink-0 flex-col overflow-hidden rounded-[14px] border border-[#ececec] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)] sm:w-[286px]">
      <div className="relative aspect-[16/10] overflow-hidden bg-neutral-100">
        <img
          src={pkg.image}
          alt=""
          width={286}
          height={179}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
        />
        {pkg.badge && (
          <span className="absolute left-2.5 top-2.5 rounded bg-[var(--th-orange)] px-2 py-0.5 text-[10px] font-bold uppercase text-white">
            {pkg.badge}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-3">
        <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-[var(--th-muted)]">
          <span>{pkg.duration}</span>
          <span className="text-[#ddd]">•</span>
          <span className="font-semibold text-[var(--th-ink)]">
            {pkg.rating.toFixed(1)}
            <span className="text-[var(--th-yellow)]">★</span>
            <span className="ml-0.5 font-normal text-[var(--th-muted)]">({pkg.reviews})</span>
          </span>
        </div>

        <h3 className="mt-1.5 line-clamp-2 min-h-[40px] text-[14px] font-bold leading-snug text-[var(--th-ink)]">
          {pkg.title}
        </h3>

        <div className="mt-2 flex flex-wrap gap-1">
          {pkg.stays.slice(0, 4).map((s) => (
            <span
              key={`${s.place}-${s.days}`}
              className="rounded bg-[#f4f4f4] px-1.5 py-0.5 text-[10px] font-medium text-[#666]"
            >
              <b className="text-[var(--th-ink)]">{s.days}D</b> {s.place}
            </span>
          ))}
        </div>

        <div className="mt-auto pt-3">
          <div className="flex items-end justify-between gap-2">
            <div>
              <p className="text-[11px] text-[#999] line-through">{formatInr(pkg.priceWas)}</p>
              <p className="text-[17px] font-extrabold leading-none text-[var(--th-ink)]">
                {formatInr(pkg.priceNow)}
                <span className="ml-1 text-[11px] font-medium text-[var(--th-muted)]">{pkg.per}</span>
              </p>
            </div>
            <span className="rounded bg-[#eaf7ef] px-1.5 py-0.5 text-[10px] font-bold uppercase text-[var(--th-save)]">
              save {formatInr(save)}
            </span>
          </div>

          <a
            href={siteConfig.whatsapp}
            target="_blank"
            rel="noreferrer"
            className="th-btn-outline mt-3 w-full !py-2 text-[13px]"
          >
            Request callback
          </a>
        </div>
      </div>
    </article>
  );
}
