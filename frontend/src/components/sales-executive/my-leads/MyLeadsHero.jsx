import { motion } from 'framer-motion';

function FunnelArt() {
  return (
    <svg viewBox="0 0 160 120" className="w-28 h-20 sm:w-36 sm:h-24" aria-hidden>
      <defs>
        <linearGradient id="funnelGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#A78BFA" />
          <stop offset="100%" stopColor="#7C3AED" />
        </linearGradient>
      </defs>
      <path
        d="M28 18h104l-22 38v36l-30 16-30-16V56L28 18z"
        fill="url(#funnelGrad)"
        opacity="0.92"
      />
      <path d="M58 56h44v32l-22 12-22-12V56z" fill="#5B21B6" opacity="0.35" />
      <circle cx="22" cy="28" r="8" fill="#C4B5FD" />
      <circle cx="138" cy="24" r="7" fill="#DDD6FE" />
      <circle cx="148" cy="52" r="6" fill="#A78BFA" />
      <circle cx="18" cy="58" r="5" fill="#EDE9FE" />
      <circle cx="42" cy="12" r="4" fill="#DDD6FE" />
      <text x="18" y="31" textAnchor="middle" fontSize="7" fill="#5B21B6" fontWeight="700">U</text>
      <text x="138" y="27" textAnchor="middle" fontSize="6" fill="#5B21B6" fontWeight="700">A</text>
    </svg>
  );
}

export default function MyLeadsHero({ title, description }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start justify-between gap-4"
    >
      <div className="min-w-0">
        <h1 className="text-2xl sm:text-3xl font-bold text-content-primary tracking-tight">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-content-secondary mt-1 max-w-xl">{description}</p>
        )}
      </div>
      <div className="hidden sm:flex shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-950/40 dark:to-indigo-950/30 border border-violet-100/80 dark:border-violet-800/40 px-3 py-2">
        <FunnelArt />
      </div>
    </motion.div>
  );
}
