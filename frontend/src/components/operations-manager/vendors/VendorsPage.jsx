import { useEffect, useMemo, useState } from 'react';
import { Plus, Star, Building2 } from 'lucide-react';
import API from '../../../api/axios';
import PageHeader from '../../ui/PageHeader';
import { Button } from '../../ui/button';
import VendorFormModal from './VendorFormModal';
import OperationsDataTable from '../ui/OperationsDataTable';
import OperationsFilterTabs from '../ui/OperationsFilterTabs';
import { VENDOR_TYPES } from '../constants';

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

  const filterOptions = useMemo(() => [
    { value: '', label: 'All' },
    ...VENDOR_TYPES.map((t) => ({ value: t.value, label: t.label })),
  ], []);

  const columns = useMemo(() => [
    {
      key: 'name',
      header: 'Vendor',
      render: (v) => (
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-violet-500/10 ring-1 ring-violet-500/10">
            <Building2 className="w-4 h-4 text-violet-600" />
          </div>
          <div>
            <p className="font-semibold">{v.name}</p>
            <p className="text-xs text-content-muted capitalize">{v.type}</p>
          </div>
        </div>
      ),
    },
    { key: 'contact', header: 'Contact', render: (v) => v.contact || '—' },
    { key: 'email', header: 'Email', className: 'text-content-secondary text-xs', render: (v) => v.email || '—' },
    { key: 'phone', header: 'Phone', className: 'text-xs', render: (v) => v.phone || '—' },
    {
      key: 'rating',
      header: 'Rating',
      render: (v) => (
        <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600">
          <Star className="w-3.5 h-3.5 fill-amber-400" />{v.rating ?? '—'}
        </span>
      ),
    },
    {
      key: 'destinations',
      header: 'Destinations',
      render: (v) => (
        <div className="flex flex-wrap gap-1 max-w-[200px]">
          {v.destinations?.length
            ? v.destinations.map((d) => (
              <span key={d} className="text-[10px] px-2 py-0.5 rounded-md bg-teal-500/10 text-teal-700">{d}</span>
            ))
            : '—'}
        </div>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (v) => (
        <Button
          variant="outline"
          size="sm"
          className="rounded-xl h-8"
          onClick={(e) => { e.stopPropagation(); setEditVendor(v); setModalOpen(true); }}
        >
          Edit
        </Button>
      ),
    },
  ], []);

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

      <OperationsFilterTabs options={filterOptions} value={filter} onChange={setFilter} />

      <OperationsDataTable
        columns={columns}
        data={vendors}
        loading={loading}
        emptyIcon={Building2}
        emptyTitle="No vendors found"
        emptyDescription="Add hotel, transport, and activity suppliers to your registry."
        footer={vendors.length ? `${vendors.length} vendor${vendors.length === 1 ? '' : 's'}` : undefined}
      />

      <VendorFormModal open={modalOpen} vendor={editVendor} onClose={() => { setModalOpen(false); setEditVendor(null); }} onSave={handleSave} />
    </div>
  );
}
