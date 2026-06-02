/** Shared orange styling for sidebar brand + nav icons */
const ORANGE = {
  brandGradient: 'from-orange-500 via-orange-600 to-amber-600',
  brandShadow: 'shadow-orange-500/30',
  brandGlow: 'bg-orange-400/30',
  titleOrange: 'text-orange-600 dark:text-orange-400',
  indicator: 'bg-orange-500',
  iconActive: 'text-orange-600 dark:text-orange-400',
  iconBoxActive: 'bg-orange-500/15 ring-1 ring-orange-500/25',
  iconInactive:
    'bg-orange-500/10 text-orange-500 dark:text-orange-400 group-hover:bg-orange-500/18 group-hover:text-orange-600 dark:group-hover:text-orange-300',
  itemActive: 'bg-orange-500/12 text-orange-700 dark:text-orange-300 shadow-sm shadow-orange-500/8',
  groupActive: 'bg-orange-500/[0.08] text-sidebar-text',
  searchFocus: 'focus:ring-orange-500/25 focus:border-orange-500/40',
  searchIconFocus: 'group-focus-within:text-orange-500',
  avatarGradient: 'from-orange-500 to-amber-600',
};

export const SIDEBAR_ACCENTS = {
  brand: {
    ...ORANGE,
    headerBg: 'from-orange-500/14 via-amber-500/10 to-orange-600/14',
    headerBorder: 'border-orange-500/20',
    titleGradient: 'from-orange-600 via-orange-500 to-amber-600 dark:from-orange-400 dark:via-orange-400 dark:to-amber-400',
    subtitleBg: 'bg-gradient-to-r from-orange-500/15 to-amber-500/15',
    subtitleText: 'text-orange-700 dark:text-orange-300',
    subtitleBorder: 'border-orange-500/25',
    overlay: 'from-orange-500/[0.05] via-transparent to-amber-500/[0.04]',
  },
  violet: {
    ...ORANGE,
    headerBg: 'from-violet-500/14 via-purple-500/10 to-fuchsia-500/14',
    headerBorder: 'border-violet-500/20',
    titleGradient: 'from-violet-600 via-purple-600 to-fuchsia-600 dark:from-violet-400 dark:via-purple-400 dark:to-fuchsia-400',
    subtitleBg: 'bg-gradient-to-r from-violet-500/15 to-fuchsia-500/15',
    subtitleText: 'text-violet-700 dark:text-violet-300',
    subtitleBorder: 'border-violet-500/25',
    overlay: 'from-violet-500/[0.06] via-transparent to-purple-500/[0.04]',
  },
  teal: {
    ...ORANGE,
    headerBg: 'from-teal-500/14 via-emerald-500/10 to-cyan-500/14',
    headerBorder: 'border-teal-500/20',
    titleGradient: 'from-teal-600 via-emerald-600 to-cyan-600 dark:from-teal-400 dark:via-emerald-400 dark:to-cyan-400',
    subtitleBg: 'bg-gradient-to-r from-teal-500/15 to-emerald-500/15',
    subtitleText: 'text-teal-700 dark:text-teal-300',
    subtitleBorder: 'border-teal-500/25',
    overlay: 'from-teal-500/[0.06] via-transparent to-emerald-500/[0.04]',
  },
  sky: {
    ...ORANGE,
    headerBg: 'from-sky-500/14 via-blue-500/10 to-indigo-500/14',
    headerBorder: 'border-sky-500/20',
    titleGradient: 'from-sky-600 via-blue-600 to-indigo-600 dark:from-sky-400 dark:via-blue-400 dark:to-indigo-400',
    subtitleBg: 'bg-gradient-to-r from-sky-500/15 to-blue-500/15',
    subtitleText: 'text-sky-700 dark:text-sky-300',
    subtitleBorder: 'border-sky-500/25',
    overlay: 'from-sky-500/[0.06] via-transparent to-blue-500/[0.04]',
  },
  amber: {
    ...ORANGE,
    headerBg: 'from-amber-500/14 via-orange-500/10 to-rose-500/14',
    headerBorder: 'border-amber-500/20',
    titleGradient: 'from-amber-600 via-orange-600 to-rose-600 dark:from-amber-400 dark:via-orange-400 dark:to-rose-400',
    subtitleBg: 'bg-gradient-to-r from-amber-500/15 to-orange-500/15',
    subtitleText: 'text-amber-700 dark:text-amber-300',
    subtitleBorder: 'border-amber-500/25',
    overlay: 'from-amber-500/[0.06] via-transparent to-orange-500/[0.04]',
  },
};

export function getSidebarAccent(key = 'brand') {
  return SIDEBAR_ACCENTS[key] || SIDEBAR_ACCENTS.brand;
}
