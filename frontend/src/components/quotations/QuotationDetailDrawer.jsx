import { Download, Mail, MapPin, Phone, User, Users, Calendar, Send, MessageCircle } from 'lucide-react';
import AppDrawer from '../ui/AppDrawer';
import Avatar from '../ui/Avatar';
import QuoteStatusBadge from './QuoteStatusBadge';
import QuotePricingPanel from './QuotePricingPanel';
import QuoteTimeline from './QuoteTimeline';
import { Button } from '../ui/button';
import { formatINR } from './quotationUtils';
import { buildQuotationShareUrl, buildPublicPdfUrl, buildQuotationWhatsAppMessage, shareQuotationWhatsApp } from '../../lib/whatsappContact';
import { toast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

function InfoRow({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2.5 text-sm">
      <Icon className="w-4 h-4 text-content-muted mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-[10px] uppercase font-medium text-content-muted tracking-wide">{label}</p>
        <p className="text-content-primary break-words">{value}</p>
      </div>
    </div>
  );
}

function formatDateTime(value) {
  if (!value) return null;
  return new Date(value).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}

export default function QuotationDetailDrawer({
  quote,
  open,
  onClose,
  readOnly = false,
  onDownloadPdf,
  actions,
}) {
  const { user } = useAuth();

  if (!quote) return null;

  const lead = quote.lead || {};
  const customerPhone = lead.whatsapp || lead.phone;
  const creatorName = quote.createdByExecutive?.name || quote.createdBy?.name || '—';
  const packageName = quote.package?.name || quote.packageSnapshot?.name || 'Custom package';
  const sentEvent = [...(quote.timeline || [])].reverse().find((t) => t.type === 'sent');
  const shareUrl = quote.shareToken ? buildQuotationShareUrl(quote.shareToken) : '';

  const handleWhatsApp = () => {
    if (!customerPhone) {
      toast.error('Customer phone number missing on this lead.');
      return;
    }
    const message = buildQuotationWhatsAppMessage({
      lead,
      packageName,
      destination: lead.destination || quote.packageInfo?.destination,
      duration: quote.packageInfo?.duration || quote.packageSnapshot?.duration,
      total: quote.pricing?.total,
      quoteNumber: quote.quoteNumber,
      executiveName: user?.name,
      shareUrl,
      pdfUrl: quote.pdfUrl ? buildPublicPdfUrl(quote.pdfUrl) : '',
    });
    shareQuotationWhatsApp({
      phone: customerPhone,
      message,
      pdfUrl: quote.pdfUrl ? buildPublicPdfUrl(quote.pdfUrl) : '',
    });
  };

  return (
    <AppDrawer open={open} onClose={onClose} className="max-w-xl overflow-y-auto">
      <div className="p-5 border-b border-subtle bg-gradient-to-r from-sky-500/10 to-indigo-500/10">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-mono text-sky-600 font-semibold text-sm">{quote.quoteNumber}</p>
            <h3 className="text-lg font-bold text-content-primary truncate">{lead.name || 'Customer'}</h3>
            <p className="text-xs text-content-muted mt-0.5">{packageName}</p>
          </div>
          <QuoteStatusBadge status={quote.status} />
        </div>
      </div>

      <div className="p-5 space-y-6">
        <section className="space-y-3">
          <h4 className="text-xs font-medium uppercase tracking-wider text-content-muted">Customer (sent to)</h4>
          <div className="rounded-xl border border-subtle bg-surface-elevated/40 p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Avatar name={lead.name} size="md" />
              <div>
                <p className="font-semibold text-content-primary">{lead.name || '—'}</p>
                <p className="text-xs text-content-muted">{lead.destination || '—'}</p>
              </div>
            </div>
            <InfoRow icon={Phone} label="Phone" value={lead.phone} />
            <InfoRow icon={Mail} label="Email" value={lead.email} />
            <InfoRow icon={MapPin} label="Destination" value={lead.destination} />
            <InfoRow icon={Calendar} label="Travel date" value={lead.travelDate ? new Date(lead.travelDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : null} />
          </div>
        </section>

        <section className="space-y-3">
          <h4 className="text-xs font-medium uppercase tracking-wider text-content-muted">Who created & handled</h4>
          <div className="rounded-xl border border-subtle bg-surface-elevated/40 p-4 grid sm:grid-cols-2 gap-3">
            <InfoRow icon={User} label="Created by" value={creatorName} />
            <InfoRow icon={Users} label="Lead executive" value={lead.assignedTo?.name || quote.createdByExecutive?.name} />
            <InfoRow icon={User} label="Team leader" value={quote.teamLeader?.name} />
            <InfoRow icon={User} label="Approved by" value={quote.approvedBy?.name} />
            <InfoRow icon={Calendar} label="Created on" value={formatDateTime(quote.createdAt)} />
            <InfoRow icon={Send} label="Sent to customer" value={formatDateTime(quote.sentAt) || (sentEvent ? formatDateTime(sentEvent.date) : null)} />
          </div>
        </section>

        <section className="space-y-3">
          <h4 className="text-xs font-medium uppercase tracking-wider text-content-muted">Package & amount</h4>
          <div className="rounded-xl border border-subtle bg-surface-elevated/40 p-4 space-y-2">
            <p className="text-sm font-medium text-content-primary">{packageName}</p>
            {quote.customizations && (
              <p className="text-xs text-content-secondary whitespace-pre-wrap">{quote.customizations}</p>
            )}
            <p className="text-xl font-bold text-brand-600 metric-tabular pt-1">{formatINR(quote.pricing?.total)}</p>
          </div>
          <QuotePricingPanel pricing={quote.pricing} readOnly />
        </section>

        {quote.timeline?.length > 0 && (
          <section>
            <h4 className="text-xs font-medium uppercase tracking-wider text-content-muted mb-3">Activity timeline</h4>
            <QuoteTimeline timeline={quote.timeline} />
          </section>
        )}

        <div className="flex flex-wrap gap-2 pt-1">
          {onDownloadPdf && (
            <Button onClick={onDownloadPdf} variant="sky" className="rounded-xl gap-2 flex-1">
              <Download className="w-4 h-4" /> View PDF
            </Button>
          )}
          {customerPhone && (
            <Button
              type="button"
              onClick={handleWhatsApp}
              className="rounded-xl gap-2 flex-1 bg-[#25D366] hover:bg-[#1ebe5d] text-white border-0"
            >
              <MessageCircle className="w-4 h-4" /> WhatsApp
            </Button>
          )}
          {!readOnly && actions}
        </div>
      </div>
    </AppDrawer>
  );
}
