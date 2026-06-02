import { useEffect, useState } from 'react';
import { Plus, Star, Building2 } from 'lucide-react';
import API from '../../../api/axios';
import PageHeader from '../../ui/PageHeader';
import { Button } from '../../ui/button';
import VendorFormModal from './VendorFormModal';
import { VENDOR_TYPES } from '../constants';
import { cn } from '../../../lib/utils';

export default function VendorsPage() {
  const [vendors, setVendors] = useState([]);
  const [filter, setFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editVendor, setEditVendor] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchVendors = () => {
    setLoading(true);
    API.get('/operations-manager/vendors', { params: { type: filter || undefined } })
      .then((r) => setVendors(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchVendors(); }, [filter]);

  const handleSave = async (payload) => {
    if (editVendor?._id) {
      await API.put(`/operations-manager/vendors/${editVendor._id}`, payload);
    } else {
      await API.post('/operations-manager/vendors', payload);
    }
    setModalOpen(false);
    setEditVendor(null);
    fetchVendors();
  };

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        title="Vendor Management"
        description="Hotel, transport and activity supplier registry"
        breadcrumbs={['Operations', 'Vendors']}
        actions={
          <Button variant="teal" className="rounded-xl gap-2" onClick={() => { setEditVendor(null); setModalOpen(true); }}>
            <Plus className="w-4 h-4" /> Add Vendor
          </Button>
        }
      />

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setFilter('')} className={cn('px-3 py-1.5 rounded-lg text-xs font-medium border', !filter ? 'bg-teal-600 text-white border-teal-600' : 'border-subtle text-content-muted')}>All</button>
        {VENDOR_TYPES.map((t) => (
          <button key={t.value} type="button" onClick={() => setFilter(t.value)} className={cn('px-3 py-1.5 rounded-lg text-xs font-medium border capitalize', filter === t.value ? 'bg-teal-600 text-white border-teal-600' : 'border-subtle text-content-muted')}>{t.label}</button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full p-16 text-center text-content-muted animate-pulse">Loading vendors...</div>
        ) : vendors.map((v) => (
          <div key={v._id} className="rounded-2xl border border-subtle bg-surface/80 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-violet-500/10"><Building2 className="w-5 h-5 text-violet-600" /></div>
                <div>
                  <h3 className="font-bold">{v.name}</h3>
                  <p className="text-xs text-content-muted capitalize">{v.type}</p>
                </div>
              </div>
              <span className="flex items-center gap-1 text-xs font-bold text-amber-600"><Star className="w-3 h-3 fill-amber-400" />{v.rating}</span>
            </div>
            <p className="text-sm text-content-secondary">{v.contact}</p>
            <p className="text-xs text-content-muted mt-1">{v.email}</p>
            <p className="text-xs text-content-muted">{v.phone}</p>
            <div className="flex flex-wrap gap-1 mt-3">
              {v.destinations?.map((d) => (
                <span key={d} className="text-[10px] px-2 py-0.5 rounded-md bg-teal-500/10 text-teal-700">{d}</span>
              ))}
            </div>
            <Button variant="outline" size="sm" className="w-full mt-4 rounded-xl" onClick={() => { setEditVendor(v); setModalOpen(true); }}>Edit</Button>
          </div>
        ))}
      </div>

      <VendorFormModal open={modalOpen} vendor={editVendor} onClose={() => { setModalOpen(false); setEditVendor(null); }} onSave={handleSave} />
    </div>
  );
}
