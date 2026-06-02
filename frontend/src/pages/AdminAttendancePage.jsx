import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';
import API from '../api/axios';
import { useDataRefresh } from '../hooks/useDataRefresh';
import PageHeader from '../components/ui/PageHeader';
import { AttendanceStatsCards, AttendanceTeamList } from '../components/attendance';

function AbsentList({ users = [] }) {
  if (!users.length) {
    return (
      <div className="rounded-2xl border border-subtle bg-surface/80 p-5 text-sm text-content-muted text-center">
        Everyone has checked in today
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-subtle bg-surface/80 overflow-hidden">
      <div className="px-5 py-3 border-b border-subtle">
        <h3 className="font-semibold text-content-primary">Absent Today ({users.length})</h3>
      </div>
      <ul className="divide-y divide-subtle/60 max-h-64 overflow-y-auto">
        {users.map((u) => (
          <li key={u.userId} className="px-5 py-3 flex items-center justify-between gap-2">
            <div>
              <p className="font-medium text-content-primary text-sm">{u.userName}</p>
              <p className="text-xs text-content-muted">{u.userEmail}</p>
            </div>
            <span className="text-[10px] font-semibold uppercase text-rose-600 dark:text-rose-400">Absent</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function AdminAttendancePage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    API.get('/attendance/today', { skipSuccessToast: true })
      .then((r) => setData(r.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useDataRefresh(['attendance'], load);

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        title="Attendance"
        description="Office & Work From Home check-ins — present, absent, late, and online status"
        breadcrumbs={['Team Management', 'Attendance']}
      />

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-brand-500/20 bg-gradient-to-r from-brand-600/10 via-indigo-500/5 to-violet-500/10 p-5"
      >
        <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400 text-xs font-semibold uppercase tracking-wider">
          <Clock className="w-3.5 h-3.5" /> Today · Asia/Kolkata
        </div>
        <p className="text-sm text-content-secondary mt-2">
          Track who is in office, working from home, late, or still online.
        </p>
      </motion.div>

      {loading ? (
        <div className="space-y-4">
          <div className="h-28 rounded-2xl border border-subtle bg-surface/50 animate-pulse" />
          <div className="h-64 rounded-2xl border border-subtle bg-surface/50 animate-pulse" />
        </div>
      ) : (
        <>
          <AttendanceStatsCards summary={data?.summary} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <AttendanceTeamList
              records={data?.officeUsers}
              title="Office Users Today"
              emptyMessage="No office check-ins yet"
            />
            <AttendanceTeamList
              records={data?.wfhUsers}
              title="WFH Users Today"
              emptyMessage="No WFH check-ins yet"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <AttendanceTeamList
              records={data?.onlineUsers}
              title="Currently Online"
              emptyMessage="No one is currently checked in"
            />
            <AttendanceTeamList
              records={data?.lateUsers}
              title="Late Today"
              emptyMessage="No late check-ins today"
            />
          </div>

          <AbsentList users={data?.absentUsers} />

          <AttendanceTeamList
            records={data?.teamAttendance}
            title="All Attendance Today"
            emptyMessage="No check-ins yet today"
          />
        </>
      )}
    </div>
  );
}
