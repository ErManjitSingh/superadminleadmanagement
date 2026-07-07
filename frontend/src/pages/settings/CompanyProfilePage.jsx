import { useCallback, useEffect, useRef, useState } from 'react';
import { Building2, CreditCard, Loader2, MapPin, Upload } from 'lucide-react';
import { toast } from '../../context/ToastContext';
import { useTenant } from '../../context/TenantContext';
import API from '../../api/axios';
import PageHeader from '../../components/ui/PageHeader';
import { readHotelImageFile } from '../../components/quotations/hotelImageUtils';

const EMPTY_BANK = { bank: '', accountName: '', accountNo: '', ifsc: '', branch: '', upi: '' };

export default function CompanyProfilePage() {
  const { refresh } = useTenant();
  const fileRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    tagline: '',
    phone: '',
    quotesEmail: '',
    website: '',
    address: '',
    city: '',
    state: '',
    gst: '',
    logo: '',
    upiId: '',
    upiName: '',
  });
  const [bank, setBank] = useState(EMPTY_BANK);

  const load = useCallback(async () => {
    const res = await API.get('/company-settings', { skipSuccessToast: true });
    const c = res.data?.company || {};
    setForm({
      name: c.name || '',
      tagline: c.tagline || '',
      phone: c.phone || '',
      quotesEmail: c.quotesEmail || c.ownerEmail || '',
      website: c.website || '',
      address: c.address || '',
      city: c.city || '',
      state: c.state || '',
      gst: c.gst || '',
      logo: c.logo || '',
      upiId: c.upiId || '',
      upiName: c.upiName || '',
    });
    setBank({ ...EMPTY_BANK, ...(c.bankAccounts?.[0] || {}) });
    setLoading(false);
  }, []);

  useEffect(() => {
    load().catch(() => setLoading(false));
  }, [load]);

  const setField = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const setBankField = (key) => (e) => setBank((b) => ({ ...b, [key]: e.target.value }));

  async function onLogoPick(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const dataUrl = await readHotelImageFile(file);
      setForm((f) => ({ ...f, logo: dataUrl }));
    } catch (err) {
      toast.error(err.message || 'Could not read image');
    }
  }

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const hasBank = bank.bank || bank.accountNo || bank.upi;
      await API.patch('/company-settings', {
        ...form,
        bankAccounts: hasBank ? [bank] : [],
      });
      toast.success('Company profile saved');
      await refresh?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Company Profile"
        description="This information appears on your quotation PDFs — logo, name, contact details and bank/UPI"
        breadcrumbs={['Settings', 'Company Profile']}
      />

      <form onSubmit={save} className="space-y-6">
        {/* Identity */}
        <section className="rounded-2xl border border-subtle bg-surface p-6">
          <h3 className="flex items-center gap-2 font-semibold text-content-primary">
            <Building2 className="h-5 w-5 text-violet-600" />
            Company Identity
          </h3>

          <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
              {form.logo ? (
                <img src={form.logo} alt="Logo" className="h-full w-full object-contain" />
              ) : (
                <Building2 className="h-8 w-8 text-slate-300" />
              )}
            </div>
            <div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onLogoPick} />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium hover:bg-slate-50"
              >
                <Upload className="h-4 w-4" /> Upload logo
              </button>
              {form.logo && (
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, logo: '' }))}
                  className="ml-2 text-sm font-medium text-red-600 hover:underline"
                >
                  Remove
                </button>
              )}
              <p className="mt-1.5 text-xs text-slate-500">PNG, JPG or WebP · max 500 KB</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="Company Name" value={form.name} onChange={setField('name')} required />
            <Field label="Tagline" value={form.tagline} onChange={setField('tagline')} placeholder="e.g. Travel made simple" />
          </div>
        </section>

        {/* Contact */}
        <section className="rounded-2xl border border-subtle bg-surface p-6">
          <h3 className="flex items-center gap-2 font-semibold text-content-primary">
            <MapPin className="h-5 w-5 text-violet-600" />
            Contact Details
          </h3>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="Phone" value={form.phone} onChange={setField('phone')} placeholder="+91 ..." />
            <Field label="Email (shown on quotes)" type="email" value={form.quotesEmail} onChange={setField('quotesEmail')} />
            <Field label="Website" value={form.website} onChange={setField('website')} placeholder="https://..." />
            <Field label="GST Number" value={form.gst} onChange={setField('gst')} />
            <div className="sm:col-span-2">
              <Field label="Address" value={form.address} onChange={setField('address')} />
            </div>
            <Field label="City" value={form.city} onChange={setField('city')} />
            <Field label="State" value={form.state} onChange={setField('state')} />
          </div>
        </section>

        {/* Bank & UPI */}
        <section className="rounded-2xl border border-subtle bg-surface p-6">
          <h3 className="flex items-center gap-2 font-semibold text-content-primary">
            <CreditCard className="h-5 w-5 text-violet-600" />
            Bank &amp; Payment (for quote PDFs)
          </h3>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="Bank Name" value={bank.bank} onChange={setBankField('bank')} />
            <Field label="Account Holder Name" value={bank.accountName} onChange={setBankField('accountName')} />
            <Field label="Account Number" value={bank.accountNo} onChange={setBankField('accountNo')} />
            <Field label="IFSC Code" value={bank.ifsc} onChange={setBankField('ifsc')} />
            <Field label="Branch" value={bank.branch} onChange={setBankField('branch')} />
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="UPI ID (for QR)" value={form.upiId} onChange={setField('upiId')} placeholder="name@bank" />
            <Field label="UPI Payee Name" value={form.upiName} onChange={setField('upiName')} placeholder="Displayed in UPI apps" />
          </div>
          <p className="mt-3 text-xs text-slate-500">
            The UPI ID generates a live "Scan to Pay" QR code on your quotation PDF.
          </p>
        </section>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-violet-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-600/25 hover:bg-violet-500 disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save Profile'}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', placeholder, required }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-600">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      <input
        className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-violet-400 focus:outline-none focus:ring-1 focus:ring-violet-400"
        value={value}
        onChange={onChange}
        type={type}
        placeholder={placeholder}
        required={required}
      />
    </div>
  );
}
