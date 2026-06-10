import { useState } from 'react';
import { Mail } from 'lucide-react';
import { usePermissions } from '../../hooks/usePermissions';
import { Button } from '../ui/button';
import EmailComposerModal from './EmailComposerModal';

export default function EmailActionButton({
  lead,
  leadId,
  emailEndpoint = '/leads',
  quotation = null,
  defaultCategory = 'custom',
  onEmailSent,
  size = 'default',
  showLabel = true,
  label = '📧 Send Email',
  className = '',
}) {
  const { can } = usePermissions();
  const canSendEmail = can('email', 'send');
  const [open, setOpen] = useState(false);

  if (!canSendEmail) return null;

  const disabled = !lead?.email;
  const sizeClass = size === 'lg' ? 'h-11 px-5 text-sm' : 'h-10 px-4 text-sm';

  return (
    <>
      <Button
        type="button"
        disabled={disabled}
        title={disabled ? 'No email on lead' : 'Send Email'}
        onClick={() => setOpen(true)}
        variant="outline"
        className={`rounded-xl gap-2 font-semibold text-sky-800 border-sky-400/50 bg-gradient-to-r from-sky-50 to-indigo-50 hover:from-sky-100 hover:to-indigo-100 shadow-sm shadow-sky-500/10 ${sizeClass} ${className}`}
      >
        <Mail className="w-4 h-4" />
        {showLabel ? label : null}
      </Button>

      <EmailComposerModal
        open={open}
        onClose={() => setOpen(false)}
        lead={lead}
        leadId={leadId}
        emailEndpoint={emailEndpoint}
        quotation={quotation}
        defaultCategory={defaultCategory}
        onSent={onEmailSent}
      />
    </>
  );
}
