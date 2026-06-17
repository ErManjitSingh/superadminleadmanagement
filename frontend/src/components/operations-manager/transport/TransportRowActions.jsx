import { MoreHorizontal, Pencil } from 'lucide-react';
import {
  DropdownMenuRoot,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '../../ui/dropdown-menu';
import { CAB_STATUS_LABELS } from './transportListUtils';
import { cn } from '../../../lib/utils';

export default function TransportRowActions() {
  return (
    <div className="flex items-center justify-end gap-1">
      <button
        type="button"
        className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-subtle bg-white text-content-muted hover:text-blue-600 hover:border-blue-200 transition-colors"
        aria-label="Edit vehicle"
      >
        <Pencil className="w-3.5 h-3.5" />
      </button>
      <DropdownMenuRoot>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-subtle bg-white text-content-muted hover:text-content-primary hover:bg-slate-50 transition-colors"
            aria-label="Vehicle actions"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem className="cursor-pointer">View Details</DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer">Assign to Booking</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenuRoot>
    </div>
  );
}

export function VehicleTypeBadge({ type }) {
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
      {type || 'SUV'}
    </span>
  );
}

const STATUS_STYLES = {
  available: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  on_trip: 'bg-blue-50 text-blue-700 border-blue-100',
  maintenance: 'bg-orange-50 text-orange-700 border-orange-100',
  unavailable: 'bg-slate-100 text-slate-600 border-slate-200',
  booked: 'bg-violet-50 text-violet-700 border-violet-100',
  cancelled: 'bg-rose-50 text-rose-700 border-rose-100',
};

export function TransportStatusBadge({ status = 'available' }) {
  const label = CAB_STATUS_LABELS[status]
    || (status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Available');

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-semibold border',
        STATUS_STYLES[status] || STATUS_STYLES.available,
      )}
    >
      {label}
    </span>
  );
}
