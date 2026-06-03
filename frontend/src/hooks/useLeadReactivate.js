import { useState } from 'react';
import API from '../api/axios';

/**
 * Reactivate lost leads and manage reactivated lead workflow (manager / team leader / admin).
 */
export function useLeadReactivate({ leadId, onSuccess } = {}) {
  const [mode, setMode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const close = () => setMode('');

  const submit = async (payload) => {
    if (!leadId || !mode) return;
    setSubmitting(true);
    try {
      const endpoint =
        mode === 'reactivate'
          ? `/leads/${leadId}/reactivate`
          : mode === 'reassign'
            ? `/leads/${leadId}/reassign-reactivated`
            : `/leads/${leadId}/reactivation-stage`;
      const method = mode === 'stage' ? 'patch' : 'post';
      await API[method](endpoint, payload);
      setMode('');
      await onSuccess?.();
    } finally {
      setSubmitting(false);
    }
  };

  const isLost = (lead) => ['lost', 'booked_from_another_company'].includes(lead?.status);

  return {
    mode,
    setMode,
    close,
    submit,
    submitting,
    isLost,
    openReactivate: () => setMode('reactivate'),
    openReassign: () => setMode('reassign'),
    openStage: () => setMode('stage'),
  };
}
