import { Phone, FileText, CalendarPlus, MoreHorizontal } from 'lucide-react';
import WhatsAppActionButton from './WhatsAppActionButton';
import EmailActionButton from '../email/EmailActionButton';
import {
  DropdownMenuRoot,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '../ui/dropdown-menu';
import { cn } from '../../lib/utils';

function ActionTile({ icon: Icon, label, onClick, href, className, tone = 'violet' }) {
  const tones = {
    violet: 'text-violet-600 bg-violet-50',
    emerald: 'text-emerald-600 bg-emerald-50',
    orange: 'text-orange-600 bg-orange-50',
    slate: 'text-slate-600 bg-slate-100',
  };

  const inner = (
    <>
      <span className={cn('w-10 h-10 rounded-xl flex items-center justify-center mb-2.5', tones[tone])}>
        <Icon className="w-5 h-5" />
      </span>
      <span className="text-[12px] sm:text-[13px] font-semibold text-slate-700 dark:text-slate-200 text-center leading-tight">
        {label}
      </span>
    </>
  );

  const tileClass = cn(
    'group flex flex-col items-center justify-center min-h-[96px] w-full rounded-2xl border border-slate-200/80 bg-white dark:bg-slate-900 dark:border-slate-700 px-3 py-3 shadow-sm hover:shadow-md hover:border-violet-200 transition-all',
    className
  );

  if (href) {
    return (
      <a href={href} className={tileClass}>
        {inner}
      </a>
    );
  }

  return (
    <button type="button" onClick={onClick} className={tileClass}>
      {inner}
    </button>
  );
}

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
  embedded = false,
}) {
  const phone = lead?.phone;

  return (
    <div className={cn(!embedded && 'mb-5', className)}>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <ActionTile
          icon={Phone}
          label="Call"
          tone="emerald"
          href={phone ? `tel:${phone}` : undefined}
          className={!phone ? 'opacity-50 pointer-events-none' : ''}
        />

        <WhatsAppActionButton
          lead={lead}
          leadId={leadId}
          contactEndpoint={contactEndpoint}
          onContactLogged={onContactLogged}
          variant="tile"
        />

        <EmailActionButton
          lead={lead}
          leadId={leadId}
          emailEndpoint={contactEndpoint}
          onEmailSent={onEmailSent || onContactLogged}
          variant="tile"
          label="Send Email"
        />

        {onCreateQuote && (
          <ActionTile icon={FileText} label="Create Quotation" tone="violet" onClick={onCreateQuote} />
        )}

        {onScheduleFollowUp && (
          <ActionTile icon={CalendarPlus} label="Schedule Follow-up" tone="orange" onClick={onScheduleFollowUp} />
        )}

        <DropdownMenuRoot>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="group flex flex-col items-center justify-center min-h-[96px] w-full rounded-2xl border border-slate-200/80 bg-white dark:bg-slate-900 dark:border-slate-700 px-3 py-3 shadow-sm hover:shadow-md hover:border-violet-200 transition-all"
            >
              <span className="w-10 h-10 rounded-xl flex items-center justify-center mb-2.5 bg-slate-100 text-slate-600">
                <MoreHorizontal className="w-5 h-5" />
              </span>
              <span className="text-[12px] sm:text-[13px] font-semibold text-slate-700 dark:text-slate-200 text-center leading-tight">
                More Actions
              </span>
            </button>
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
