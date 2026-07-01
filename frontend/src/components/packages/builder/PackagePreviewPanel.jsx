import { MapPin, Clock, IndianRupee, Star } from 'lucide-react';
import GlassCard from '../../quotations/builder/GlassCard';
import { PACKAGE_TYPES } from '../../quotations/constants';
import { formatINR } from '../../quotations/quotationUtils';
import { PACKAGE_STATUS_OPTIONS } from './packageBuilderConstants';
import { cn } from '../../../lib/utils';

export default function PackagePreviewPanel({ pkg, previewMode = 'desktop' }) {
  const typeCfg = PACKAGE_TYPES.find((t) => t.value === pkg.packageType) || PACKAGE_TYPES[1];
  const statusCfg = PACKAGE_STATUS_OPTIONS.find((s) => s.value === pkg.status) || PACKAGE_STATUS_OPTIONS[0];
  const cover = pkg.coverImage || pkg.gallery?.[0] || '';

  const widthClass =
    previewMode === 'mobile' ? 'max-w-[280px] mx-auto' : previewMode === 'tablet' ? 'max-w-[360px] mx-auto' : '';

  return (
    <GlassCard className={cn('overflow-hidden sticky top-20', widthClass)}>
      <div className="relative h-36 bg-gradient-to-br from-slate-800 to-slate-900">
        {cover ? (
          <img src={cover} alt="" className="w-full h-full object-cover opacity-90" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/30 text-4xl">✈</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <div className="absolute bottom-3 left-3 right-3">
          <span className={cn('text-[9px] font-bold uppercase px-2 py-0.5 rounded-full', statusCfg.color)}>
            {statusCfg.label}
          </span>
          <h3 className="text-white font-black text-sm mt-1 line-clamp-2">{pkg.name || 'Untitled Package'}</h3>
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div className="flex flex-wrap gap-2 text-[10px]">
          <span className={cn('px-2 py-0.5 rounded-full border font-semibold', typeCfg.color)}>{typeCfg.label}</span>
          {pkg.tags?.slice(0, 2).map((tag) => (
            <span key={tag} className="px-2 py-0.5 rounded-full bg-slate-500/10 text-content-muted font-medium">{tag}</span>
          ))}
        </div>

        <div className="space-y-1.5 text-xs text-content-secondary">
          <p className="flex items-center gap-1.5"><MapPin className="w-3 h-3 text-amber-600" /> {pkg.destination || '—'}</p>
          <p className="flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-sky-600" />
            {pkg.days || pkg.duration || 0}D / {pkg.nights ?? Math.max(0, (pkg.days || pkg.duration || 1) - 1)}N
          </p>
          <p className="flex items-center gap-1.5 font-bold text-content-primary">
            <IndianRupee className="w-3 h-3 text-emerald-600" />
            From {formatINR(pkg.pricing?.finalPrice || pkg.startingPrice || 0)}
          </p>
        </div>

        {pkg.shortDescription && (
          <p className="text-[11px] text-content-muted line-clamp-3">{pkg.shortDescription}</p>
        )}

        <div className="pt-2 border-t border-subtle">
          <p className="text-[10px] font-bold uppercase text-content-muted mb-2">Itinerary</p>
          <div className="space-y-1.5 max-h-32 overflow-y-auto">
            {(pkg.itinerary || []).slice(0, 4).map((day) => (
              <div key={day.day} className="flex gap-2 text-[10px]">
                <span className="font-bold text-amber-700 shrink-0">D{day.day}</span>
                <span className="text-content-secondary truncate">{day.title}</span>
              </div>
            ))}
          </div>
        </div>

        {pkg.destinations?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {pkg.destinations.slice(0, 4).map((d) => (
              <span key={d.name || d._id} className="text-[9px] px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-800">{d.name}</span>
            ))}
          </div>
        )}

        <div className="flex items-center gap-1 text-[10px] text-amber-700">
          <Star className="w-3 h-3 fill-current" />
          Live preview
        </div>
      </div>
    </GlassCard>
  );
}
