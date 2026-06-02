import { Navigate } from 'react-router-dom';
import { usePermissions } from '../hooks/usePermissions';
import { useAuth } from '../context/AuthContext';

export default function PermissionRoute({ module, action = 'view', children, redirectTo }) {
  const { user, can } = usePermissions();
  const { getDashboardPath } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  if (module && !can(module, action)) {
    const fallback = redirectTo ?? user.dashboardPath ?? getDashboardPath(user.role) ?? '/';
    return <Navigate to={fallback} replace />;
  }

  return children;
}
