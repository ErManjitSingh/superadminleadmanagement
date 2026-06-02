import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Package } from 'lucide-react';
import API from '../../api/axios';
import { Button } from '../ui/button';
import PackageDataTable from './PackageDataTable';
import PackageFormModal from './PackageFormModal';
import ResourceManagement from './ResourceManagement';
import { PACKAGE_TYPES } from '../quotations/constants';
import { useDataRefresh } from '../../hooks/useDataRefresh';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';

export default function PackageManagementPage() {
  const [packages, setPackages] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [cabs, setCabs] = useState([]);
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editPackage, setEditPackage] = useState(null);
  const { confirm, dialogNode } = useConfirmDialog();

  const fetchAll = useCallback(() => {
    setLoading(true);
    Promise.all([
      API.get('/packages', { params: { search, packageType: typeFilter || undefined } }),
      API.get('/hotels'),
      API.get('/cabs'),
      API.get('/flights'),
    ]).then(([p, h, c, f]) => {
      setPackages(p.data);
      setHotels(h.data);
      setCabs(c.data);
      setFlights(f.data);
    }).finally(() => setLoading(false));
  }, [search, typeFilter]);

  useEffect(() => { fetchAll(); }, [fetchAll]);
  useDataRefresh(['packages'], fetchAll);

  const handleSave = async (data) => {
    if (editPackage) await API.put(`/packages/${editPackage._id}`, data);
    else await API.post('/packages', data);
    setModalOpen(false);
    setEditPackage(null);
    fetchAll();
  };

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

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-content-primary">Travel Packages</h1>
            <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-600 text-sm font-bold">{packages.length}</span>
          </div>
          <p className="text-sm text-content-muted">Package catalog, itinerary builder & inventory</p>
        </div>
        <Button onClick={() => { setEditPackage(null); setModalOpen(true); }} className="rounded-xl gap-2 bg-amber-600 hover:bg-amber-500 shadow-md shadow-amber-600/20">
          <Plus className="w-4 h-4" /> Add Package
        </Button>
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
      </div>

      {loading ? (
        <div className="rounded-2xl border border-subtle overflow-hidden mb-8 animate-pulse">
          <div className="h-12 bg-surface-elevated border-b border-subtle" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-14 border-b border-subtle/50 bg-surface-elevated/40" />
          ))}
        </div>
      ) : packages.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-subtle p-16 text-center mb-8">
          <Package className="w-12 h-12 text-content-muted mx-auto mb-3" />
          <p className="text-content-muted">No packages yet. Create your first travel package.</p>
        </div>
      ) : (
        <PackageDataTable
          packages={packages}
          onEdit={(p) => {
            setEditPackage(p);
            setModalOpen(true);
          }}
          onDelete={handleDelete}
          onDuplicate={handleDuplicate}
        />
      )}

      <ResourceManagement hotels={hotels} cabs={cabs} flights={flights} onSave={handleResourceSave} onDelete={handleResourceDelete} />

      <PackageFormModal open={modalOpen} onClose={() => { setModalOpen(false); setEditPackage(null); }} onSubmit={handleSave} editPackage={editPackage} />
      {dialogNode}
    </motion.div>
  );
}
