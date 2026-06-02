import { useCallback, useEffect, useState } from 'react';
import API from '../api/axios';

export function useLeadAssign({ onAssigned } = {}) {
  const [assignees, setAssignees] = useState(null);
  const [assigneesLoading, setAssigneesLoading] = useState(false);
  const [assignModal, setAssignModal] = useState(null);
  const [assigning, setAssigning] = useState(false);

  const fetchAssignees = useCallback(() => {
    setAssigneesLoading(true);
    return API.get('/leads/assignees')
      .then((res) => setAssignees(res.data))
      .catch(() => setAssignees({ salesManagers: [], teamLeaders: [], salesExecutives: [] }))
      .finally(() => setAssigneesLoading(false));
  }, []);

  useEffect(() => {
    fetchAssignees();
  }, [fetchAssignees]);

  const openAssign = useCallback((lead) => {
    setAssignModal(lead);
  }, []);

  const openBulkAssign = useCallback((leadIds) => {
    setAssignModal({ bulk: true, count: leadIds.length, leadIds });
  }, []);

  const closeAssign = useCallback(() => {
    setAssignModal(null);
  }, []);

  const handleAssign = useCallback(
    async ({ assigneeRole, assigneeId, leadIds }) => {
      const isReassign =
        !assignModal?.bulk &&
        Boolean(assignModal?.assignedTo?._id || assignModal?.assignedTo);
      if (isReassign) {
        const ok = window.confirm(
          'Ye lead pehle se assigned hai. Kya aap isko dubara assign karna chahte hain?'
        );
        if (!ok) return;
      }
      setAssigning(true);
      try {
        await API.post('/leads/assign', { assigneeRole, assigneeId, leadIds });
        setAssignModal(null);
        onAssigned?.({ assigneeRole, assigneeId, leadIds });
      } finally {
        setAssigning(false);
      }
    },
    [assignModal, onAssigned]
  );

  return {
    assignees,
    assigneesLoading,
    assignModal,
    assigning,
    openAssign,
    openBulkAssign,
    closeAssign,
    handleAssign,
    fetchAssignees,
  };
}
