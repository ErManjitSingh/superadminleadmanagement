import { useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Activity,
  AtSign,
  CheckCircle2,
  Download,
  FileText,
  MessageSquare,
  Paperclip,
  Pencil,
  Reply,
  Send,
  Trash2,
  Upload,
  X,
  XCircle,
} from 'lucide-react';
import { useAuth } from '../src/context/AuthContext';
import {
  createTaskComment,
  deleteTaskAttachment,
  deleteTaskComment,
  downloadTaskAttachment,
  fetchTaskActivity,
  fetchTaskApprovals,
  fetchTaskAttachments,
  fetchTaskComments,
  submitTaskForApproval,
  updateTaskComment,
  uploadTaskAttachments,
} from './api/workApi';

function formatDate(value) {
  return value ? new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value)) : '';
}

function fileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function Initials({ name }) {
  return <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-900">{(name || 'U').split(' ').slice(0, 2).map((part) => part[0]).join('').toUpperCase()}</span>;
}

function CommentsPanel({ task, refreshTask }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [body, setBody] = useState('');
  const [mentionIds, setMentionIds] = useState([]);
  const [replyTo, setReplyTo] = useState(null);
  const [editing, setEditing] = useState(null);
  const commentsQuery = useQuery({
    queryKey: ['task-comments', task._id],
    queryFn: () => fetchTaskComments(task._id),
  });
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['task-comments', task._id] });
    queryClient.invalidateQueries({ queryKey: ['task-activity', task._id] });
    refreshTask();
  };
  const createMutation = useMutation({
    mutationFn: () => createTaskComment(task._id, {
      body,
      mentionIds,
      parentCommentId: replyTo?._id || null,
    }),
    onSuccess: () => {
      setBody('');
      setMentionIds([]);
      setReplyTo(null);
      refresh();
    },
  });
  const updateMutation = useMutation({
    mutationFn: () => updateTaskComment(task._id, editing._id, {
      body: editing.body,
      mentionIds: editing.mentionIds || [],
    }),
    onSuccess: () => {
      setEditing(null);
      refresh();
    },
  });
  const deleteMutation = useMutation({
    mutationFn: (commentId) => deleteTaskComment(task._id, commentId),
    onSuccess: refresh,
  });
  const comments = commentsQuery.data?.data || [];
  const rootComments = comments.filter((comment) => !comment.parentCommentId);
  const repliesByParent = useMemo(() => comments.reduce((result, comment) => {
    if (comment.parentCommentId) {
      const key = String(comment.parentCommentId);
      if (!result[key]) result[key] = [];
      result[key].push(comment);
    }
    return result;
  }, {}), [comments]);
  const mentionOptions = [...new Map(
    [...task.assigneeIds, task.createdBy]
      .filter(Boolean)
      .map((person) => [person._id, person]),
  ).values()];
  const toggleMention = (id) => setMentionIds((current) => current.includes(id)
    ? current.filter((item) => item !== id)
    : [...current, id]);

  const renderComment = (comment, nested = false) => {
    const canModify = task.access.canManage || String(comment.authorId?._id) === String(user?._id || user?.id);
    return (
      <div key={comment._id} className={nested ? 'ml-7 border-l border-subtle pl-4 sm:ml-10' : ''}>
        <div className="flex gap-3 py-4">
          <Initials name={comment.authorId?.name} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2"><b className="text-sm">{comment.authorId?.name || 'Unknown user'}</b><span className="text-[10px] text-content-tertiary">{formatDate(comment.createdAt)}{comment.editedAt ? ' · edited' : ''}</span></div>
            {editing?._id === comment._id ? (
              <form onSubmit={(event) => { event.preventDefault(); updateMutation.mutate(); }} className="mt-2">
                <textarea autoFocus rows={3} value={editing.body} onChange={(event) => setEditing((current) => ({ ...current, body: event.target.value }))} className="w-full resize-none rounded-xl border border-subtle p-3 text-sm outline-none focus:border-emerald-600" />
                <div className="mt-2 flex justify-end gap-2"><button type="button" onClick={() => setEditing(null)} className="rounded-lg border border-subtle px-3 py-1.5 text-xs font-semibold">Cancel</button><button disabled={!editing.body.trim() || updateMutation.isPending} className="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white">Save</button></div>
              </form>
            ) : (
              <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-content-secondary">{comment.body}</p>
            )}
            {comment.mentionIds?.length > 0 && <div className="mt-2 flex flex-wrap gap-1">{comment.mentionIds.map((person) => <span key={person._id} className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">@{person.name}</span>)}</div>}
            {!editing && <div className="mt-2 flex gap-3 text-[11px] font-semibold text-content-tertiary">{!nested && <button onClick={() => { setReplyTo(comment); setBody(''); }} className="flex items-center gap-1 hover:text-emerald-700"><Reply className="h-3 w-3" /> Reply</button>}{canModify && <button onClick={() => setEditing({ ...comment, mentionIds: comment.mentionIds?.map((person) => person._id) || [] })} className="flex items-center gap-1 hover:text-emerald-700"><Pencil className="h-3 w-3" /> Edit</button>}{canModify && <button onClick={() => deleteMutation.mutate(comment._id)} className="flex items-center gap-1 hover:text-red-600"><Trash2 className="h-3 w-3" /> Delete</button>}</div>}
          </div>
        </div>
        {!nested && (repliesByParent[comment._id] || []).map((reply) => renderComment(reply, true))}
      </div>
    );
  };

  return (
    <div>
      <div className="divide-y divide-subtle">
        {rootComments.map((comment) => renderComment(comment))}
        {!commentsQuery.isLoading && !rootComments.length && <div className="py-10 text-center"><MessageSquare className="mx-auto h-7 w-7 text-content-tertiary" /><p className="mt-3 text-sm text-content-secondary">Start the task conversation.</p></div>}
      </div>
      <form onSubmit={(event) => { event.preventDefault(); if (body.trim()) createMutation.mutate(); }} className="mt-4 rounded-2xl border border-subtle bg-surface-app p-3">
        {replyTo && <div className="mb-2 flex items-center justify-between rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700"><span>Replying to <b>{replyTo.authorId?.name}</b></span><button type="button" onClick={() => setReplyTo(null)}><X className="h-3.5 w-3.5" /></button></div>}
        <textarea rows={3} maxLength={10000} value={body} onChange={(event) => setBody(event.target.value)} className="w-full resize-none bg-transparent px-1 text-sm outline-none" placeholder={replyTo ? 'Write a reply…' : 'Write a comment…'} />
        {mentionOptions.length > 0 && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5 border-t border-subtle pt-2">
            <AtSign className="h-3.5 w-3.5 text-content-tertiary" />
            {mentionOptions.map((person) => <button key={person._id} type="button" onClick={() => toggleMention(person._id)} className={`rounded-full px-2 py-1 text-[10px] font-semibold ${mentionIds.includes(person._id) ? 'bg-blue-100 text-blue-700' : 'bg-surface text-content-tertiary'}`}>{person.name}</button>)}
            <button disabled={!body.trim() || createMutation.isPending} className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"><Send className="h-3 w-3" /> Send</button>
          </div>
        )}
        {!mentionOptions.length && <div className="mt-2 flex justify-end border-t border-subtle pt-2"><button disabled={!body.trim() || createMutation.isPending} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"><Send className="h-3 w-3" /> Send</button></div>}
        {(createMutation.isError || updateMutation.isError) && <p className="mt-2 text-xs text-red-600">{createMutation.error?.response?.data?.message || updateMutation.error?.response?.data?.message || 'Comment could not be saved.'}</p>}
      </form>
    </div>
  );
}

function AttachmentsPanel({ task, refreshTask }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const inputRef = useRef(null);
  const attachmentsQuery = useQuery({
    queryKey: ['task-attachments', task._id],
    queryFn: () => fetchTaskAttachments(task._id),
  });
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['task-attachments', task._id] });
    queryClient.invalidateQueries({ queryKey: ['task-activity', task._id] });
    refreshTask();
  };
  const uploadMutation = useMutation({
    mutationFn: (files) => uploadTaskAttachments(task._id, files),
    onSuccess: () => {
      if (inputRef.current) inputRef.current.value = '';
      refresh();
    },
  });
  const deleteMutation = useMutation({
    mutationFn: (attachmentId) => deleteTaskAttachment(task._id, attachmentId),
    onSuccess: refresh,
  });
  const attachments = attachmentsQuery.data || [];
  return (
    <div>
      {task.access.canEdit && (
        <label className="flex cursor-pointer flex-col items-center rounded-2xl border border-dashed border-emerald-300 bg-emerald-50/40 p-7 text-center hover:bg-emerald-50">
          <Upload className="h-7 w-7 text-emerald-700" />
          <b className="mt-3 text-sm">Upload task files</b>
          <span className="mt-1 text-xs text-content-tertiary">Images, PDF, Office, text or ZIP · 25 MB each · up to 5 files</span>
          <input ref={inputRef} type="file" multiple className="hidden" accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.txt,.csv,.zip,.doc,.docx,.xls,.xlsx,.ppt,.pptx" onChange={(event) => { const files = [...event.target.files]; if (files.length) uploadMutation.mutate(files); }} />
        </label>
      )}
      {uploadMutation.isPending && <p className="mt-3 text-center text-xs font-semibold text-emerald-700">Uploading securely…</p>}
      {uploadMutation.isError && <p className="mt-3 text-center text-xs text-red-600">{uploadMutation.error?.response?.data?.message || 'Upload failed.'}</p>}
      <div className="mt-4 divide-y divide-subtle">
        {attachments.map((attachment) => {
          const canDelete = task.access.canManage || String(attachment.uploadedBy?._id) === String(user?._id || user?.id);
          return (
            <div key={attachment._id} className="flex items-center gap-3 py-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700"><FileText className="h-4 w-4" /></span>
              <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{attachment.originalName}</p><p className="mt-1 text-[10px] text-content-tertiary">{fileSize(attachment.size)} · {attachment.uploadedBy?.name} · {formatDate(attachment.createdAt)}</p></div>
              <button onClick={() => downloadTaskAttachment(task._id, attachment)} className="rounded-lg p-2 text-content-tertiary hover:bg-blue-50 hover:text-blue-700" aria-label={`Download ${attachment.originalName}`}><Download className="h-4 w-4" /></button>
              {canDelete && <button onClick={() => deleteMutation.mutate(attachment._id)} className="rounded-lg p-2 text-content-tertiary hover:bg-red-50 hover:text-red-600" aria-label={`Delete ${attachment.originalName}`}><Trash2 className="h-4 w-4" /></button>}
            </div>
          );
        })}
        {!attachmentsQuery.isLoading && !attachments.length && <div className="py-8 text-center text-sm text-content-tertiary">No files attached.</div>}
      </div>
    </div>
  );
}

function ApprovalsPanel({ task, refreshTask }) {
  const queryClient = useQueryClient();
  const [note, setNote] = useState('');
  const approvalsQuery = useQuery({
    queryKey: ['task-approvals', task._id],
    queryFn: () => fetchTaskApprovals(task._id),
  });
  const submitMutation = useMutation({
    mutationFn: () => submitTaskForApproval(task._id, note),
    onSuccess: () => {
      setNote('');
      queryClient.invalidateQueries({ queryKey: ['task-approvals', task._id] });
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      queryClient.invalidateQueries({ queryKey: ['task-board'] });
      queryClient.invalidateQueries({ queryKey: ['task-activity', task._id] });
      refreshTask();
    },
  });
  const approvals = approvalsQuery.data || [];
  const canSubmit = task.access.canEdit
    && !['pending', 'approved'].includes(task.approvalStatus)
    && task.status !== 'completed';
  return (
    <div>
      {task.approvalStatus === 'pending' && <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"><b>Awaiting approval.</b> A project approver has been notified.</div>}
      {task.approvalStatus === 'approved' && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"><b>Approved.</b> This task passed the latest review.</div>}
      {task.approvalStatus === 'rejected' && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"><b>Changes requested.</b> Update the work and submit a new revision.</div>}
      {canSubmit && (
        <form onSubmit={(event) => { event.preventDefault(); submitMutation.mutate(); }} className="mt-4 rounded-2xl border border-subtle bg-surface-app p-4">
          <label className="block text-xs font-bold uppercase tracking-wide text-content-tertiary">Submission note</label>
          <textarea rows={3} maxLength={5000} value={note} onChange={(event) => setNote(event.target.value)} className="mt-2 w-full resize-none rounded-xl border border-subtle bg-surface p-3 text-sm outline-none focus:border-emerald-600" placeholder="Summarize what is ready for review, testing notes, or links" />
          <button disabled={submitMutation.isPending} className="mt-3 inline-flex items-center gap-2 rounded-xl bg-violet-700 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"><CheckCircle2 className="h-4 w-4" /> {submitMutation.isPending ? 'Submitting…' : approvals.length ? 'Submit new revision' : 'Submit for approval'}</button>
          {submitMutation.isError && <p className="mt-2 text-xs text-red-600">{submitMutation.error?.response?.data?.message || 'Task could not be submitted.'}</p>}
        </form>
      )}
      <div className="mt-5 space-y-3">
        {approvals.map((approval) => (
          <div key={approval._id} className="rounded-xl border border-subtle p-4">
            <div className="flex items-center gap-2"><span className={`flex h-8 w-8 items-center justify-center rounded-full ${approval.status === 'approved' ? 'bg-emerald-50 text-emerald-700' : approval.status === 'rejected' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>{approval.status === 'approved' ? <CheckCircle2 className="h-4 w-4" /> : approval.status === 'rejected' ? <XCircle className="h-4 w-4" /> : <Activity className="h-4 w-4" />}</span><div><p className="text-sm font-bold capitalize">Revision {approval.revision} · {approval.status}</p><p className="mt-0.5 text-[10px] text-content-tertiary">Submitted by {approval.submittedBy?.name} · {formatDate(approval.submittedAt)}</p></div></div>
            {approval.submissionNote && <p className="mt-3 text-sm leading-6 text-content-secondary">{approval.submissionNote}</p>}
            {approval.reviewNote && <p className={`mt-3 rounded-lg p-3 text-sm ${approval.status === 'rejected' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}><b>{approval.reviewedBy?.name}:</b> {approval.reviewNote}</p>}
          </div>
        ))}
        {!approvalsQuery.isLoading && !approvals.length && <div className="py-8 text-center text-sm text-content-tertiary">No approval history.</div>}
      </div>
    </div>
  );
}

function ActivityPanel({ task }) {
  const activityQuery = useQuery({
    queryKey: ['task-activity', task._id],
    queryFn: () => fetchTaskActivity(task._id),
  });
  const activities = activityQuery.data?.data || [];
  return (
    <div className="relative">
      <span className="absolute bottom-4 left-[15px] top-4 w-px bg-subtle" />
      <div className="space-y-5">
        {activities.map((item) => (
          <div key={item._id} className="relative flex gap-3">
            <Initials name={item.actorId?.name} />
            <div className="min-w-0 pt-0.5"><p className="text-sm text-content-secondary">{item.summary}</p><p className="mt-1 text-[10px] text-content-tertiary">{formatDate(item.createdAt)}</p></div>
          </div>
        ))}
        {!activityQuery.isLoading && !activities.length && <div className="py-8 text-center text-sm text-content-tertiary">No activity recorded yet.</div>}
      </div>
    </div>
  );
}

export default function TaskCollaborationPanels({ task, refreshTask }) {
  const [tab, setTab] = useState('comments');
  const tabs = [
    ['comments', MessageSquare, `Comments ${task.commentCount || ''}`],
    ['attachments', Paperclip, `Files ${task.attachmentCount || ''}`],
    ['approvals', CheckCircle2, 'Approval'],
    ['activity', Activity, 'Activity'],
  ];
  return (
    <section className="rounded-2xl border border-subtle bg-surface">
      <div className="flex overflow-x-auto border-b border-subtle px-2 pt-2">
        {tabs.map(([value, Icon, label]) => <button key={value} onClick={() => setTab(value)} className={`flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold ${tab === value ? 'border-emerald-700 text-emerald-700' : 'border-transparent text-content-tertiary hover:text-content-primary'}`}><Icon className="h-4 w-4" />{label}</button>)}
      </div>
      <div className="p-5 sm:p-6">
        {tab === 'comments' && <CommentsPanel task={task} refreshTask={refreshTask} />}
        {tab === 'attachments' && <AttachmentsPanel task={task} refreshTask={refreshTask} />}
        {tab === 'approvals' && <ApprovalsPanel task={task} refreshTask={refreshTask} />}
        {tab === 'activity' && <ActivityPanel task={task} />}
      </div>
    </section>
  );
}
