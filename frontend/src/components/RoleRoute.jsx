import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ProtectedRoute from './ProtectedRoute';

/** Shorthand for role-scoped routes inside the main layout */
export default function RoleRoute({ roles, children }) {
  return (
    <ProtectedRoute allowedRoles={roles}>
      {children}
    </ProtectedRoute>
  );
}

export function RoleDashboardRedirect() {
  const { user, getDashboardPath } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.dashboardPath || getDashboardPath(user.role)} replace />;
}
