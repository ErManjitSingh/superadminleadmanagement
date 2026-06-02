import { useAuth } from '../context/AuthContext';
import { canAccess } from '../lib/permissions';

export function usePermissions() {
  const { user } = useAuth();

  return {
    user,
    can: (module, action = 'view') => canAccess(user, module, action),
    canAny: (checks) => checks.some(([mod, act]) => canAccess(user, mod, act ?? 'view')),
    canAll: (checks) => checks.every(([mod, act]) => canAccess(user, mod, act ?? 'view')),
  };
}
