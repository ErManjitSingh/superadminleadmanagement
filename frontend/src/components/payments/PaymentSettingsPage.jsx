import { useState } from 'react';
import { Bell, Building2, FileText, Mail, MessageCircle, QrCode, Shield } from 'lucide-react';
import PageHeader from '../ui/PageHeader';
import { Button } from '../ui/button';
import { SectionCard } from './paymentsUi';
import { DEMO_SETTINGS } from './paymentsDemoData';
import { cn } from '../../lib/utils';

export default function PaymentSettingsPage() {
  const [settings, setSettings] = useState(DEMO_SETTINGS);

  const toggleGateway = (id) => {
    setSettings((prev) => ({
      ...prev,
      gateways: prev.gateways.map((g) => (g.id === id ? { ...g, enabled: !g.enabled } : g)),
    }));
  };

  const toggleFlag = (key) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payment Settings"
        description="Gateways, bank accounts, GST, prefixes, and automation"
        breadcrumbs={['Payments', 'Settings']}
        actions={<Button className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white">Save changes</Button>}
      />

      <div className="grid gap-4 xl:grid-cols-2">
        <SectionCard title="Payment Gateways">
          <div className="space-y-3">
            {settings.gateways.map((g) => (
              <div key={g.id} className="flex items-center justify-between rounded-xl border border-subtle px-4 py-3">
                <div className="flex items-center gap-3">
                  <Shield className="h-4 w-4 text-violet-500" />
                  <span className="text-sm font-medium text-content-primary">{g.name}</span>
                </div>
                <Toggle on={g.enabled} onClick={() => toggleGateway(g.id)} />
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Bank Accounts">
          <div className="space-y-3">
            {settings.bankAccounts.map((b) => (
              <div key={b.account} className="rounded-xl border border-subtle px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-sky-500" />
                    <span className="text-sm font-semibold text-content-primary">{b.bank}</span>
                  </div>
                  {b.primary && (
                    <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">Primary</span>
                  )}
                </div>
                <p className="mt-1 text-xs text-content-muted">
                  A/C {b.account} · IFSC {b.ifsc}
                </p>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="UPI IDs">
          <div className="space-y-2">
            {settings.upiIds.map((upi) => (
              <div key={upi} className="flex items-center gap-2 rounded-xl border border-subtle px-4 py-3 text-sm">
                <QrCode className="h-4 w-4 text-emerald-500" />
                <span className="font-medium text-content-primary">{upi}</span>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="GST Details">
          <dl className="space-y-3 text-sm">
            <Row label="GSTIN" value={settings.gst.number} />
            <Row label="Legal name" value={settings.gst.legalName} />
            <Row label="Address" value={settings.gst.address} />
          </dl>
        </SectionCard>

        <SectionCard title="Document Prefixes">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs">
              <span className="mb-1 flex items-center gap-1 font-medium text-content-muted">
                <FileText className="h-3.5 w-3.5" /> Invoice prefix
              </span>
              <input
                className="input-premium w-full"
                value={settings.invoicePrefix}
                onChange={(e) => setSettings((s) => ({ ...s, invoicePrefix: e.target.value }))}
              />
            </label>
            <label className="text-xs">
              <span className="mb-1 flex items-center gap-1 font-medium text-content-muted">
                <FileText className="h-3.5 w-3.5" /> Receipt prefix
              </span>
              <input
                className="input-premium w-full"
                value={settings.receiptPrefix}
                onChange={(e) => setSettings((s) => ({ ...s, receiptPrefix: e.target.value }))}
              />
            </label>
          </div>
        </SectionCard>

        <SectionCard title="Automation & Messaging">
          <div className="space-y-3">
            <ToggleRow
              icon={Bell}
              label="Auto reminder settings"
              description="Send due payment reminders automatically"
              on={settings.autoReminder}
              onClick={() => toggleFlag('autoReminder')}
            />
            <ToggleRow
              icon={FileText}
              label="Auto invoice settings"
              description="Generate invoice when payment is received"
              on={settings.autoInvoice}
              onClick={() => toggleFlag('autoInvoice')}
            />
            <ToggleRow
              icon={MessageCircle}
              label="WhatsApp settings"
              description="Share receipts and payment links on WhatsApp"
              on={settings.whatsappReceipts}
              onClick={() => toggleFlag('whatsappReceipts')}
            />
            <div className="flex items-center gap-3 rounded-xl border border-subtle px-4 py-3">
              <Mail className="h-4 w-4 text-violet-500" />
              <div>
                <p className="text-sm font-medium text-content-primary">Email templates</p>
                <p className="text-xs text-content-muted">Payment confirmation, invoice, and reminder templates</p>
              </div>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

function Toggle({ on, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative h-6 w-11 rounded-full transition-colors',
        on ? 'bg-violet-600' : 'bg-slate-300 dark:bg-slate-600'
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
          on ? 'left-5' : 'left-0.5'
        )}
      />
    </button>
  );
}

function ToggleRow({ icon: Icon, label, description, on, onClick }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-subtle px-4 py-3">
      <div className="flex items-center gap-3">
        <Icon className="h-4 w-4 text-violet-500" />
        <div>
          <p className="text-sm font-medium text-content-primary">{label}</p>
          <p className="text-xs text-content-muted">{description}</p>
        </div>
      </div>
      <Toggle on={on} onClick={onClick} />
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-surface-muted/40 px-3 py-2">
      <dt className="text-content-muted">{label}</dt>
      <dd className="font-medium text-content-primary text-right">{value}</dd>
    </div>
  );
}
