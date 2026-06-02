import { useEffect, useState } from 'react';
import AppModal from '../ui/AppModal';
import { Button } from '../ui/button';

export default function ReactivationActionsModal({
  open,
  mode = 'reactivate',
  executives = [],
  onClose,
  onSubmit,
}) {
  const [reason, setReason] = useState('');
  const [executiveId, setExecutiveId] = useState('');
  const [stage, setStage] = useState('contacted');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!open) return;
    setReason('');
    setExecutiveId('');
    setStage('contacted');
    setNote('');
  }, [open, mode]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (mode === 'reactivate') onSubmit?.({ reason });
    if (mode === 'reassign') onSubmit?.({ executiveId });
    if (mode === 'stage') onSubmit?.({ stage, note });
  };

  return (
    <AppModal open={open} onClose={onClose} size="md">
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <h3 className="text-lg font-semibold text-content-primary">
          {mode === 'reactivate' ? 'Reactivate Lost Lead' : mode === 'reassign' ? 'Reassign Reactivated Lead' : 'Update Reactivation Progress'}
        </h3>

        {mode === 'reactivate' && (
          <textarea
            required
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Why is this lead being reactivated?"
            className="input-premium min-h-[110px]"
          />
        )}

        {mode === 'reassign' && (
          <select
            required
            value={executiveId}
            onChange={(e) => setExecutiveId(e.target.value)}
            className="input-premium h-10"
          >
            <option value="">Select executive</option>
            {executives.map((ex) => (
              <option key={ex._id} value={ex._id}>
                {ex.name}
              </option>
            ))}
          </select>
        )}

        {mode === 'stage' && (
          <>
            <select
              value={stage}
              onChange={(e) => setStage(e.target.value)}
              className="input-premium h-10"
            >
              <option value="contacted">Contacted</option>
              <option value="follow_up_scheduled">Follow Up Scheduled</option>
              <option value="quotation_sent">Quotation Sent</option>
              <option value="converted">Converted</option>
            </select>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optional note"
              className="input-premium min-h-[90px]"
            />
          </>
        )}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="teal">Save</Button>
        </div>
      </form>
    </AppModal>
  );
}
