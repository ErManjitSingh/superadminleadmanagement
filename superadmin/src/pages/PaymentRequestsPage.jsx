import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, XCircle, Wallet } from 'lucide-react';
import { superAdminApi } from '../api/superadmin';
import { Card, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { formatDate, formatCurrency } from '../lib/utils';

const STATUS_TABS = [
  { key: 'submitted', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
  { key: '', label: 'All' },
];

const STATUS_STYLES = {
  submitted: 'bg-amber-100 text-amber-700',
  approved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-700',
};

export default function PaymentRequestsPage() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState('submitted');
  const [periodsById, setPeriodsById] = useState({});

  const { data, isLoading } = useQuery({
    queryKey: ['payment-requests', status],
    queryFn: () => superAdminApi.listPaymentRequests(status ? { status } : {}).then((r) => r.data),
  });

  const rows = data?.data || [];

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['payment-requests'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };

  const approveMutation = useMutation({
    mutationFn: ({ id, periods }) => superAdminApi.approvePaymentRequest(id, { periods }),
    onSuccess: invalidate,
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, note }) => superAdminApi.rejectPaymentRequest(id, { note }),
    onSuccess: invalidate,
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900 dark:text-white">
          <Wallet className="h-6 w-6 text-violet-600" /> Payment Requests
        </h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Renewal payments submitted by companies via UPI. Approve to auto-extend their plan.
        </p>
      </div>

      <div className="flex flex-wrap gap-1 border-b border-[var(--border)]">
        {STATUS_TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setStatus(t.key)}
            className={`rounded-t-lg px-4 py-2.5 text-sm font-medium transition ${
              status === t.key
                ? 'bg-white text-violet-700 shadow-sm dark:bg-slate-900'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="py-16 text-center text-[var(--text-muted)]">Loading…</p>
      ) : rows.length === 0 ? (
        <Card className="p-10 text-center text-[var(--text-muted)]">No payment requests here.</Card>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => {
            const periods = periodsById[r._id] ?? 1;
            return (
              <Card key={r._id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <CardTitle className="text-base">{r.companyName || 'Company'}</CardTitle>
                      <Badge className={STATUS_STYLES[r.status] || ''}>{r.status}</Badge>
                    </div>
                    <p className="text-sm text-[var(--text-muted)]">
                      {r.planName || 'Plan'} · {r.billingCycle} · submitted {formatDate(r.createdAt)}
                    </p>
                    <p className="text-sm">
                      Amount: <strong>{formatCurrency(r.amount)}</strong>
                      {r.referenceNumber && (
                        <>
                          {' '}· Ref: <span className="font-mono">{r.referenceNumber}</span>
                        </>
                      )}
                    </p>
                    {r.submittedByEmail && (
                      <p className="text-xs text-[var(--text-muted)]">By {r.submittedByEmail}</p>
                    )}
                    {r.payerNote && <p className="text-xs text-[var(--text-muted)]">Note: {r.payerNote}</p>}
                    {r.status === 'approved' && r.extendedUntil && (
                      <p className="text-xs text-emerald-600">Extended until {formatDate(r.extendedUntil)}</p>
                    )}
                    {r.status === 'rejected' && r.reviewNote && (
                      <p className="text-xs text-red-600">Rejected: {r.reviewNote}</p>
                    )}
                  </div>

                  {r.status === 'submitted' && (
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-[var(--text-muted)]">Periods</span>
                        <input
                          type="number"
                          min="1"
                          max="36"
                          value={periods}
                          onChange={(e) =>
                            setPeriodsById((s) => ({ ...s, [r._id]: e.target.value }))
                          }
                          className="w-16 rounded-lg border border-[var(--border)] bg-transparent px-2 py-1.5 text-sm"
                        />
                      </div>
                      <Button
                        onClick={() => approveMutation.mutate({ id: r._id, periods: Number(periods) })}
                        disabled={approveMutation.isPending}
                      >
                        <CheckCircle2 className="h-4 w-4" /> Approve &amp; Extend
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          const note = window.prompt('Reason for rejection (optional):') ?? '';
                          rejectMutation.mutate({ id: r._id, note });
                        }}
                        disabled={rejectMutation.isPending}
                      >
                        <XCircle className="h-4 w-4" /> Reject
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
