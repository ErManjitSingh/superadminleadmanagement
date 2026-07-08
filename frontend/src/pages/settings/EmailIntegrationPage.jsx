import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail, CheckCircle2, XCircle, Loader2, Eye, EyeOff, Send, Save, Unplug,
  Shield, History, FileText, Sparkles, RefreshCw,
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/button';
import { cn } from '../../lib/utils';
import {
  fetchEmailIntegrationSettings,
  testEmailSmtp,
  saveEmailIntegration,
  disconnectEmailIntegration,
  fetchEmailIntegrationLogs,
} from '../../services/emailIntegrationApi';
import {
  EMAIL_PROVIDERS,
  SETUP_GUIDES,
  EMAIL_MODULES,
  TEMPLATE_VARIABLES,
  TEMPLATE_LINKS,
  ENCRYPTION_OPTIONS,
  applyProviderPreset,
} from '../../constants/emailIntegration';

const EMPTY_FORM = {
  smtpProvider: 'hostinger',
  smtpFromEmail: '',
  smtpHost: 'smtp.hostinger.com',
  smtpPort: 465,
  smtpEncryption: 'ssl',
  smtpUser: '',
  smtpPass: '',
  smtpFromName: '',
  smtpReplyTo: '',
  smtpBounceEmail: '',
  emailModules: {},
  emailSignature: {
    logoUrl: '',
    companyName: '',
    address: '',
    phone: '',
    website: '',
    whatsapp: '',
    facebook: '',
    instagram: '',
    footerText: '',
  },
};

function formatDate(d) {
  if (!d) return '—';
  const dt = new Date(d);
  const today = new Date();
  if (dt.toDateString() === today.toDateString()) return 'Today';
  return dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function StatusBadge({ status }) {
  const verified = status === 'verified';
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold',
      verified
        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
        : 'border-amber-200 bg-amber-50 text-amber-700',
    )}>
      {verified ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
      {verified ? 'Verified' : 'Not Verified'}
    </span>
  );
}

export default function EmailIntegrationPage() {
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [status, setStatus] = useState(null);
  const [showPass, setShowPass] = useState(false);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [error, setError] = useState('');
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchEmailIntegrationSettings();
      const s = data.settings || {};
      setForm({
        smtpProvider: s.smtpProvider || 'hostinger',
        smtpFromEmail: s.smtpFromEmail || '',
        smtpHost: s.smtpHost || 'smtp.hostinger.com',
        smtpPort: s.smtpPort || 465,
        smtpEncryption: s.smtpEncryption || 'ssl',
        smtpUser: s.smtpUser || '',
        smtpPass: '',
        smtpFromName: s.smtpFromName || '',
        smtpReplyTo: s.smtpReplyTo || '',
        smtpBounceEmail: s.smtpBounceEmail || '',
        emailModules: s.emailModules || {},
        emailSignature: { ...EMPTY_FORM.emailSignature, ...(s.emailSignature || {}) },
      });
      setStatus(data.status || null);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load email settings');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadLogs = useCallback(async () => {
    setLogsLoading(true);
    try {
      const data = await fetchEmailIntegrationLogs({ limit: 10 });
      setLogs(data.items || []);
    } catch {
      setLogs([]);
    } finally {
      setLogsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    loadLogs();
  }, [load, loadLogs]);

  const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const setSignature = (key, value) => setForm((f) => ({
    ...f,
    emailSignature: { ...f.emailSignature, [key]: value },
  }));
  const toggleModule = (key) => setForm((f) => ({
    ...f,
    emailModules: { ...f.emailModules, [key]: !f.emailModules[key] },
  }));

  const handleProviderChange = (providerId) => {
    setForm((f) => applyProviderPreset(providerId, { ...f, smtpProvider: providerId }));
    setTestResult(null);
  };

  const buildPayload = () => ({
    ...form,
    smtpUser: form.smtpUser || form.smtpFromEmail,
  });

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    setError('');
    try {
      const result = await testEmailSmtp(buildPayload());
      setTestResult({ ok: true, message: result.message || 'SMTP Connected Successfully' });
      await load();
    } catch (err) {
      const msg = err.response?.data?.message || 'SMTP test failed';
      setTestResult({ ok: false, message: msg });
      setError(msg);
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      await saveEmailIntegration(buildPayload());
      setTestResult({ ok: true, message: 'Configuration saved and verified' });
      await load();
      await loadLogs();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm('Disconnect official business email? CRM emails will stop using your domain.')) return;
    setDisconnecting(true);
    try {
      await disconnectEmailIntegration();
      setForm(EMPTY_FORM);
      setTestResult(null);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Disconnect failed');
    } finally {
      setDisconnecting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        title="Official Business Email"
        description="Connect your company email to send Quotations, Invoices, Receipts, Vouchers, Follow-ups and all CRM emails using your own domain."
        breadcrumbs={['Settings', 'Email Integration']}
      />

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      )}

      <AnimatePresence>
        {testResult && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={cn(
              'rounded-2xl border px-5 py-4 flex items-center gap-3',
              testResult.ok ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-rose-200 bg-rose-50 text-rose-800',
            )}
          >
            {testResult.ok ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <XCircle className="w-5 h-5 shrink-0" />}
            <p className="text-sm font-semibold">{testResult.message}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status Card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl border border-white/20 bg-gradient-to-br from-violet-600 via-indigo-600 to-violet-700 p-6 text-white shadow-xl"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_50%)]" />
        <div className="relative grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="text-xs uppercase tracking-widest text-white/70 mb-2">Connection Status</p>
            <StatusBadge status={status?.emailStatus} />
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-white/70">Connected Email</p>
            <p className="font-bold mt-1">{status?.connectedEmail || '—'}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-white/70">Provider</p>
            <p className="font-bold mt-1">{status?.provider || '—'}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-white/70">Last Tested</p>
            <p className="font-bold mt-1">{formatDate(status?.lastTested)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-white/70">Emails Sent Today</p>
            <p className="font-bold mt-1 tabular-nums">{status?.emailsSentToday ?? 0}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-white/70">Remaining Daily Limit</p>
            <p className="font-bold mt-1 tabular-nums">{status?.remainingDailyLimit ?? 1000}</p>
          </div>
        </div>
      </motion.div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          {/* Provider */}
          <section className="rounded-3xl border border-subtle bg-white/80 backdrop-blur-xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-content-primary mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-violet-600" /> Connection Method
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {EMAIL_PROVIDERS.map((p) => (
                <label
                  key={p.id}
                  className={cn(
                    'flex items-center gap-3 rounded-2xl border p-4 cursor-pointer transition-all',
                    form.smtpProvider === p.id
                      ? 'border-violet-400 bg-violet-50 shadow-sm'
                      : 'border-subtle hover:border-violet-200',
                  )}
                >
                  <input
                    type="radio"
                    name="provider"
                    checked={form.smtpProvider === p.id}
                    onChange={() => handleProviderChange(p.id)}
                    className="accent-violet-600"
                  />
                  <span className="text-sm font-semibold text-content-primary">{p.label}</span>
                </label>
              ))}
            </div>
          </section>

          {/* SMTP Config */}
          <section className="rounded-3xl border border-subtle bg-white/80 backdrop-blur-xl p-6 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-content-primary flex items-center gap-2">
              <Mail className="w-5 h-5 text-violet-600" /> SMTP Configuration
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Official Email Address *" hint="sales@company.com">
                <input className="input-premium w-full" value={form.smtpFromEmail} onChange={(e) => setField('smtpFromEmail', e.target.value)} placeholder="sales@company.com" />
              </Field>
              <Field label="SMTP Host *" hint="smtp.hostinger.com">
                <input className="input-premium w-full" value={form.smtpHost} onChange={(e) => setField('smtpHost', e.target.value)} />
              </Field>
              <Field label="SMTP Port *" hint="465">
                <input type="number" className="input-premium w-full" value={form.smtpPort} onChange={(e) => setField('smtpPort', Number(e.target.value))} />
              </Field>
              <Field label="Encryption *">
                <select className="input-premium w-full" value={form.smtpEncryption} onChange={(e) => setField('smtpEncryption', e.target.value)}>
                  {ENCRYPTION_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </Field>
              <Field label="SMTP Username *" hint="Usually email address">
                <input className="input-premium w-full" value={form.smtpUser} onChange={(e) => setField('smtpUser', e.target.value)} placeholder={form.smtpFromEmail || 'sales@company.com'} />
              </Field>
              <Field label="SMTP Password *">
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    className="input-premium w-full pr-10"
                    value={form.smtpPass}
                    onChange={(e) => setField('smtpPass', e.target.value)}
                    placeholder={status?.emailStatus === 'verified' ? '•••••••• (unchanged if blank)' : 'Enter password'}
                  />
                  <button type="button" onClick={() => setShowPass((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-content-muted">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </Field>
              <Field label="Sender Name *" hint="Explore My Bharat">
                <input className="input-premium w-full" value={form.smtpFromName} onChange={(e) => setField('smtpFromName', e.target.value)} />
              </Field>
              <Field label="Reply To Email" hint="Optional">
                <input className="input-premium w-full" value={form.smtpReplyTo} onChange={(e) => setField('smtpReplyTo', e.target.value)} />
              </Field>
              <Field label="Bounce Email" hint="Optional" className="sm:col-span-2">
                <input className="input-premium w-full" value={form.smtpBounceEmail} onChange={(e) => setField('smtpBounceEmail', e.target.value)} />
              </Field>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <Button variant="outline" onClick={handleTest} disabled={testing || saving}>
                {testing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                Test SMTP
              </Button>
              <Button onClick={handleSave} disabled={saving || testing} className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Save Configuration
              </Button>
              <Button variant="destructive" onClick={handleDisconnect} disabled={disconnecting || status?.emailStatus !== 'verified'}>
                {disconnecting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Unplug className="w-4 h-4 mr-2" />}
                Disconnect Email
              </Button>
            </div>
          </section>

          {/* Email Modules */}
          <section className="rounded-3xl border border-subtle bg-white/80 backdrop-blur-xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-content-primary mb-4">Email Modules</h3>
            <p className="text-sm text-content-muted mb-4">Enable or disable which CRM emails use your official business email.</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {EMAIL_MODULES.map((m) => (
                <label key={m.key} className="flex items-center gap-3 rounded-xl border border-subtle px-4 py-3 cursor-pointer hover:bg-violet-50/50">
                  <input type="checkbox" checked={form.emailModules[m.key] !== false} onChange={() => toggleModule(m.key)} className="accent-violet-600 rounded" />
                  <span className="text-sm font-medium">{m.label}</span>
                </label>
              ))}
            </div>
          </section>

          {/* Signature */}
          <section className="rounded-3xl border border-subtle bg-white/80 backdrop-blur-xl p-6 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-content-primary">Email Signature</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                ['logoUrl', 'Company Logo URL'],
                ['companyName', 'Company Name'],
                ['address', 'Address'],
                ['phone', 'Phone'],
                ['website', 'Website'],
                ['whatsapp', 'WhatsApp'],
                ['facebook', 'Facebook'],
                ['instagram', 'Instagram'],
              ].map(([key, label]) => (
                <Field key={key} label={label}>
                  <input className="input-premium w-full" value={form.emailSignature[key] || ''} onChange={(e) => setSignature(key, e.target.value)} />
                </Field>
              ))}
              <Field label="Footer Text" className="sm:col-span-2">
                <textarea className="input-premium w-full min-h-[80px]" value={form.emailSignature.footerText || ''} onChange={(e) => setSignature('footerText', e.target.value)} />
              </Field>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          {/* Quick Setup Guides */}
          <section className="rounded-3xl border border-subtle bg-slate-50/80 backdrop-blur-xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-content-primary mb-4">Quick Setup Guides</h3>
            <div className="space-y-3">
              {SETUP_GUIDES.map((g) => (
                <div key={g.name} className="rounded-2xl border border-subtle bg-white p-4">
                  <p className="font-bold text-sm text-content-primary">{g.name}</p>
                  <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-content-muted">
                    <div><span className="font-semibold text-content-secondary">Host</span><br />{g.host}</div>
                    <div><span className="font-semibold text-content-secondary">Port</span><br />{g.port}</div>
                    <div><span className="font-semibold text-content-secondary">Encryption</span><br />{g.encryption}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Template Variables */}
          <section className="rounded-3xl border border-subtle bg-white/80 backdrop-blur-xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-content-primary mb-3 flex items-center gap-2">
              <FileText className="w-5 h-5 text-violet-600" /> Template Variables
            </h3>
            <div className="flex flex-wrap gap-2">
              {TEMPLATE_VARIABLES.map((v) => (
                <code key={v} className="rounded-lg bg-violet-50 border border-violet-100 px-2.5 py-1 text-xs font-mono text-violet-700">{v}</code>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-subtle">
              <p className="text-sm font-semibold text-content-primary mb-2">Edit Templates</p>
              <div className="flex flex-wrap gap-2">
                {TEMPLATE_LINKS.map((t) => (
                  <Link key={t.label} to="/settings/email-templates" className="text-xs font-medium text-violet-600 hover:underline">{t.label}</Link>
                ))}
              </div>
            </div>
          </section>

          {/* Security */}
          <section className="rounded-3xl border border-emerald-200 bg-emerald-50/50 p-5">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-emerald-900 text-sm">Security</p>
                <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                  SMTP passwords are encrypted in the database and never exposed to the browser after saving.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Email Activity */}
      <section className="rounded-3xl border border-subtle bg-white/80 backdrop-blur-xl p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h3 className="text-lg font-bold text-content-primary flex items-center gap-2">
            <History className="w-5 h-5 text-violet-600" /> Email Activity
          </h3>
          <Button variant="outline" size="sm" onClick={loadLogs} disabled={logsLoading}>
            <RefreshCw className={cn('w-4 h-4 mr-1', logsLoading && 'animate-spin')} /> Refresh
          </Button>
        </div>
        <div className="overflow-x-auto rounded-2xl border border-subtle">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-content-muted">
              <tr>
                <th className="px-4 py-3">Recipient</th>
                <th className="px-4 py-3">Subject</th>
                <th className="px-4 py-3">Module</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {logsLoading && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-content-muted"><Loader2 className="w-5 h-5 animate-spin inline" /></td></tr>
              )}
              {!logsLoading && logs.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-content-muted">No email activity yet</td></tr>
              )}
              {!logsLoading && logs.map((log) => (
                <tr key={log.id} className="border-t border-subtle">
                  <td className="px-4 py-3 font-medium">{log.recipient}</td>
                  <td className="px-4 py-3 max-w-[200px] truncate">{log.subject}</td>
                  <td className="px-4 py-3 capitalize">{String(log.module || '').replace(/_/g, ' ')}</td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      'rounded-full px-2 py-0.5 text-xs font-bold capitalize',
                      log.status === 'delivered' || log.status === 'sent' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700',
                    )}>
                      {log.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-content-muted">{formatDate(log.date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Field({ label, hint, className, children }) {
  return (
    <label className={cn('block', className)}>
      <span className="text-xs font-semibold text-content-muted">{label}</span>
      {children}
      {hint && <span className="text-[11px] text-content-muted mt-1 block">{hint}</span>}
    </label>
  );
}
