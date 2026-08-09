import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Search,
  UserRoundCheck,
  X,
  XCircle,
} from 'lucide-react';
import { fetchApprovals, fetchMyWorkAccess, reviewApproval } from './api/workApi';

function formatDate(value) {
  return value ? new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value)) : '—';
}

function ReviewModal({ approval, decision, onClose, onReviewed }) {
  const [note, setNote] = useState('');
  const mutation = useMutation({
    mutationFn: () => reviewApproval(approval._id, { decision, note }),
    onSuccess: onReviewed,
  });
  const isReject = decision === 'rejected';
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/50 sm:items-center sm:p-5">
      <button className="absolute inset-0" onClick={onClose} aria-label="Close review" />
      <div className="relative w-full rounded-t-2xl border border-subtle bg-surface sm:max-w-lg sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-subtle px-5 py-4">
          <div><h2 className="font-bold">{isReject ? 'Request changes' : 'Approve task'}</h2><p className="mt-1 text-xs text-content-tertiary">{approval.taskId?.key} · Revision {approval.revision}</p></div>
          <button onClick={onClose} className="rounded-lg p-2 text-content-tertiary"><X className="h-4 w-4" /></button>
        </div>
        <form onSubmit={(event) => { event.preventDefault(); mutation.mutate(); }} className="p-5">
          <p className="text-sm font-semibold">{approval.taskId?.title}</p>
          <label className="mt-5 block">
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-content-tertiary">{isReject ? 'Reason for rejection' : 'Review note (optional)'}</span>
            <textarea autoFocus rows={4} required={isReject} minLength={isReject ? 2 : 0} maxLength={5000} value={note} onChange={(event) => setNote(event.target.value)} className="w-full resize-none rounded-xl border border-subtle bg-surface px-3 py-2.5 text-sm outline-none focus:border-emerald-600" placeholder={isReject ? 'Explain exactly what needs to change' : 'Add an approval note'} />
          </label>
          {mutation.isError && <p className="mt-3 text-sm text-red-600">{mutation.error?.response?.data?.message || 'Review could not be saved.'}</p>}
          <div className="mt-6 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="rounded-xl border border-subtle px-4 py-2.5 text-sm font-semibold">Cancel</button>
            <button disabled={mutation.isPending || (isReject && note.trim().length < 2)} className={`rounded-xl px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50 ${isReject ? 'bg-red-600' : 'bg-emerald-700'}`}>{mutation.isPending ? 'Saving…' : isReject ? 'Reject with reason' : 'Approve task'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ApprovalCenterPage() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState('pending');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [review, setReview] = useState(null);
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);
  const accessQuery = useQuery({ queryKey: ['work-access-me'], queryFn: fetchMyWorkAccess, staleTime: 300000 });
  const approvalsQuery = useQuery({
    queryKey: ['approvals', { status, search }],
    queryFn: () => fetchApprovals({ status, search: search || undefined, limit: 100 }),
  });
  const canApprove = accessQuery.data?.user?.workAccess?.permissions?.approveTasks;
  const approvals = approvalsQuery.data?.data || [];

  return (
    <>
      <div>
        <p className="text-sm font-semibold text-emerald-700">Quality control</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Approval Center</h1>
        <p className="mt-2 text-sm text-content-secondary">{canApprove ? 'Review submitted work, approve delivery, or return it with a clear reason.' : 'Track the complete review history for work you submitted.'}</p>
      </div>
      <div className="mt-6 grid gap-3 rounded-2xl border border-subtle bg-surface p-3 sm:grid-cols-[1fr_auto]">
        <label className="flex h-11 items-center gap-2 rounded-xl border border-subtle bg-surface-app px-3"><Search className="h-4 w-4 text-content-tertiary" /><input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} className="min-w-0 flex-1 bg-transparent text-sm outline-none" placeholder="Search task title or key" /></label>
        <div className="flex overflow-x-auto rounded-xl border border-subtle p-1">
          {[
            ['pending', 'Pending'],
            ['approved', 'Approved'],
            ['rejected', 'Rejected'],
          ].map(([value, label]) => <button key={value} onClick={() => setStatus(value)} className={`rounded-lg px-3 py-2 text-xs font-bold ${status === value ? 'bg-emerald-800 text-white' : 'text-content-secondary hover:bg-surface-app'}`}>{label}</button>)}
        </div>
      </div>
      {approvalsQuery.isLoading ? (
        <div className="mt-6 space-y-3">{[1, 2, 3].map((item) => <div key={item} className="h-36 animate-pulse rounded-2xl border border-subtle bg-surface" />)}</div>
      ) : approvalsQuery.isError ? (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">{approvalsQuery.error?.response?.data?.message || 'Approvals could not be loaded.'}</div>
      ) : approvals.length ? (
        <div className="mt-6 space-y-3">
          {approvals.map((approval) => (
            <article key={approval._id} className="rounded-2xl border border-subtle bg-surface p-5 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${approval.status === 'pending' ? 'bg-amber-50 text-amber-700' : approval.status === 'approved' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>{approval.status === 'pending' ? <Clock3 className="h-5 w-5" /> : approval.status === 'approved' ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2"><Link to={`/tasks/${approval.taskId?._id}`} className="font-bold hover:text-emerald-700">{approval.taskId?.title || 'Unavailable task'}</Link><span className="rounded bg-surface-app px-2 py-1 text-[10px] font-bold text-content-tertiary">{approval.taskId?.key}</span><span className="rounded-full bg-violet-50 px-2 py-1 text-[9px] font-bold uppercase text-violet-700">Revision {approval.revision}</span></div>
                  <p className="mt-1 text-xs text-content-tertiary">{approval.projectId?.name} · Submitted by {approval.submittedBy?.name} · {formatDate(approval.submittedAt)}</p>
                  {approval.submissionNote && <p className="mt-3 rounded-xl bg-surface-app p-3 text-sm leading-6 text-content-secondary">{approval.submissionNote}</p>}
                  {approval.reviewNote && <p className={`mt-3 rounded-xl p-3 text-sm leading-6 ${approval.status === 'rejected' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}><b>{approval.reviewedBy?.name}:</b> {approval.reviewNote}</p>}
                </div>
                {canApprove && approval.status === 'pending' && (
                  <div className="flex shrink-0 gap-2">
                    <button onClick={() => setReview({ approval, decision: 'rejected' })} className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 px-3 py-2 text-xs font-bold text-red-700"><XCircle className="h-3.5 w-3.5" /> Reject</button>
                    <button onClick={() => setReview({ approval, decision: 'approved' })} className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-3 py-2 text-xs font-bold text-white"><UserRoundCheck className="h-3.5 w-3.5" /> Approve</button>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-dashed border-subtle bg-surface p-12 text-center"><ClipboardCheck className="mx-auto h-10 w-10 text-emerald-700" /><h2 className="mt-4 text-lg font-bold">No {status} approvals</h2><p className="mt-2 text-sm text-content-secondary">Items will appear here as work moves through review.</p></div>
      )}
      {review && <ReviewModal approval={review.approval} decision={review.decision} onClose={() => setReview(null)} onReviewed={() => { setReview(null); queryClient.invalidateQueries({ queryKey: ['approvals'] }); queryClient.invalidateQueries({ queryKey: ['tasks'] }); queryClient.invalidateQueries({ queryKey: ['task-board'] }); }} />}
    </>
  );
}
