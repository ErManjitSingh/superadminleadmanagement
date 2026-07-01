import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Search, Package, TrendingUp, IndianRupee, Star } from 'lucide-react';
import API from '../../api/axios';
import { Button } from '../ui/button';
import PackageDataTable from './PackageDataTable';
import ResourceManagement from './ResourceManagement';
import { PACKAGE_TYPES } from '../quotations/constants';
import { PACKAGE_STATUS_OPTIONS } from './builder/packageBuilderConstants';
import { formatINR } from '../quotations/quotationUtils';
import { useDataRefresh } from '../../hooks/useDataRefresh';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import { usePermissions } from '../../hooks/usePermissions';

export default function PackageManagementPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { can } = usePermissions();
  const canCreate = can('packages', 'create');
  const [packages, setPackages] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [cabs, setCabs] = useState([]);
  const [flights, setFlights] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [destinationFilter, setDestinationFilter] = useState('');
  const { confirm, dialogNode } = useConfirmDialog();

  const fetchAll = useCallback(() => {
    setLoading(true);
    Promise.all([
      API.get('/packages', { params: { search, packageType: typeFilter || undefined, status: statusFilter || undefined } }),
      API.get('/hotels'),
      API.get('/cabs'),
      API.get('/flights'),
      API.get('/activities', { skipErrorToast: true }).catch(() => ({ data: [] })),
    ]).then(([p, h, c, f, a]) => {
      setPackages(p.data);
      setHotels(h.data);
      setCabs(c.data);
      setFlights(f.data);
      setActivities(Array.isArray(a.data) ? a.data : []);
    }).finally(() => setLoading(false));
  }, [search, typeFilter, statusFilter]);

  useEffect(() => { fetchAll(); }, [fetchAll]);
  useDataRefresh(['packages'], fetchAll);

  useEffect(() => {
    if (location.state?.message) fetchAll();
  }, [location.state, fetchAll]);

  const destinations = useMemo(() => {
    const set = new Set(packages.map((p) => p.destination).filter(Boolean));
    packages.forEach((p) => (p.destinations || []).forEach((d) => d.name && set.add(d.name)));
    return [...set].sort();
  }, [packages]);

  const filteredPackages = useMemo(() => {
    if (!destinationFilter) return packages;
    return packages.filter(
      (p) =>
        p.destination === destinationFilter ||
        (p.destinations || []).some((d) => d.name === destinationFilter)
    );
  }, [packages, destinationFilter]);

  const totalBookings = packages.reduce((s, p) => s + (p.bookingCount || 0), 0);
  const totalRevenue = packages.reduce(
    (s, p) => s + (p.bookingCount || 0) * (p.pricing?.perPerson || p.startingPrice || 0),
    0
  );
  const popularPackage = [...packages].sort((a, b) => (b.bookingCount || 0) - (a.bookingCount || 0))[0];

  const handleDuplicate = async (id) => {
    await API.post(`/packages/duplicate/${id}`);
    fetchAll();
  };

  const handleDelete = async (id) => {
    const ok = await confirm({
      title: 'Delete package?',
      message: 'This package will be removed permanently.',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      tone: 'danger',
    });
    if (!ok) return;
    await API.delete(`/packages/${id}`);
    fetchAll();
  };

  const handleResourceSave = async (type, data, editId) => {
    const path = type === 'activities' ? '/operations/activities' : `/${type}`;
    if (editId) await API.put(`${path}/${editId}`, data);
    else await API.post(path, data);
    fetchAll();
  };

  const handleResourceDelete = async (type, id) => {
    const ok = await confirm({
      title: 'Delete item?',
      message: 'This item will be removed permanently.',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      tone: 'danger',
    });
    if (!ok) return;
    const path = type === 'activities' ? `/operations/activities/${id}` : `/${type}/${id}`;
    await API.delete(path);
    fetchAll();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-10 space-y-6">
      {location.state?.message && (
        <div className="px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-sm text-emerald-800">
          {location.state.message}
        </div>
      )}

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-content-primary">Travel Packages</h1>
            <span className="px-2.5 py-1 rounded-lg bg-violet-500/15 text-violet-700 text-sm font-bold">
              {packages.length}
            </span>
          </div>
          <p className="text-sm text-content-muted">Package catalog, itinerary builder & inventory</p>
        </div>
        {canCreate && (
          <Button
            onClick={() => navigate('/packages/new')}
            className="rounded-xl gap-2 bg-violet-600 hover:bg-violet-500 shadow-lg shadow-violet-600/25 h-11 px-5"
          >
            <Plus className="w-4 h-4" /> Add Package
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Packages',
            value: packages.length,
            sub: 'All Active Packages',
            icon: Package,
            tone: 'from-violet-500/15 to-indigo-500/10 border-violet-400/25',
          },
          {
            label: 'Total Bookings',
            value: totalBookings,
            sub: 'From These Packages',
            icon: TrendingUp,
            tone: 'from-sky-500/15 to-blue-500/10 border-sky-400/25',
          },
          {
            label: 'Total Revenue',
            value: formatINR(totalRevenue),
            sub: 'From These Packages',
            icon: IndianRupee,
            tone: 'from-emerald-500/15 to-teal-500/10 border-emerald-400/25',
            isText: true,
          },
          {
            label: 'Popular Package',
            value: popularPackage?.name || '—',
            sub: popularPackage ? `${popularPackage.bookingCount || 0} bookings` : 'Most Booked',
            icon: Star,
            tone: 'from-amber-500/15 to-orange-500/10 border-amber-400/25',
            isText: true,
          },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className={`rounded-2xl border bg-gradient-to-br ${stat.tone} backdrop-blur-sm p-5 shadow-sm`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[11px] uppercase font-bold text-content-muted tracking-wide">{stat.label}</p>
                  <p className={`font-black text-content-primary mt-2 ${stat.isText ? 'text-base leading-snug line-clamp-2' : 'text-3xl'}`}>
                    {stat.value}
                  </p>
                  <p className="text-xs text-content-muted mt-1">{stat.sub}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-white/70 dark:bg-slate-900/50 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-violet-600" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-violet-500/15 bg-white/80 dark:bg-slate-900/50 backdrop-blur-xl shadow-lg shadow-violet-500/5 overflow-hidden">
        <div className="p-4 border-b border-violet-500/10 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search packages..."
              className="input-premium w-full h-10 pl-10 rounded-xl text-sm"
            />
          </div>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="input-premium h-10 rounded-xl text-sm min-w-[130px]">
            <option value="">All Types</option>
            {PACKAGE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <select value={destinationFilter} onChange={(e) => setDestinationFilter(e.target.value)} className="input-premium h-10 rounded-xl text-sm min-w-[150px]">
            <option value="">All Destinations</option>
            {destinations.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input-premium h-10 rounded-xl text-sm min-w-[130px]">
            <option value="">All Status</option>
            {PACKAGE_STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="p-8 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-14 rounded-xl bg-surface-elevated animate-pulse" />
            ))}
          </div>
        ) : filteredPackages.length === 0 ? (
          <div className="p-16 text-center">
            <Package className="w-12 h-12 text-content-muted mx-auto mb-3" />
            <p className="text-content-muted mb-4">No packages yet. Create your first travel package.</p>
            {canCreate && (
              <Button onClick={() => navigate('/packages/new')} className="rounded-xl gap-2 bg-violet-600 hover:bg-violet-500">
                <Plus className="w-4 h-4" /> Add Package
              </Button>
            )}
          </div>
        ) : (
          <PackageDataTable
            packages={filteredPackages}
            onEdit={(p) => navigate(`/packages/${p._id}/edit`)}
            onDelete={handleDelete}
            onDuplicate={handleDuplicate}
          />
        )}
      </div>

      <ResourceManagement
        hotels={hotels}
        cabs={cabs}
        flights={flights}
        activities={activities}
        onSave={handleResourceSave}
        onDelete={handleResourceDelete}
      />
      {dialogNode}
    </motion.div>
  );
}
