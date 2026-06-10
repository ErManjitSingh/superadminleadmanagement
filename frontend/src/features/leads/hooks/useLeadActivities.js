import { useEffect, useMemo, useState } from 'react';
import { getLeadDetailData, mergeLeadActivities } from '../../../components/lead-detail/leadDetailData';
import { fetchLeadTimeline } from '../../../services/leadEnterpriseApi';

export function useLeadActivities(lead, leadId) {
  const [timeline, setTimeline] = useState([]);
  const [timelineLoading, setTimelineLoading] = useState(false);

  useEffect(() => {
    if (!leadId) {
      setTimeline([]);
      return;
    }
    let cancelled = false;
    setTimelineLoading(true);
    fetchLeadTimeline(leadId, { limit: 50 })
      .then((res) => {
        if (!cancelled) setTimeline(res.data || []);
      })
      .catch(() => {
        if (!cancelled) setTimeline([]);
      })
      .finally(() => {
        if (!cancelled) setTimelineLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [leadId, lead?.updatedAt, lead?.quotations?.length]);

  const detail = useMemo(() => (lead ? getLeadDetailData(lead) : { activities: [] }), [lead]);
  const activities = useMemo(
    () => mergeLeadActivities(detail.activities, timeline),
    [detail.activities, timeline]
  );

  return { activities, timelineLoading, detail };
}
