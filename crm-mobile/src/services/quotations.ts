import { apiClient, unwrapPagination } from '@/src/lib/apiClient';
import { getRoleApiPrefix } from '@/src/constants/roles';
import type { UserRole } from '@/src/types';

export interface Quotation {
  _id: string;
  quoteNumber?: string;
  status?: string;
  pricing?: {
    total?: number;
    grandTotal?: number;
    baseCost?: number;
    hotelCost?: number;
    cabCost?: number;
    taxes?: number;
    discount?: number;
  };
  costing?: { grandTotal?: number; subtotal?: number };
  packageSnapshot?: { name?: string; destination?: string; duration?: string | number; itinerary?: unknown[] };
  package?: { name?: string; destination?: string } | string;
  packageInfo?: {
    packageName?: string;
    destination?: string;
    duration?: number;
    adults?: number;
    children?: number;
    mealPlan?: string;
    hotelCategory?: string;
    travelDate?: string;
  };
  importantNotes?: {
    cancellationPolicy?: string;
    termsAndConditions?: string;
    travelGuidelines?: string;
  };
  paymentPlan?: Array<{ label?: string; percent?: number; amount?: number }>;
  lead?: { _id?: string; name?: string; phone?: string; destination?: string } | string;
  createdAt?: string;
  pdfUrl?: string;
  customizations?: string;
}

function quotationsBase(role: UserRole) {
  const prefix = getRoleApiPrefix(role);
  return prefix ? `${prefix}/quotations` : '/quotations';
}

function leadQuotationsPath(role: UserRole, leadId: string) {
  const prefix = getRoleApiPrefix(role);
  return prefix ? `${prefix}/leads/${leadId}/quotations` : `/leads/${leadId}/quotations`;
}

export function getQuotationTotal(q: Quotation): number {
  return (
    Number(q.pricing?.total) ||
    Number(q.pricing?.grandTotal) ||
    Number(q.costing?.grandTotal) ||
    0
  );
}

export function getQuotationPackageName(q: Quotation): string {
  if (q.packageInfo?.packageName) return q.packageInfo.packageName;
  if (q.packageSnapshot?.name) return q.packageSnapshot.name;
  if (typeof q.package === 'object' && q.package?.name) return q.package.name;
  return q.packageInfo?.destination || 'Package';
}

export async function fetchLeadQuotations(role: UserRole, leadId: string): Promise<Quotation[]> {
  const { data } = await apiClient.get(leadQuotationsPath(role, leadId), {
    params: { page: 1, limit: 50 },
  });
  if (Array.isArray(data)) return data;
  return data.quotations || data.items || data.data || [];
}

export async function fetchQuotation(role: UserRole, quoteId: string): Promise<Quotation> {
  try {
    const { data } = await apiClient.get(`${quotationsBase(role)}/${quoteId}`);
    return (data?.quotation || data) as Quotation;
  } catch (err) {
    // Fallback to shared quotations route (admin / cross-role)
    if (role !== 'admin') {
      const { data } = await apiClient.get(`/quotations/${quoteId}`);
      return (data?.quotation || data) as Quotation;
    }
    throw err;
  }
}

export async function createLeadQuotation(
  role: UserRole,
  payload: {
    leadId: string;
    packageName: string;
    amount: number;
    notes?: string;
    asDraft?: boolean;
    adults?: number;
    duration?: number;
    destination?: string;
  }
) {
  const amount = Number(payload.amount) || 0;
  const packageName = payload.packageName.trim() || 'Custom Package';
  const destination = (payload.destination || packageName).trim();

  const status =
    role === 'sales_executive'
      ? payload.asDraft
        ? 'draft'
        : 'pending_approval'
      : role === 'admin'
        ? payload.asDraft
          ? 'draft'
          : 'sent'
        : payload.asDraft
          ? 'draft'
          : 'approved';

  const snapshot = {
    name: packageName,
    destination,
    duration: payload.duration || 0,
  };

  const body: Record<string, unknown> = {
    leadId: payload.leadId,
    status,
    packageSnapshot: snapshot,
    packageInfo: {
      packageName,
      destination,
      duration: payload.duration || 0,
      adults: payload.adults || 2,
      children: 0,
      infants: 0,
      mealPlan: '',
      hotelCategory: '',
    },
    pricing: {
      baseCost: amount,
      hotelCost: 0,
      cabCost: 0,
      flightCost: 0,
      activityCost: 0,
      taxes: 0,
      markup: 0,
      discount: 0,
      gst: 0,
      total: amount,
    },
    costing: {
      lineItems: [],
      subtotal: amount,
      taxes: 0,
      markup: 0,
      discount: 0,
      grandTotal: amount,
    },
    paymentPlan: [
      { label: 'Advance', percent: 30, amount: Math.round(amount * 0.3) },
      { label: 'Balance', percent: 70, amount: Math.round(amount * 0.7) },
    ],
    importantNotes: {
      cancellationPolicy: '',
      termsAndConditions: '',
      travelGuidelines: payload.notes?.trim() || '',
      weather: '',
      packingTips: '',
    },
    customizations: payload.notes?.trim() || '',
    selectedHotels: [],
    selectedCabs: [],
    selectedFlights: [],
    selectedActivities: [],
  };

  // Sales executive API maps `body.package` → packageSnapshot (not ObjectId).
  // Admin/manager must NOT send `package` object (schema expects ObjectId).
  if (role === 'sales_executive') {
    body.package = snapshot;
  }

  const { data } = await apiClient.post(quotationsBase(role), body);
  return data.quotation || data;
}

export async function listMyQuotations(
  role: UserRole,
  params: { page?: number; limit?: number; status?: string; segment?: string } = {}
) {
  const base = quotationsBase(role);
  const path =
    params.segment && (role === 'sales_manager' || role === 'team_leader')
      ? `${base}/${params.segment}`
      : base;
  const { data } = await apiClient.get(path, {
    params: {
      page: params.page ?? 1,
      limit: params.limit ?? 30,
      status: params.status,
    },
  });
  return unwrapPagination<Quotation>(data);
}

export function buildQuotationPdfHtml(q: Quotation, companyName = 'Explore My Bharat'): string {
  const total = getQuotationTotal(q);
  const pkg = getQuotationPackageName(q);
  const dest = q.packageInfo?.destination || q.packageSnapshot?.destination || pkg;
  const leadName =
    typeof q.lead === 'object' && q.lead?.name ? q.lead.name : 'Customer';
  const leadPhone =
    typeof q.lead === 'object' && q.lead?.phone ? q.lead.phone : '';
  const notes = q.importantNotes?.travelGuidelines || q.customizations || '';
  const plan = (q.paymentPlan || [])
    .map(
      (p) =>
        `<tr><td>${escapeHtml(p.label || 'Payment')}</td><td>${p.percent || 0}%</td><td>₹${Number(p.amount || 0).toLocaleString('en-IN')}</td></tr>`
    )
    .join('');
  const snap = q.packageSnapshot as { itinerary?: Array<Record<string, unknown>> } | undefined;
  const days = Array.isArray(snap?.itinerary) ? snap!.itinerary! : [];
  const itineraryHtml = days
    .map((d, i) => {
      const day = d.day || i + 1;
      const title = escapeHtml(String(d.title || d.name || `Day ${day}`));
      const desc = escapeHtml(String(d.description || d.activities || ''));
      return `<div class="day"><strong>Day ${day}: ${title}</strong>${desc ? `<p>${desc}</p>` : ''}</div>`;
    })
    .join('');

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
<title>${escapeHtml(q.quoteNumber || 'Quotation')}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif; margin: 0; padding: 16px; color: #0f172a; background: #e2e8f0; }
  .paper { background: #fff; border-radius: 12px; padding: 20px; max-width: 720px; margin: 0 auto; }
  h1 { margin: 0 0 4px; font-size: 24px; color: #7c3aed; }
  .muted { color: #64748b; font-size: 13px; margin-bottom: 16px; }
  .row { display: flex; gap: 10px; margin-top: 8px; }
  .card { flex: 1; background: #f5f3ff; border-radius: 10px; padding: 12px; }
  .label { font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 700; }
  .value { font-size: 16px; font-weight: 800; margin-top: 4px; }
  h2 { font-size: 15px; margin: 18px 0 8px; }
  .day { background: #f8fafc; border-radius: 8px; padding: 10px; margin-bottom: 8px; }
  .day p { margin: 6px 0 0; color: #64748b; font-size: 13px; line-height: 1.4; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  th, td { text-align: left; padding: 10px 6px; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
  th { color: #64748b; font-size: 11px; text-transform: uppercase; }
  .total { margin-top: 16px; background: #7c3aed; color: #fff; border-radius: 12px; padding: 14px; display: flex; justify-content: space-between; align-items: center; }
  .total strong { font-size: 22px; }
  .notes { margin-top: 12px; background: #fff7ed; border-radius: 10px; padding: 12px; font-size: 13px; color: #9a3412; }
</style>
</head>
<body>
  <div class="paper">
    <h1>${escapeHtml(companyName)}</h1>
    <div class="muted">${escapeHtml(q.quoteNumber || 'Draft quotation')} · ${escapeHtml((q.status || 'draft').replace(/_/g, ' '))}</div>
    <div class="row">
      <div class="card"><div class="label">Guest</div><div class="value">${escapeHtml(leadName)}</div><div class="muted">${escapeHtml(leadPhone)}</div></div>
      <div class="card"><div class="label">Package</div><div class="value">${escapeHtml(pkg)}</div><div class="muted">${escapeHtml(String(dest))}</div></div>
    </div>
    ${itineraryHtml ? `<h2>Itinerary</h2>${itineraryHtml}` : ''}
    <h2>Payment plan</h2>
    <table>
      <thead><tr><th>Milestone</th><th>%</th><th>Amount</th></tr></thead>
      <tbody>${plan || '<tr><td colspan="3">Full amount on booking</td></tr>'}</tbody>
    </table>
    ${notes ? `<div class="notes">${escapeHtml(notes)}</div>` : ''}
    <div class="total"><span>Grand Total</span><strong>₹${total.toLocaleString('en-IN')}</strong></div>
  </div>
</body>
</html>`;
}

function escapeHtml(value: string) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
