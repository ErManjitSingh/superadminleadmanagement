const TZ = 'Asia/Kolkata';

function calendarKey(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function startOfMonth(date = new Date()) {
  const key = calendarKey(date);
  const [y, m] = key.split('-');
  return `${y}-${m}-01`;
}

export const ATTENDANCE_PRESETS = [
  { id: 'today', label: 'Today', short: 'Today' },
  { id: 'yesterday', label: 'Yesterday', short: 'Yesterday' },
  { id: 'last7', label: 'Last 7 Days', short: '7D' },
  { id: 'thisMonth', label: 'This Month', short: 'Month' },
];

export function getRangeForPreset(presetId) {
  const today = new Date();
  const todayKey = calendarKey(today);

  switch (presetId) {
    case 'yesterday': {
      const y = calendarKey(addDays(today, -1));
      return { from: y, to: y, preset: 'yesterday' };
    }
    case 'last7': {
      const from = calendarKey(addDays(today, -6));
      return { from, to: todayKey, preset: 'last7' };
    }
    case 'thisMonth': {
      return { from: startOfMonth(today), to: todayKey, preset: 'thisMonth' };
    }
    case 'today':
    default:
      return { from: todayKey, to: todayKey, preset: 'today' };
  }
}

export function formatRangeLabel(from, to, preset) {
  const fmt = (key) =>
    new Intl.DateTimeFormat('en-IN', {
      timeZone: TZ,
      day: 'numeric',
      month: 'short',
      year: key.slice(0, 4) !== calendarKey().slice(0, 4) ? 'numeric' : undefined,
    }).format(new Date(`${key}T12:00:00+05:30`));

  if (from === to) return fmt(from);
  const presetMeta = ATTENDANCE_PRESETS.find((p) => p.id === preset);
  if (presetMeta && preset !== 'today') {
    return `${presetMeta.label} · ${fmt(from)} – ${fmt(to)}`;
  }
  return `${fmt(from)} – ${fmt(to)}`;
}

export function isSingleDayRange(from, to) {
  return from === to;
}
