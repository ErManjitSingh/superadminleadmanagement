import { useEffect, useState } from 'react';
import { Compass } from 'lucide-react';
import API from '../../../api/axios';
import PageHeader from '../../ui/PageHeader';
import { formatINR } from '../operationsUtils';

export default function OperationsActivitiesPage() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/operations-manager/activities').then((r) => setActivities(r.data)).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 pb-8">
      <PageHeader title="Activities" description="Tours, excursions and experience inventory" breadcrumbs={['Operations', 'Activities']} />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full p-16 text-center text-content-muted animate-pulse">Loading activities...</div>
        ) : activities.map((a) => (
          <div key={a._id} className="rounded-2xl border border-subtle bg-surface/80 p-5 hover:border-teal-500/20 transition-colors">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-teal-500/10"><Compass className="w-5 h-5 text-teal-600" /></div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-content-primary">{a.name}</h3>
                <p className="text-sm text-content-muted">{a.destination} · {a.duration}</p>
                <p className="text-xs text-content-muted mt-1">Vendor: {a.vendorName}</p>
                <p className="text-lg font-bold text-teal-600 mt-2 tabular-nums">{formatINR(a.price)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
