import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Send, FileText, CheckCircle2 } from 'lucide-react';
import API from '../../api/axios';
import { unwrapList } from '../../utils/apiHelpers';
import PageHeader from '../ui/PageHeader';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';
import { formatCurrency, QUOTE_STATUS_STYLES } from './executiveUtils';

const STATUS_TABS = ['all', 'draft', 'pending_approval', 'approved', 'sent', 'rejected'];

const STATUS_LABELS = {
  all: 'All',
  draft: 'Draft',
  pending_approval: 'Pending Approval',
  approved: 'Approved',
  sent: 'Sent',
  rejected: 'Rejected',
};

export default function ExecutiveQuotationsPage() {
  const location = useLocation();
  const [quotes, setQuotes] = useState([]);
  const [status, setStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [flash, setFlash] = useState(location.state?.message || '');

  const fetchQuotes = () => {
    setLoading(true);
    API.get('/sales-executive/quotations', { params: { page: 1, limit: 100, ...(status === 'all' ? {} : { status }) } })
      .then((r) => setQuotes(unwrapList(r.data)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchQuotes();
  }, [status]);

  useEffect(() => {
    if (location.state?.message) {
      setFlash(location.state.message);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleSend = async (id) => {
    try {
      await API.put(`/sales-executive/quotations/${id}`, { action: 'send' });
      fetchQuotes();
    } catch (err) {
      /* toast via axios */
    }
  };

  const handleSubmit = async (id) => {
    try {
      await API.put(`/sales-executive/quotations/${id}`, { action: 'submit' });
      fetchQuotes();
    } catch (err) {
      /* toast via axios */
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quotations"
        description="Your quotes — submitted to Team Leader for approval before sending to customers"
        breadcrumbs={['Sales Executive', 'Quotations']}
      />

      {flash && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {flash}
          <button type="button" className="ml-auto text-emerald-600 text-xs font-semibold" onClick={() => setFlash('')}>
            Dismiss
          </button>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatus(s)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors',
              status === s
                ? 'bg-sky-500/15 text-sky-700 ring-1 ring-sky-400/30'
                : 'text-content-muted hover:text-content-primary hover:bg-surface-elevated'
            )}
          >
            {STATUS_LABELS[s] || s}
          </button>
        ))}
        <Link to="/sales-executive/quotations/new">
          <Button size="sm" className="ml-auto">
            <FileText className="w-3.5 h-3.5 mr-1" /> Create Quotation
          </Button>
        </Link>
      </div>

      <div className="rounded-2xl border border-subtle bg-surface/80 backdrop-blur-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-subtle bg-surface-elevated/50">
                {['Quote #', 'Customer', 'Destination', 'Amount', 'Status', 'Team Leader', 'Actions'].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-content-muted whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-subtle">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-content-muted">
                    Loading…
                  </td>
                </tr>
              ) : quotes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-content-muted">
                    No quotations found
                  </td>
                </tr>
              ) : (
                quotes.map((q, i) => (
                  <motion.tr
                    key={q._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="hover:bg-sky-500/[0.03]"
                  >
                    <td className="px-4 py-3.5 font-mono text-xs font-semibold text-sky-600">{q.quoteNumber}</td>
                    <td className="px-4 py-3.5 font-medium text-content-primary">{q.lead?.name}</td>
                    <td className="px-4 py-3.5 text-content-secondary">{q.lead?.destination}</td>
                    <td className="px-4 py-3.5 font-bold tabular-nums">{formatCurrency(q.pricing?.total)}</td>
                    <td className="px-4 py-3.5">
                      <span
                        className={cn(
                          'text-[10px] font-bold uppercase px-2 py-1 rounded-full ring-1 ring-inset',
                          QUOTE_STATUS_STYLES[q.status] || QUOTE_STATUS_STYLES.draft
                        )}
                      >
                        {(q.status || 'draft').replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-content-secondary">{q.teamLeader?.name || '—'}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-wrap gap-1">
                        {q.status === 'draft' && (
                          <Button size="sm" variant="outline" onClick={() => handleSubmit(q._id)}>
                            Submit for Approval
                          </Button>
                        )}
                        {q.status === 'approved' && (
                          <Button size="sm" variant="outline" onClick={() => handleSend(q._id)}>
                            <Send className="w-3 h-3 mr-1" /> Send to Customer
                          </Button>
                        )}
                        {q.status === 'pending_approval' && (
                          <span className="text-xs text-amber-600 font-medium px-2 py-1">Awaiting TL approval</span>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
