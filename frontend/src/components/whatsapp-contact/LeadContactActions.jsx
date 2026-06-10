import { Phone, FileText } from 'lucide-react';
import { Button } from '../ui/button';
import WhatsAppActionButton from './WhatsAppActionButton';
import EmailActionButton from '../email/EmailActionButton';

export default function LeadContactActions({
  lead,
  leadId,
  contactEndpoint = '/leads',
  onCreateQuote,
  onContactLogged,
  onEmailSent,
  className = '',
}) {
  const phone = lead?.phone;

  return (
    <div className={`rounded-2xl border border-subtle bg-surface/90 backdrop-blur-sm p-4 shadow-sm ${className}`}>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-content-muted mb-3">Contact Customer</p>
      <div className="flex flex-wrap gap-2">
        <a href={phone ? `tel:${phone}` : '#'} className={!phone ? 'pointer-events-none opacity-50' : ''}>
          <Button
            type="button"
            className="rounded-xl gap-2 h-11 px-5 bg-emerald-600 hover:bg-emerald-500 text-white border-0 shadow-md shadow-emerald-600/20"
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
        />

        <EmailActionButton
          lead={lead}
          leadId={leadId}
          emailEndpoint={contactEndpoint}
          onEmailSent={onEmailSent || onContactLogged}
          size="lg"
        />

        {onCreateQuote && (
          <Button
            type="button"
            onClick={onCreateQuote}
            variant="outline"
            className="rounded-xl gap-2 h-11 px-5 text-rose-700 border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 font-medium"
          >
            <FileText className="w-4 h-4" />
            Create Quotation
          </Button>
        )}
      </div>
    </div>
  );
}
