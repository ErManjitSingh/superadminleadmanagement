import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { requiresAttendanceCheckIn } from '../../constants/attendance';
import API from '../../api/axios';
import { useDataRefresh } from '../../hooks/useDataRefresh';
import AttendanceCheckInCard from './AttendanceCheckInCard';
import AttendanceStatsCards from './AttendanceStatsCards';
import AttendanceTeamList from './AttendanceTeamList';

const STATS_ROLES = new Set(['sales_manager', 'team_leader']);

export default function AttendanceSection() {
  const { user } = useAuth();
  const showStats = STATS_ROLES.has(user?.role);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(showStats);

  const loadToday = useCallback(() => {
    if (!showStats) return;
    setLoading(true);
    API.get('/attendance/today', { skipSuccessToast: true })
      .then((r) => setData(r.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [showStats]);

  useEffect(() => {
    loadToday();
  }, [loadToday]);

  useDataRefresh(['attendance'], loadToday);

  const managerExtras =
    user?.role === 'sales_manager' ? (
      <AttendanceTeamList
        records={data?.lateUsers || []}
        title="Late Users Today"
        emptyMessage="No late check-ins today"
      />
    ) : null;

  if (!showStats && !requiresAttendanceCheckIn(user?.role)) {
    return null;
  }

  return (
    <div className="space-y-4">
      {requiresAttendanceCheckIn(user?.role) && (
        <AttendanceCheckInCard onChanged={loadToday} />
      )}

      {showStats && (
        <>
          {loading ? (
            <div className="h-24 rounded-2xl border border-subtle bg-surface/50 animate-pulse" />
          ) : (
            <>
              <AttendanceStatsCards summary={data?.summary} />
              <AttendanceTeamList records={data?.teamAttendance} />
              {managerExtras}
            </>
          )}
        </>
      )}
    </div>
  );
}
