import { motion, AnimatePresence } from 'framer-motion';
import { Cloud, CloudOff, Loader2 } from 'lucide-react';

export default function WizardDraftIndicator({ status, lastSaved }) {
  const config = {
    saving: { icon: Loader2, text: 'Saving draft...', class: 'text-amber-600 bg-amber-500/10 border-amber-500/20', spin: true },
    saved: { icon: Cloud, text: 'Draft saved', class: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20', spin: false },
    idle: { icon: CloudOff, text: 'Auto-save enabled', class: 'text-content-muted bg-surface-elevated border-subtle', spin: false },
  }[status] || config.idle;

  const Icon = config.icon;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={status}
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${config.class}`}
      >
        <Icon className={`w-3.5 h-3.5 ${config.spin ? 'animate-spin' : ''}`} />
        {config.text}
        {lastSaved && status === 'saved' && (
          <span className="text-content-muted font-normal">· {lastSaved}</span>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
