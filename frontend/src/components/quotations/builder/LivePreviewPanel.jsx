import { motion } from 'framer-motion';
import QuotePdfPreview from '../QuotePdfPreview';
import { formatINR } from '../quotationUtils';
import { COMPANY_INFO } from '../constants';
import { useTenant } from '../../../context/TenantContext';
import GlassCard from './GlassCard';

export default function LivePreviewPanel({ draftQuote, packageInfo, pricing, collapsed }) {
  const { company } = useTenant();
  const logoUrl = company?.logo || company?.branding?.logo || COMPANY_INFO.logoUrl;
  if (collapsed) {
    return (
      <div className="hidden xl:flex flex-col items-center justify-center p-4 text-content-muted text-xs">
        Preview
      </div>
    );
  }

  const coverImage =
    draftQuote?.package?.coverImage ||
    packageInfo?.coverImage ||
    'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&q=80';

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-white/20 bg-gradient-to-r from-sky-500/10 to-indigo-500/10">
        <p className="text-xs font-bold uppercase tracking-wider text-sky-700 dark:text-sky-300">Live Preview</p>
        <p className="text-[10px] text-content-muted">Updates as you edit</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <GlassCard className="overflow-hidden p-0">
          <div className="relative h-36">
            <img src={coverImage} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
              <img src={logoUrl} alt="" className="h-6 mb-2 opacity-90" />
              <p className="text-lg font-black leading-tight">
                {packageInfo?.packageName || draftQuote?.package?.name || 'Your Package'}
              </p>
              <p className="text-xs opacity-90 mt-0.5">
                {packageInfo?.destination || draftQuote?.package?.destination || 'Destination'}
              </p>
            </div>
          </div>
        </GlassCard>

        {draftQuote && (
          <motion.div
            key={JSON.stringify(pricing?.total)}
            initial={{ opacity: 0.6 }}
            animate={{ opacity: 1 }}
            className="rounded-xl border border-subtle overflow-hidden bg-white shadow-sm scale-[0.85] origin-top"
          >
            <QuotePdfPreview quote={draftQuote} />
          </motion.div>
        )}

        {!draftQuote && (
          <GlassCard className="p-6 text-center">
            <p className="text-sm text-content-muted">Select a lead and package to see preview</p>
          </GlassCard>
        )}

        {pricing?.grandTotal > 0 && (
          <GlassCard className="p-4 text-center">
            <p className="text-[10px] uppercase font-bold text-content-muted">Grand Total</p>
            <p className="text-2xl font-black text-emerald-600 metric-tabular">{formatINR(pricing.grandTotal || pricing.total)}</p>
          </GlassCard>
        )}
      </div>
    </div>
  );
}
