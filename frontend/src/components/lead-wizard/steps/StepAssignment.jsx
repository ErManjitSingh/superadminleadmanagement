import { useEffect, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { motion } from 'framer-motion';
import API from '../../../api/axios';
import Avatar from '../../ui/Avatar';
import { cn } from '../../../lib/utils';

function PersonCard({ person, selected, onSelect }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'flex items-center gap-3 p-4 rounded-xl border text-left transition-all w-full',
        selected
          ? 'border-brand-500/40 bg-brand-500/10 ring-2 ring-brand-500/20'
          : 'border-subtle bg-surface hover:bg-surface-elevated hover:border-brand-500/20'
      )}
    >
      <Avatar name={person.name} size="sm" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-content-primary">{person.name}</p>
        <p className="text-xs text-content-muted truncate">{person.roleName || person.role}</p>
      </div>
      {selected && (
        <span className="text-[10px] font-bold uppercase text-brand-600 bg-brand-500/15 px-2 py-0.5 rounded-full shrink-0">
          Selected
        </span>
      )}
    </button>
  );
}

export default function StepAssignment() {
  const { watch, setValue, formState: { errors } } = useFormContext();
  const executive = watch('assignedExecutive');
  const manager = watch('assignedManager');
  const [executives, setExecutives] = useState([]);
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    API.get('/leads/assignees')
      .then((res) => {
        setExecutives(res.data.salesExecutives || []);
        setManagers(res.data.salesManagers || []);
      })
      .catch(() => setLoadError('Could not load team members. Refresh and try again.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -24 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-xl font-bold text-content-primary">Assignment</h2>
        <p className="text-sm text-content-muted mt-1">Assign executive and manager from your team</p>
      </div>

      {loadError && (
        <p className="text-sm text-red-600 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{loadError}</p>
      )}

      <div>
        <label className="block text-sm font-medium text-content-primary mb-3">
          Assign Executive <span className="text-content-muted text-xs font-normal">(optional)</span>
        </label>
        {errors.assignedExecutive && (
          <p className="text-xs text-red-500 mb-2">{errors.assignedExecutive.message}</p>
        )}
        {loading ? (
          <p className="text-sm text-content-muted">Loading executives…</p>
        ) : executives.length === 0 ? (
          <p className="text-sm text-amber-600">No sales executives found. Run database seed or add users.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {executives.map((ex) => (
              <PersonCard
                key={ex._id}
                person={ex}
                selected={executive === ex._id}
                onSelect={() => setValue('assignedExecutive', ex._id, { shouldValidate: true })}
              />
            ))}
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-content-primary mb-3">
          Assign Manager <span className="text-content-muted text-xs font-normal">(optional)</span>
        </label>
        {errors.assignedManager && (
          <p className="text-xs text-red-500 mb-2">{errors.assignedManager.message}</p>
        )}
        {loading ? (
          <p className="text-sm text-content-muted">Loading managers…</p>
        ) : managers.length === 0 ? (
          <p className="text-sm text-amber-600">No sales managers found.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {managers.map((mg) => (
              <PersonCard
                key={mg._id}
                person={mg}
                selected={manager === mg._id}
                onSelect={() => setValue('assignedManager', mg._id, { shouldValidate: true })}
              />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
