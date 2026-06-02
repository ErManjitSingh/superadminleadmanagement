import { User, Plane, Megaphone } from 'lucide-react';
import { LEAD_SOURCES, PRIORITIES, LEAD_TYPES } from '../constants';
import { defaultWizardValues } from '../constants';

function ReviewSection({ icon: Icon, title, children, color = 'brand' }) {
  const colors = {
    brand: 'bg-brand-500/10 text-brand-600',
    violet: 'bg-violet-500/10 text-violet-600',
    amber: 'bg-amber-500/10 text-amber-600',
  };
  return (
    <div className="rounded-xl border border-subtle bg-surface-elevated/30 p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colors[color]}`}>
          <Icon className="w-4 h-4" />
        </div>
        <h4 className="text-sm font-semibold text-content-primary">{title}</h4>
      </div>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
        {children}
      </dl>
    </div>
  );
}

function Row({ label, value }) {
  const display =
    value === undefined || value === null || value === ''
      ? '—'
      : String(value);
  return (
    <>
      <dt className="text-content-muted">{label}</dt>
      <dd className="font-medium text-content-primary text-right sm:text-left">{display}</dd>
    </>
  );
}

export default function StepReview({ data }) {
  const v = { ...defaultWizardValues, ...(data || {}) };

  const sourceLabel = LEAD_SOURCES.find((s) => s.value === v.leadSource)?.label || v.leadSource;
  const priorityLabel = PRIORITIES.find((p) => p.value === v.priority)?.label || v.priority;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-content-primary">Review & Confirm</h2>
        <p className="text-sm text-content-muted mt-1">Verify details before saving the lead</p>
      </div>

      <ReviewSection icon={User} title="Customer Details" color="brand">
        <Row label="Name" value={v.name} />
        <Row label="Phone" value={v.phone} />
        <Row label="WhatsApp" value={v.whatsapp || v.phone} />
        <Row label="Email" value={v.email} />
        <Row label="City" value={v.city} />
        <Row label="State" value={v.state} />
      </ReviewSection>

      <ReviewSection icon={Plane} title="Travel Details" color="violet">
        <Row label="Lead Type" value={LEAD_TYPES.find((t) => t.value === v.leadType)?.label || v.leadType} />
        {v.leadType === 'corporate' && <Row label="Company" value={v.companyName} />}
        <Row label="Destination" value={v.destination} />
        <Row label="Travel Date" value={v.travelDate} />
        <Row label="Adults" value={v.adults} />
        <Row label="Children" value={v.children} />
        <Row label="Infants" value={v.infants} />
      </ReviewSection>

      <ReviewSection icon={Megaphone} title="Lead Information" color="amber">
        <Row label="Source" value={sourceLabel} />
        <Row label="Priority" value={priorityLabel} />
        <Row label="Branch" value={v.branchId || 'Current selected branch'} />
      </ReviewSection>
    </div>
  );
}
