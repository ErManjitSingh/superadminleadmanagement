import { useEffect, useState } from 'react';
import { Paperclip, Send, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import AppModal from '../ui/AppModal';
import { Button } from '../ui/button';
import { fetchEmailTemplates, sendLeadEmail } from '../../services/emailApi';
import { renderEmailTemplate, filesToAttachments, buildQuotationHtmlAttachment } from '../../lib/emailContact';

const CATEGORY_LABELS = {
  quotation: 'Quotation',
  follow_up: 'Follow-up',
  booking_confirmation: 'Booking Confirmation',
  payment_confirmation: 'Payment Confirmation',
  welcome: 'Welcome',
  reactivation: 'Reactivation',
  custom: 'Custom',
};

export default function EmailComposerModal({
  open,
  onClose,
  lead,
  leadId,
  emailEndpoint = '/leads',
  quotation = null,
  defaultCategory = 'custom',
  onSent,
}) {
  const { user } = useAuth();
  const [templates, setTemplates] = useState([]);
  const [templateId, setTemplateId] = useState('');
  const [category, setCategory] = useState(defaultCategory);
  const [to, setTo] = useState('');
  const [cc, setCc] = useState('');
  const [bcc, setBcc] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [files, setFiles] = useState([]);
  const [attachQuotation, setAttachQuotation] = useState(!!quotation);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTo(lead?.email || '');
    setCategory(defaultCategory);
    setAttachQuotation(!!quotation);
    setLoading(true);
    fetchEmailTemplates()
      .then((rows) => setTemplates((rows || []).filter((t) => t.enabled !== false)))
      .catch(() => setTemplates([]))
      .finally(() => setLoading(false));
  }, [open, lead?.email, defaultCategory, quotation]);

  const applyTemplate = (id) => {
    setTemplateId(id);
    const template = templates.find((t) => t._id === id);
    if (!template) return;
    setCategory(template.category || 'custom');
    const extras = {
      executiveName: user?.name,
      quotationNumber: quotation?.quoteNumber,
      amount: quotation?.totalAmount ?? quotation?.grandTotal ?? lead?.budget,
    };
    setSubject(renderEmailTemplate(template.subject, lead, extras));
    setMessage(renderEmailTemplate(template.body, lead, extras));
  };

  const handleSend = async () => {
    if (!leadId || !to.trim()) return;
    setSubmitting(true);
    try {
      const attachments = await filesToAttachments(files);
      if (attachQuotation && quotation) {
        const qa = buildQuotationHtmlAttachment(quotation);
        if (qa) attachments.push(qa);
      }

      await sendLeadEmail(
        leadId,
        {
          to,
          cc,
          bcc,
          subject,
          message,
          category,
          templateId: templateId || undefined,
          quotationId: quotation?._id,
          quotationNumber: quotation?.quoteNumber,
          amount: quotation?.totalAmount ?? quotation?.grandTotal ?? lead?.budget,
          attachments,
        },
        emailEndpoint
      );

      onSent?.();
      onClose();
      setFiles([]);
      setCc('');
      setBcc('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppModal open={open} onClose={() => !submitting && onClose()} size="lg" className="p-0 overflow-hidden">
      <div className="p-5 border-b border-subtle bg-gradient-to-r from-sky-500/10 to-indigo-500/5">
        <h3 className="text-lg font-bold text-content-primary">Send Email</h3>
        <p className="text-sm text-content-muted mt-1">From sales@unotrips.com · Queued and sent asynchronously</p>
      </div>

      <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="block text-sm sm:col-span-2">
            <span className="text-content-muted text-xs font-medium uppercase tracking-wide">Template</span>
            <select
              value={templateId}
              onChange={(e) => applyTemplate(e.target.value)}
              className="mt-1 w-full rounded-xl border border-subtle bg-surface px-3 py-2.5 text-sm"
              disabled={loading}
            >
              <option value="">Choose template (optional)</option>
              {templates.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name} — {CATEGORY_LABELS[t.category] || t.category}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm sm:col-span-2">
            <span className="text-content-muted text-xs font-medium uppercase tracking-wide">To *</span>
            <input
              type="email"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="mt-1 w-full rounded-xl border border-subtle bg-surface px-3 py-2.5 text-sm"
              placeholder="customer@email.com"
            />
          </label>

          <label className="block text-sm">
            <span className="text-content-muted text-xs font-medium uppercase tracking-wide">CC</span>
            <input
              type="text"
              value={cc}
              onChange={(e) => setCc(e.target.value)}
              className="mt-1 w-full rounded-xl border border-subtle bg-surface px-3 py-2.5 text-sm"
              placeholder="email1, email2"
            />
          </label>

          <label className="block text-sm">
            <span className="text-content-muted text-xs font-medium uppercase tracking-wide">BCC</span>
            <input
              type="text"
              value={bcc}
              onChange={(e) => setBcc(e.target.value)}
              className="mt-1 w-full rounded-xl border border-subtle bg-surface px-3 py-2.5 text-sm"
              placeholder="email1, email2"
            />
          </label>

          <label className="block text-sm sm:col-span-2">
            <span className="text-content-muted text-xs font-medium uppercase tracking-wide">Subject *</span>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="mt-1 w-full rounded-xl border border-subtle bg-surface px-3 py-2.5 text-sm"
            />
          </label>

          <label className="block text-sm sm:col-span-2">
            <span className="text-content-muted text-xs font-medium uppercase tracking-wide">Message *</span>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={8}
              className="mt-1 w-full rounded-xl border border-subtle bg-surface px-3 py-2.5 text-sm resize-y"
            />
          </label>

          <div className="sm:col-span-2 space-y-2">
            {quotation && (
              <label className="flex items-center gap-2 text-sm text-content-secondary">
                <input
                  type="checkbox"
                  checked={attachQuotation}
                  onChange={(e) => setAttachQuotation(e.target.checked)}
                />
                Attach quotation {quotation.quoteNumber ? `(${quotation.quoteNumber})` : ''}
              </label>
            )}
            <label className="inline-flex items-center gap-2 text-sm font-medium text-sky-700 cursor-pointer">
              <Paperclip className="w-4 h-4" />
              Add attachments
              <input
                type="file"
                multiple
                className="hidden"
                onChange={(e) => setFiles(Array.from(e.target.files || []))}
              />
            </label>
            {files.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {files.map((f) => (
                  <span key={f.name} className="text-xs px-2 py-1 rounded-lg bg-surface-elevated border border-subtle">
                    {f.name}
                  </span>
                ))}
                <button type="button" onClick={() => setFiles([])} className="text-xs text-red-600">
                  Clear
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="px-5 py-4 border-t border-subtle flex justify-end gap-2 bg-surface-elevated/40">
        <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button
          type="button"
          onClick={handleSend}
          disabled={submitting || !to.trim() || !subject.trim() || !message.trim()}
          className="gap-2 bg-sky-600 hover:bg-sky-500 text-white"
        >
          <Send className="w-4 h-4" />
          {submitting ? 'Sending…' : 'Send'}
        </Button>
      </div>
    </AppModal>
  );
}
