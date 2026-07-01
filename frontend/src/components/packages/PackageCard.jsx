import { motion } from 'framer-motion';
import {
  MapPin,
  Clock,
  IndianRupee,
  Copy,
  Pencil,
  Trash2,
  Eye,
  Archive,
  User,
  MoreHorizontal,
} from 'lucide-react';
import { PACKAGE_STATUS_OPTIONS } from './builder/packageBuilderConstants';
import { PACKAGE_TYPES } from '../quotations/constants';
import { formatINR } from '../quotations/quotationUtils';
import { cn } from '../../lib/utils';
import { useState } from 'react';

export default function PackageCard({
  pkg,
  index,
  onEdit,
  onDelete,
  onDuplicate,
  onPreview,
  onArchive,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const typeCfg = PACKAGE_TYPES.find((t) => t.value === pkg.packageType) || PACKAGE_TYPES[1];
  const statusCfg = PACKAGE_STATUS_OPTIONS.find((s) => s.value === pkg.status) || PACKAGE_STATUS_OPTIONS[0];
  const cover = pkg.coverImage || pkg.gallery?.[0] || '';
  const days = pkg.days || pkg.duration || 0;
  const nights = pkg.nights ?? Math.max(0, days - 1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="group rounded-2xl border border-white/30 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl shadow-lg shadow-black/5 overflow-hidden hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
    >
      <div className="relative h-40 bg-gradient-to-br from-slate-800 to-slate-900">
        {cover ? (
          <img src={cover} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl opacity-20">🏔</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
          <span className={cn('text-[10px] font-bold uppercase px-2 py-0.5 rounded-full backdrop-blur-sm', statusCfg.color)}>
            {statusCfg.label}
          </span>
          <span className={cn('text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-white/90 text-slate-800')}>
            {typeCfg.label}
          </span>
        </div>
        <div className="absolute bottom-3 left-3 right-3">
          <h3 className="text-white font-black text-base leading-tight line-clamp-2">{pkg.name}</h3>
          <p className="text-white/80 text-xs flex items-center gap-1 mt-1">
            <MapPin className="w-3 h-3" /> {pkg.destination}
          </p>
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div className="flex flex-wrap gap-3 text-xs text-content-secondary">
          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-sky-600" /> {days}D / {nights}N</span>
          <span className="flex items-center gap-1 font-bold text-emerald-700">
            <IndianRupee className="w-3.5 h-3.5" /> {formatINR(pkg.startingPrice || pkg.pricing?.finalPrice || 0)}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center py-2 rounded-xl bg-surface-elevated/60">
          <div>
            <p className="text-sm font-black text-content-primary">{pkg.quotationCount || 0}</p>
            <p className="text-[9px] text-content-muted uppercase">Quotes</p>
          </div>
          <div>
            <p className="text-sm font-black text-content-primary">{pkg.bookingCount || 0}</p>
            <p className="text-[9px] text-content-muted uppercase">Bookings</p>
          </div>
          <div>
            <p className="text-sm font-black text-content-primary">{pkg.views || 0}</p>
            <p className="text-[9px] text-content-muted uppercase">Views</p>
          </div>
        </div>

        <div className="flex items-center justify-between text-[10px] text-content-muted">
          <span className="flex items-center gap-1 truncate">
            <User className="w-3 h-3 shrink-0" />
            {pkg.createdByName || pkg.createdBy?.name || 'Team'}
          </span>
          <span>{pkg.updatedAt ? new Date(pkg.updatedAt).toLocaleDateString() : '—'}</span>
        </div>

        <div className="flex gap-2 pt-1">
          <button type="button" onClick={() => onEdit(pkg)} className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-semibold bg-amber-500/15 text-amber-800 hover:bg-amber-500/25 border border-amber-500/20">
            <Pencil className="w-3.5 h-3.5" /> Edit
          </button>
          <button type="button" onClick={() => onPreview?.(pkg)} className="p-2 rounded-xl border border-subtle hover:bg-white/80" title="Preview">
            <Eye className="w-4 h-4" />
          </button>
          <div className="relative">
            <button type="button" onClick={() => setMenuOpen(!menuOpen)} className="p-2 rounded-xl border border-subtle hover:bg-white/80">
              <MoreHorizontal className="w-4 h-4" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 bottom-full mb-1 w-40 rounded-xl border border-subtle bg-white dark:bg-slate-900 shadow-xl z-10 py-1 text-xs">
                <button type="button" onClick={() => { onDuplicate(pkg._id); setMenuOpen(false); }} className="w-full px-3 py-2 text-left hover:bg-surface-elevated flex items-center gap-2"><Copy className="w-3.5 h-3.5" /> Duplicate</button>
                <button type="button" onClick={() => { onArchive?.(pkg._id); setMenuOpen(false); }} className="w-full px-3 py-2 text-left hover:bg-surface-elevated flex items-center gap-2"><Archive className="w-3.5 h-3.5" /> Archive</button>
                <button type="button" onClick={() => { onDelete(pkg._id); setMenuOpen(false); }} className="w-full px-3 py-2 text-left text-red-600 hover:bg-red-500/10 flex items-center gap-2"><Trash2 className="w-3.5 h-3.5" /> Delete</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
