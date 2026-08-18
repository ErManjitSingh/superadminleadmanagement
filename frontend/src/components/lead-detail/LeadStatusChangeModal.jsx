import { useEffect, useState } from 'react';
import API from '../../api/axios';
import { Button } from '../ui/button';
import { ActionModal } from '../sales-executive/LeadActionsMenu';
import { isLeadStatusLocked } from '../../utils/leadUtils';

const STATUSES = [
  'new',
  'contacted',
  'working_progress',
  'follow_up',
  'quotation_sent',
  'negotiation',
  'reactivated',
  'lost',
  'booked_from_another_company',
];

export default function LeadStatusChangeModal({
  open,
  lead,
  endpoint,
  onClose,
  onSaved,
}) {
  const [status, setStatus] = useState(lead?.status || 'new');
  const [reason, setReason] = useState(lead?.statusReason || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setStatus(lead?.status || 'new');
    setReason(lead?.statusReason || '');
  }, [open, lead]);

  const reasonRequired = ['lost', 'booked_from_another_company'].includes(status);
  const options = STATUSES.includes(status) ? STATUSES : [status, ...STATUSES];

  const handleUpdate = async () => {
    if (!lead?._id || !endpoint) return;
    setSaving(true);
    try {
      await API.put(endpoint, { status, statusReason: reason });
      onClose?.();
      await onSaved?.();
    } finally {
      setSaving(false);
    }
  };

  return (
    <ActionModal open={open} title="Change Status" onClose={onClose}>
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        className="w-full rounded-xl border border-subtle bg-white p-3 text-sm mb-4"
      >
        {options.map((item) => (
          <option key={item} value={item}>{item.replace(/_/g, ' ')}</option>
        ))}
      </select>
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        rows={3}
        placeholder="Reason for status change"
        className="w-full rounded-xl border border-subtle bg-white p-3 text-sm mb-4"
      />
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
        <Button onClick={handleUpdate} disabled={saving || (reasonRequired && !reason.trim())}>
          Update
        </Button>
      </div>
    </ActionModal>
  );
}

export function canShowStatusChange(lead) {
  return Boolean(lead && !isLeadStatusLocked(lead.status));
}
