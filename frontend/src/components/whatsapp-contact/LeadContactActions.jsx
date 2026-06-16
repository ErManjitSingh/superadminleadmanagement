import { Phone, FileText, CalendarPlus, ChevronDown, MoreHorizontal } from 'lucide-react';
import { Button } from '../ui/button';
import WhatsAppActionButton from './WhatsAppActionButton';
import EmailActionButton from '../email/EmailActionButton';
import {
  DropdownMenuRoot,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '../ui/dropdown-menu';
import { DETAIL_CARD } from '../lead-detail/leadDetailUtils';

export default function LeadContactActions({
  lead,
  leadId,
  contactEndpoint = '/leads',
  onCreateQuote,
  onScheduleFollowUp,
  onContactLogged,
  onEmailSent,
  onChangeStatus,
  className = '',
}) {
  const phone = lead?.phone;

  return (
    <div className={`${DETAIL_CARD} p-4 mb-6 ${className}`}>
      <div className="flex flex-wrap gap-2">
        <a href={phone ? `tel:${phone}` : '#'} className={!phone ? 'pointer-events-none opacity-50' : ''}>
          <Button
            type="button"
            className="rounded-xl gap-2 h-11 px-5 bg-emerald-600 hover:bg-emerald-500 text-white border-0 shadow-sm font-semibold"
          >
            <Phone className="w-4 h-4" />
            Call
          </Button>
        </a>

        <WhatsAppActionButton
          lead={lead}
          leadId={leadId}
          contactEndpoint={contactEndpoint}
          onContactLogged={onContactLogged}
          size="lg"
          className="!rounded-xl !h-11 !px-5 !bg-green-600 hover:!bg-green-500 !text-white !border-0 !shadow-sm !font-semibold"
        />

        <EmailActionButton
          lead={lead}
          leadId={leadId}
          emailEndpoint={contactEndpoint}
          onEmailSent={onEmailSent || onContactLogged}
          size="lg"
          showLabel
          label="Send Email"
          className="!rounded-xl !h-11 !px-5 !bg-blue-600 hover:!bg-blue-500 !text-white !border-0 !shadow-sm !font-semibold"
        />

        {onCreateQuote && (
          <Button
            type="button"
            onClick={onCreateQuote}
            className="rounded-xl gap-2 h-11 px-5 bg-violet-100 hover:bg-violet-200 text-violet-700 border border-violet-200 font-semibold shadow-sm"
          >
            <FileText className="w-4 h-4" />
            Create Quotation
          </Button>
        )}

        {onScheduleFollowUp && (
          <Button
            type="button"
            onClick={onScheduleFollowUp}
            className="rounded-xl gap-2 h-11 px-5 bg-orange-100 hover:bg-orange-200 text-orange-700 border border-orange-200 font-semibold shadow-sm"
          >
            <CalendarPlus className="w-4 h-4" />
            Schedule Follow-up
          </Button>
        )}

        <DropdownMenuRoot>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="rounded-xl gap-2 h-11 px-4 border-slate-200 text-slate-600 font-semibold"
            >
              <MoreHorizontal className="w-4 h-4" />
              More
              <ChevronDown className="w-3.5 h-3.5 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {onChangeStatus && (
              <DropdownMenuItem onClick={onChangeStatus}>Change Status</DropdownMenuItem>
            )}
            <DropdownMenuItem disabled>Export Lead</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenuRoot>
      </div>
    </div>
  );
}
