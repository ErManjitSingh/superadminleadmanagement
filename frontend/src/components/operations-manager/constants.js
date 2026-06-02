export const BOOKING_STATUS_CONFIG = {
  pending: { label: 'Pending', className: 'bg-amber-500/15 text-amber-700 ring-amber-400/30' },
  confirmed: { label: 'Confirmed', className: 'bg-teal-500/15 text-teal-700 ring-teal-400/30' },
  active: { label: 'Active Trip', className: 'bg-emerald-500/15 text-emerald-700 ring-emerald-400/30' },
  completed: { label: 'Completed', className: 'bg-slate-500/15 text-slate-600 ring-slate-400/30' },
};

export const CONFIRMATION_CONFIG = {
  pending: { label: 'Pending', className: 'bg-amber-500/15 text-amber-700' },
  confirmed: { label: 'Confirmed', className: 'bg-emerald-500/15 text-emerald-700' },
};

export const TICKET_STATUS_CONFIG = {
  open: { label: 'Open', className: 'bg-rose-500/15 text-rose-700' },
  in_progress: { label: 'In Progress', className: 'bg-amber-500/15 text-amber-700' },
  resolved: { label: 'Resolved', className: 'bg-emerald-500/15 text-emerald-700' },
};

export const VOUCHER_STATUS_CONFIG = {
  draft: { label: 'Draft', className: 'bg-slate-500/15 text-slate-600' },
  sent: { label: 'Sent', className: 'bg-teal-500/15 text-teal-700' },
  redeemed: { label: 'Redeemed', className: 'bg-emerald-500/15 text-emerald-700' },
};

export const VENDOR_TYPES = [
  { value: 'hotel', label: 'Hotel' },
  { value: 'cab', label: 'Cab / Transport' },
  { value: 'activity', label: 'Activity' },
];
