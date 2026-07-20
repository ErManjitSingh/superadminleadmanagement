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
  variant = 'default',
}) {
  const { can } = usePermissions();
  const canSendEmail = can('email', 'send');
  const [open, setOpen] = useState(false);

  if (!canSendEmail) return null;

  const disabled = !lead?.email;
  const sizeClass = size === 'lg' ? 'h-11 px-5 text-sm' : 'h-10 px-4 text-sm';
  const isTile = variant === 'tile';

  return (
    <>
      {isTile ? (
        <button
          type="button"
          disabled={disabled}
          title={disabled ? 'No email on lead' : 'Send Email'}
          onClick={() => setOpen(true)}
          className={`group flex flex-col items-center justify-center min-h-[96px] w-full rounded-2xl border border-slate-200/80 bg-white dark:bg-slate-900 dark:border-slate-700 px-3 py-3 shadow-sm hover:shadow-md hover:border-violet-200 transition-all disabled:opacity-50 ${className}`}
        >
          <span className="w-10 h-10 rounded-xl flex items-center justify-center mb-2.5 bg-sky-50 text-sky-600">
            <Mail className="w-5 h-5" />
          </span>
          {showLabel && (
            <span className="text-[12px] sm:text-[13px] font-semibold text-slate-700 dark:text-slate-200">
              {typeof label === 'string' ? label.replace(/^📧\s*/, '') : 'Send Email'}
            </span>
          )}
        </button>
      ) : (
        <Button
          type="button"
          disabled={disabled}
          title={disabled ? 'No email on lead' : 'Send Email'}
          onClick={() => setOpen(true)}
          variant="default"
          className={`rounded-xl gap-2 font-semibold text-white border-0 bg-green-800 hover:bg-green-700 shadow-sm shadow-green-900/20 ${sizeClass} ${className}`}
        >
          <Mail className="w-4 h-4" />
          {showLabel ? label : null}
        </Button>
      )}

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
