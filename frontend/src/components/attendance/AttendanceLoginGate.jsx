import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import API from '../../api/axios';
import { requiresAttendanceCheckIn } from '../../constants/attendance';
import AttendanceLoginModal from './AttendanceLoginModal';

/**
 * Shows mandatory check-in popup after login for eligible roles.
 * Admin and Sales Manager are excluded.
 */
export default function AttendanceLoginGate() {
  const { user, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const [checked, setChecked] = useState(false);

  const evaluate = useCallback(async () => {
    if (!user || !requiresAttendanceCheckIn(user.role)) {
      setOpen(false);
      setChecked(true);
      return;
    }

    try {
      const { data } = await API.get('/attendance/status', { skipSuccessToast: true });
      setOpen(Boolean(data?.canCheckIn));
    } catch {
      setOpen(false);
    } finally {
      setChecked(true);
    }
  }, [user]);

  useEffect(() => {
    if (loading) return;
    setChecked(false);
    evaluate();
  }, [loading, user?.id, user?.role, evaluate]);

  if (loading || !checked || !user) return null;

  return (
    <AttendanceLoginModal
      open={open}
      onSuccess={() => {
        setOpen(false);
        evaluate();
      }}
    />
  );
}
