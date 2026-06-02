import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Building2, Home, LogIn, LogOut, Clock } from 'lucide-react';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { requiresAttendanceCheckIn } from '../../constants/attendance';
import { useDataRefresh } from '../../hooks/useDataRefresh';

function formatTime(iso) {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(iso));
}

const WORK_MODES = [
  { value: 'office', label: 'Office', icon: Building2, color: 'from-blue-500 to-indigo-600' },
  { value: 'wfh', label: 'Work From Home', icon: Home, color: 'from-emerald-500 to-teal-600' },
];

export default function AttendanceCheckInCard({ onChanged }) {
  const { user } = useAuth();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [pickMode, setPickMode] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    API.get('/attendance/status', { skipSuccessToast: true })
      .then((r) => setStatus(r.data))
      .catch(() => setStatus(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useDataRefresh(['attendance'], () => {
    load();
    onChanged?.();
  });

  const handleCheckIn = async (workMode) => {
    setActing(true);
    try {
      await API.post(
        '/attendance/check-in',
        { workMode },
        { successMessage: workMode === 'wfh' ? 'WFH check-in ho gaya' : 'Office check-in ho gaya' }
      );
      setPickMode(false);
      load();
      onChanged?.();
    } finally {
      setActing(false);
    }
  };

  const handleCheckOut = async () => {
    setActing(true);
    try {
      await API.post('/attendance/check-out', {}, { successMessage: 'Check-out ho gaya' });
      load();
      onChanged?.();
    } finally {
      setActing(false);
    }
  };

  if (!requiresAttendanceCheckIn(user?.role)) {
    return null;
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-subtle bg-surface/80 p-5 animate-pulse h-[140px]" />
    );
  }

  const record = status?.record;
  const workModeLabel = record?.workMode === 'wfh' ? 'Work From Home' : 'Office';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-subtle bg-surface/80 backdrop-blur-xl p-5"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-content-muted mb-1">
            <Clock className="w-3.5 h-3.5" /> Attendance
          </div>
          {status?.checkedIn ? (
            <>
              <p className="text-lg font-bold text-content-primary">
                Checked in · {workModeLabel}
                {record?.status === 'late' && (
                  <span className="ml-2 text-xs font-semibold text-amber-600 dark:text-amber-400">Late</span>
                )}
              </p>
              <p className="text-sm text-content-secondary mt-0.5">
                In: {formatTime(record?.checkIn)}
                {status.checkedOut && ` · Out: ${formatTime(record?.checkOut)}`}
                {record?.totalHours != null && ` · ${record.totalHours}h`}
              </p>
            </>
          ) : (
            <>
              <p className="text-lg font-bold text-content-primary">Not checked in today</p>
              <p className="text-sm text-content-secondary mt-0.5">Select Office or Work From Home</p>
            </>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {status?.canCheckOut && (
            <button
              type="button"
              onClick={handleCheckOut}
              disabled={acting}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold disabled:opacity-60"
            >
              <LogOut className="w-4 h-4" /> Check Out
            </button>
          )}
          {status?.canCheckIn && !pickMode && (
            <button
              type="button"
              onClick={() => setPickMode(true)}
              disabled={acting}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold disabled:opacity-60"
            >
              <LogIn className="w-4 h-4" /> Check In
            </button>
          )}
        </div>
      </div>

      {pickMode && status?.canCheckIn && (
        <div className="mt-4 pt-4 border-t border-subtle grid grid-cols-1 sm:grid-cols-2 gap-3">
          {WORK_MODES.map(({ value, label, icon: Icon, color }) => (
            <button
              key={value}
              type="button"
              disabled={acting}
              onClick={() => handleCheckIn(value)}
              className="flex items-center gap-3 p-4 rounded-xl border border-subtle hover:border-brand-500/40 bg-surface hover:bg-surface-elevated transition-colors text-left disabled:opacity-60"
            >
              <div className={`p-2.5 rounded-xl bg-gradient-to-br ${color} text-white shadow-md`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="font-semibold text-content-primary">{label}</span>
            </button>
          ))}
          <button
            type="button"
            onClick={() => setPickMode(false)}
            className="sm:col-span-2 text-sm text-content-muted hover:text-content-primary"
          >
            Cancel
          </button>
        </div>
      )}
    </motion.div>
  );
}
