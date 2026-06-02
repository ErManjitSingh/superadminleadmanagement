import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldOff, ArrowLeft, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';

export default function Unauthorized() {
  const { user, getDashboardPath, logout } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-rose-500/5 via-surface-app to-surface-app">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full text-center rounded-2xl border border-subtle bg-surface/90 backdrop-blur-xl p-10 shadow-2xl"
      >
        <div className="mx-auto w-16 h-16 rounded-2xl bg-rose-500/10 flex items-center justify-center mb-5">
          <ShieldOff className="w-8 h-8 text-rose-500" />
        </div>
        <h1 className="text-2xl font-bold text-content-primary">Unauthorized Access</h1>
        <p className="text-sm text-content-secondary mt-2 leading-relaxed">
          Your role does not have permission to view this page.
          {user?.roleName && (
            <> You are signed in as <span className="font-semibold text-content-primary">{user.roleName}</span>.</>
          )}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 mt-8 justify-center">
          {user ? (
            <Link to={user.dashboardPath || getDashboardPath(user.role)}>
              <Button variant="outline"><ArrowLeft className="w-4 h-4 mr-1.5" /> My Dashboard</Button>
            </Link>
          ) : (
            <Link to="/login">
              <Button variant="outline"><LogIn className="w-4 h-4 mr-1.5" /> Sign In</Button>
            </Link>
          )}
          <Button variant="ghost" onClick={() => logout().then(() => window.location.assign('/login'))} className="text-content-muted">
            Sign out
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
