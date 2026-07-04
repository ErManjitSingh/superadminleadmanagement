import { useState } from 'react';
import { Copy, Link2, Mail, MessageCircle, RefreshCw } from 'lucide-react';
import PageHeader from '../ui/PageHeader';
import { Button } from '../ui/button';
import { FilterChip, LinkStatusBadge } from './paymentsUi';
import { DEMO_PAYMENT_LINKS } from './paymentsDemoData';
import { formatDate, formatINRFull } from './paymentsUtils';

const GATEWAYS = ['all', 'Razorpay', 'Cashfree', 'Stripe', 'Manual Bank', 'UPI QR'];

export default function PaymentLinksPage() {
  const [gateway, setGateway] = useState('all');
  const [copiedId, setCopiedId] = useState(null);

  const filtered = gateway === 'all' ? DEMO_PAYMENT_LINKS : DEMO_PAYMENT_LINKS.filter((l) => l.gateway === gateway);

  const copyLink = async (link) => {
    try {
      await navigator.clipboard.writeText(link.url);
      setCopiedId(link.id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payment Links"
        description="Secure links for Razorpay, Cashfree, Stripe, bank, and UPI QR"
        breadcrumbs={['Payments', 'Payment Links']}
        actions={
          <Button className="gap-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white">
            <Link2 className="h-4 w-4" /> Create Link
          </Button>
        }
      />

      <div className="flex flex-wrap gap-2">
        {GATEWAYS.map((g) => (
          <FilterChip key={g} active={gateway === g} onClick={() => setGateway(g)}>
            {g === 'all' ? 'All gateways' : g}
          </FilterChip>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((link) => (
          <article key={link.id} className="rounded-2xl border border-subtle bg-surface p-5 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-violet-600 dark:text-violet-400">{link.gateway}</p>
                <h3 className="mt-0.5 font-bold text-content-primary">{link.customer}</h3>
              </div>
              <LinkStatusBadge status={link.status} />
            </div>
            <p className="mt-4 text-2xl font-black metric-tabular text-content-primary">{formatINRFull(link.amount)}</p>
            <p className="mt-1 text-xs text-content-muted">Expires {formatDate(link.expiry)}</p>
            <div className="mt-3 truncate rounded-xl bg-surface-muted/50 px-3 py-2 font-mono text-[11px] text-content-secondary">
              {link.url}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button size="sm" variant="outline" className="gap-1.5" onClick={() => copyLink(link)}>
                <Copy className="h-3.5 w-3.5" /> {copiedId === link.id ? 'Copied' : 'Copy'}
              </Button>
              <Button size="sm" variant="outline" className="gap-1.5 text-emerald-600">
                <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
              </Button>
              <Button size="sm" variant="outline" className="gap-1.5">
                <Mail className="h-3.5 w-3.5" /> Email
              </Button>
              <Button size="sm" variant="outline" className="gap-1.5">
                <RefreshCw className="h-3.5 w-3.5" /> Regenerate
              </Button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
