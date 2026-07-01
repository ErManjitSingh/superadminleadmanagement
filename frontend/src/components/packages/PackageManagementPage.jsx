import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Search, Package, LayoutGrid, List, BarChart3 } from 'lucide-react';
import API from '../../api/axios';
import { Button } from '../ui/button';
import PackageCard from './PackageCard';
import PackageDataTable from './PackageDataTable';
import ResourceManagement from './ResourceManagement';
import { PACKAGE_TYPES } from '../quotations/constants';
import { PACKAGE_STATUS_OPTIONS } from './builder/packageBuilderConstants';
import { useDataRefresh } from '../../hooks/useDataRefresh';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import { cn } from '../../lib/utils';

export default function PackageManagementPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [packages, setPackages] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [cabs, setCabs] = useState([]);
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [viewMode, setViewMode] = useState('cards');
  const { confirm, dialogNode } = useConfirmDialog();

  const fetchAll = useCallback(() => {
    setLoading(true);
    Promise.all([
      API.get('/packages', { params: { search, packageType: typeFilter || undefined, status: statusFilter || undefined } }),
      API.get('/hotels'),
      API.get('/cabs'),
      API.get('/flights'),
    ]).then(([p, h, c, f]) => {
      setPackages(p.data);
      setHotels(h.data);
      setCabs(c.data);
      setFlights(f.data);
    }).finally(() => setLoading(false));
  }, [search, typeFilter, statusFilter]);

  useEffect(() => { fetchAll(); }, [fetchAll]);
  useDataRefresh(['packages'], fetchAll);

  useEffect(() => {
    if (location.state?.message) {
      fetchAll();
    }
  }, [location.state, fetchAll]);

  const handleDuplicate = async (id) => {
    await API.post(`/packages/duplicate/${id}`);
    fetchAll();
  };

  const handleArchive = async (id) => {
    await API.post(`/packages/${id}/archive`);
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
    const path = `/${type}`;
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
    await API.delete(`/${type}/${id}`);
    fetchAll();
  };

  const totalQuotes = packages.reduce((s, p) => s + (p.quotationCount || 0), 0);
  const publishedCount = packages.filter((p) => p.status === 'published').length;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-8">
      {location.state?.message && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-sm text-emerald-800">
          {location.state.message}
        </div>
      )}

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-content-primary">Travel Packages</h1>
            <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-600 text-sm font-bold">{packages.length}</span>
          </div>
          <p className="text-sm text-content-muted">Product catalog — build once, quote unlimited times</p>
        </div>
        <Button onClick={() => navigate('/packages/new')} className="rounded-xl gap-2 bg-amber-600 hover:bg-amber-500 shadow-md shadow-amber-600/20">
          <Plus className="w-4 h-4" /> Create Package
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Packages', value: packages.length, icon: Package },
          { label: 'Published', value: publishedCount, icon: BarChart3 },
          { label: 'Quotations', value: totalQuotes, icon: BarChart3 },
          { label: 'Drafts', value: packages.filter((p) => p.status === 'draft').length, icon: Package },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-subtle bg-white/60 dark:bg-slate-900/40 backdrop-blur-sm p-4">
            <p className="text-[10px] uppercase font-bold text-content-muted">{stat.label}</p>
            <p className="text-2xl font-black text-content-primary mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search packages..." className="input-premium w-full h-10 pl-10 rounded-xl text-sm" />
        </div>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="input-premium h-10 rounded-xl text-sm min-w-[140px]">
          <option value="">All Types</option>
          {PACKAGE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input-premium h-10 rounded-xl text-sm min-w-[140px]">
          <option value="">All Status</option>
          {PACKAGE_STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <div className="flex gap-1 p-1 rounded-xl border border-subtle bg-surface-elevated">
          <button type="button" onClick={() => setViewMode('cards')} className={cn('p-2 rounded-lg', viewMode === 'cards' ? 'bg-amber-500 text-white' : 'text-content-muted')}>
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button type="button" onClick={() => setViewMode('table')} className={cn('p-2 rounded-lg', viewMode === 'table' ? 'bg-amber-500 text-white' : 'text-content-muted')}>
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-72 rounded-2xl bg-surface-elevated animate-pulse" />
          ))}
        </div>
      ) : packages.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-subtle p-16 text-center mb-8">
          <Package className="w-12 h-12 text-content-muted mx-auto mb-3" />
          <p className="text-content-muted mb-4">No packages yet. Build your first product with the premium builder.</p>
          <Button onClick={() => navigate('/packages/new')} className="rounded-xl gap-2">Create Package</Button>
        </div>
      ) : viewMode === 'cards' ? (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
          {packages.map((pkg, index) => (
            <PackageCard
              key={pkg._id}
              pkg={pkg}
              index={index}
              onEdit={() => navigate(`/packages/${pkg._id}/edit`)}
              onPreview={() => navigate(`/packages/${pkg._id}/edit`, { state: { preview: true } })}
              onDelete={handleDelete}
              onDuplicate={handleDuplicate}
              onArchive={handleArchive}
            />
          ))}
        </div>
      ) : (
        <PackageDataTable
          packages={packages}
          onEdit={(p) => navigate(`/packages/${p._id}/edit`)}
          onDelete={handleDelete}
          onDuplicate={handleDuplicate}
        />
      )}

      <ResourceManagement hotels={hotels} cabs={cabs} flights={flights} onSave={handleResourceSave} onDelete={handleResourceDelete} />
      {dialogNode}
    </motion.div>
  );
}
