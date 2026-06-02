import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldOff, ArrowLeft } from 'lucide-react';
import { Button } from './button';

export default function AccessDenied({ module, action }) {
  return (
    <div className="flex items-center justify-center min-h-[60vh] p-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full text-center rounded-2xl border border-subtle bg-surface/80 backdrop-blur-xl p-10"
      >
        <div className="mx-auto w-16 h-16 rounded-2xl bg-rose-500/10 flex items-center justify-center mb-5">
          <ShieldOff className="w-8 h-8 text-rose-500" />
        </div>
        <h1 className="text-xl font-bold text-content-primary">Access Denied</h1>
        <p className="text-sm text-content-secondary mt-2 leading-relaxed">
          You don&apos;t have permission to {action} {module?.replace(/_/g, ' ')} resources.
          Contact your administrator if you need access.
        </p>
        <Link to="/">
          <Button className="mt-6">
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Dashboard
          </Button>
        </Link>
      </motion.div>
    </div>
  );
}
