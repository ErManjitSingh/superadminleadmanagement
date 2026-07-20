/** Dark navy sidebar with blue active states */
const DARK_NAVY = {
  brandGradient: 'from-orange-500 to-orange-600',
  brandShadow: 'shadow-orange-500/40',
  brandGlow: 'bg-orange-400/20',
  titleOrange: 'text-white',
  titleGradient: 'text-white',
  indicator: 'bg-blue-400',
  iconActive: 'text-white',
  iconBoxActive: 'bg-transparent',
  iconInactive: 'text-slate-400 group-hover:text-slate-200',
  itemActive: 'bg-blue-500 text-white shadow-md shadow-blue-500/30',
  groupActive: 'text-white bg-white/[0.06]',
  searchFocus: 'focus:ring-blue-500/30 focus:border-blue-500/40',
  searchIconFocus: 'group-focus-within:text-slate-400',
  avatarGradient: 'from-orange-500 to-orange-600',
};

export const SIDEBAR_ACCENTS = {
  brand: {
    ...DARK_NAVY,
    headerBg: 'from-transparent to-transparent',
    headerBorder: 'border-white/10',
    titleGradient: 'text-white',
    subtitleBg: 'bg-white/10',
    subtitleText: 'text-slate-400',
    subtitleBorder: 'border-white/10',
    overlay: 'from-transparent to-transparent',
  },
  violet: {
    ...DARK_NAVY,
    itemActive: 'bg-violet-600 text-white shadow-md shadow-violet-500/30',
    indicator: 'bg-violet-400',
    avatarGradient: 'from-violet-500 to-indigo-600',
    headerBg: 'from-transparent to-transparent',
    headerBorder: 'border-white/10',
    titleGradient: 'text-white',
    subtitleBg: 'bg-violet-500/15',
    subtitleText: 'text-violet-300',
    subtitleBorder: 'border-violet-500/25',
    overlay: 'from-transparent to-transparent',
  },
  teal: {
    ...DARK_NAVY,
    headerBg: 'from-transparent to-transparent',
    headerBorder: 'border-white/10',
    titleGradient: 'text-white',
    subtitleBg: 'bg-teal-500/15',
    subtitleText: 'text-teal-300',
    subtitleBorder: 'border-teal-500/25',
    overlay: 'from-transparent to-transparent',
  },
  sky: {
    ...DARK_NAVY,
    headerBg: 'from-transparent to-transparent',
    headerBorder: 'border-white/10',
    titleGradient: 'text-white',
    subtitleBg: 'bg-sky-500/15',
    subtitleText: 'text-sky-300',
    subtitleBorder: 'border-sky-500/25',
    overlay: 'from-transparent to-transparent',
  },
  amber: {
    ...DARK_NAVY,
    headerBg: 'from-transparent to-transparent',
    headerBorder: 'border-white/10',
    titleGradient: 'text-white',
    subtitleBg: 'bg-amber-500/15',
    subtitleText: 'text-amber-300',
    subtitleBorder: 'border-amber-500/25',
    overlay: 'from-transparent to-transparent',
  },
};

export function getSidebarAccent(key = 'brand') {
  return SIDEBAR_ACCENTS[key] || SIDEBAR_ACCENTS.brand;
}
