import { Link, Navigate } from 'react-router-dom';
import { Plane, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';

export default function Register() {
  const { user, getDashboardPath } = useAuth();

  if (user) {
    return <Navigate to={user.dashboardPath || getDashboardPath(user.role)} replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-surface-app">
      <div className="max-w-md w-full rounded-2xl border border-subtle bg-surface/90 backdrop-blur-xl p-10 text-center shadow-xl">
        <div className="mx-auto w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center mb-4">
          <Plane className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-xl font-bold text-content-primary">Registration Coming Soon</h1>
        <p className="text-sm text-content-secondary mt-2 leading-relaxed">
          Phase 1 uses predefined demo accounts. User registration will be available with the Node.js + MongoDB backend.
        </p>
        <Link to="/login" className="inline-block mt-6">
          <Button><ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Sign In</Button>
        </Link>
      </div>
    </div>
  );
}
