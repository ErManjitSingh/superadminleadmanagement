import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWizardForm } from '../WizardFormContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, User, Phone, MapPin } from 'lucide-react';
import { checkLeadDuplicate } from '../../../services/leadEnterpriseApi';
import DuplicateLeadWarning from '../../leads/DuplicateLeadWarning';
import { useAuth } from '../../../context/AuthContext';
import WizardField, { WizardInput, WizardSelect } from '../WizardField';
import { INDIAN_STATES } from '../constants';

function normalizePhone(p) {
  return p?.replace(/\D/g, '').slice(-10) || '';
}

export default function StepCustomerDetails({ isEdit, leadId }) {
  const { user } = useAuth();
  const { register, watch, setValue, formState: { errors } } = useWizardForm();
  const phone = watch('phone');
  const email = watch('email');
  const name = watch('name');
  const [searching, setSearching] = useState(false);
  const [duplicate, setDuplicate] = useState(null);
  const [forceCreate, setForceCreate] = useState(false);
  const navigate = useNavigate();
  const canCreateAnyway = ['admin', 'sales_manager'].includes(user?.role);
  const canMerge = canCreateAnyway;

  useEffect(() => {
    if (forceCreate) return;
    const normalized = normalizePhone(phone);
    if (normalized.length >= 10 || email?.includes('@')) {
      setSearching(true);
      const t = setTimeout(() => {
        checkLeadDuplicate({ phone, email, excludeId: leadId })
          .then((res) => {
            const match = res.originalLead || res.matches?.[0] || null;
            setDuplicate(match);
          })
          .catch(() => setDuplicate(null))
          .finally(() => setSearching(false));
      }, 400);
      return () => clearTimeout(t);
    }
    setDuplicate(null);
  }, [phone, email, leadId, forceCreate]);

  const nameMatches = useMemo(() => {
    if (!name || name.length < 2 || !duplicate) return [];
    const q = name.toLowerCase();
    return duplicate.name?.toLowerCase().includes(q) ? [duplicate] : [];
  }, [name, duplicate]);

  const applyCustomer = (lead) => {
    setValue('name', lead.name);
    setValue('phone', lead.phone);
    setValue('email', lead.email || '');
    setValue('city', lead.city || 'Mumbai');
    setValue('whatsapp', lead.phone?.replace(/\D/g, '').slice(-10) || '');
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -24 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-xl font-bold text-content-primary">Customer Details</h2>
        <p className="text-sm text-content-muted mt-1">Enter contact information. We&apos;ll check for existing customers automatically.</p>
      </div>

      <AnimatePresence>
        {duplicate && !isEdit && !forceCreate && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
            <DuplicateLeadWarning
              match={duplicate}
              canCreateAnyway={canCreateAnyway}
              canMerge={canMerge}
              onCreateAnyway={() => setForceCreate(true)}
              onMerge={() => navigate(`/leads/${duplicate._id}`)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <WizardField label="Customer Name" error={errors.name?.message}>
          <WizardInput {...register('name')} placeholder="Full name" error={errors.name} />
        </WizardField>
        <WizardField label="Phone Number" error={errors.phone?.message} hint="10-digit Indian mobile">
          <WizardInput {...register('phone')} placeholder="+91 98765 43210" error={errors.phone} />
        </WizardField>
        <WizardField label="WhatsApp Number" hint="Leave blank to use phone number">
          <WizardInput {...register('whatsapp')} placeholder="Same as phone" error={errors.whatsapp} />
        </WizardField>
        <WizardField label="Email Address" error={errors.email?.message}>
          <WizardInput {...register('email')} type="email" placeholder="customer@email.com" error={errors.email} />
        </WizardField>
        <WizardField label="City" error={errors.city?.message}>
          <WizardInput {...register('city')} placeholder="Mumbai" error={errors.city} />
        </WizardField>
        <WizardField label="State" error={errors.state?.message}>
          <WizardSelect {...register('state')} error={errors.state}>
            <option value="">Select state</option>
            {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
          </WizardSelect>
        </WizardField>
      </div>

      {(nameMatches.length > 0 || searching) && (
        <div className="rounded-2xl border border-subtle bg-surface-elevated/40 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Search className="w-4 h-4 text-brand-600" />
            <p className="text-sm font-semibold text-content-primary">Existing Customers</p>
            {searching && <span className="text-xs text-content-muted">Searching...</span>}
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin">
            {nameMatches.map((m) => (
              <button
                key={m._id}
                type="button"
                onClick={() => applyCustomer(m)}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-subtle bg-surface hover:border-brand-500/30 hover:bg-brand-500/5 transition-all text-left"
              >
                <div className="w-9 h-9 rounded-full bg-brand-500/10 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-brand-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-content-primary truncate">{m.name}</p>
                  <p className="text-xs text-content-muted flex items-center gap-2 mt-0.5">
                    <Phone className="w-3 h-3" /> {m.phone}
                    <MapPin className="w-3 h-3 ml-1" /> {m.destination}
                  </p>
                </div>
                <span className="text-[10px] font-semibold uppercase text-brand-600 bg-brand-500/10 px-2 py-0.5 rounded-full shrink-0">
                  Use
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
