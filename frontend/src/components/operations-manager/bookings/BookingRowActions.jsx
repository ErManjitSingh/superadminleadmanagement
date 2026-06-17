import { Link } from 'react-router-dom';
import { Eye, MoreHorizontal } from 'lucide-react';
import {
  DropdownMenuRoot,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '../../ui/dropdown-menu';

export default function BookingRowActions({ bookingId }) {
  return (
    <DropdownMenuRoot>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-content-muted hover:text-content-primary hover:bg-slate-100 transition-colors"
          aria-label="Booking actions"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem asChild>
          <Link to={`/operations-manager/booking/${bookingId}`} className="gap-2 cursor-pointer">
            <Eye className="w-4 h-4" />
            View Booking
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenuRoot>
  );
}
