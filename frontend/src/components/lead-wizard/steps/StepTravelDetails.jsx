import { useEffect, useState } from 'react';
import { useWizardForm } from '../WizardFormContext';
import { motion } from 'framer-motion';
import { Search, Calendar, IndianRupee } from 'lucide-react';
import WizardField, { WizardInput } from '../WizardField';
import { DESTINATIONS, LEAD_TYPES } from '../constants';
import API from '../../../api/axios';
import { cn } from '../../../lib/utils';

const BUDGET_RANGE_OPTIONS = [
  { value: 'under_20000', label: 'Under 20,000', amount: 20000 },
  { value: '20000_40000', label: '20,000 - 40,000', amount: 30000 },
  { value: '40000_60000', label: '40,000 - 60,000', amount: 50000 },
  { value: '60000_100000', label: '60,000 - 100,000', amount: 80000 },
  { value: 'above_100000', label: 'Above 100,000', amount: 120000 },
  { value: 'custom', label: 'Custom Budget', amount: '' },
];

export default function StepTravelDetails() {
  const { register, watch, setValue, formState: { errors } } = useWizardForm();
  const destination = watch('destination') || '';
  const leadType = watch('leadType') || 'fit';
  const budgetRange = watch('budgetRange') || '';
  const [open, setOpen] = useState(false);
  const [destinationOptions, setDestinationOptions] = useState(DESTINATIONS);

  useEffect(() => {
    API.get('/destination-assignment/destinations', { skipSuccessToast: true, skipErrorToast: true })
      .then((r) => {
        const names = (r.data || [])
          .filter((d) => d.status === 'active')
          .map((d) => d.name)
          .filter(Boolean);
        if (names.length) setDestinationOptions(names);
      })
      .catch(() => {});
  }, []);

  const filtered = destinationOptions.filter((d) =>
    d.toLowerCase().includes(destination.toLowerCase())
  ).slice(0, 8);

  const pickDestination = (d) => {
    setValue('destination', d);
    setOpen(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -24 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-xl font-bold text-content-primary">Travel Details</h2>
        <p className="text-sm text-content-muted mt-1">Where and when is the customer traveling?</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-content-primary mb-3">Lead Type</label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {LEAD_TYPES.map((type) => (
            <button
              key={type.value}
              type="button"
              onClick={() => setValue('leadType', type.value)}
              className={cn(
                'p-3 rounded-xl border text-left transition-all',
                leadType === type.value
                  ? 'border-brand-500/40 bg-brand-500/10 ring-2 ring-brand-500/20'
                  : 'border-subtle bg-surface hover:bg-surface-elevated'
              )}
            >
              <p className="font-semibold text-sm text-content-primary">{type.label}</p>
              <p className="text-xs text-content-muted mt-1">{type.description}</p>
            </button>
          ))}
        </div>
        <input type="hidden" {...register('leadType')} />
      </div>

      {leadType === 'corporate' && (
        <WizardField label="Company Name">
          <WizardInput {...register('companyName')} placeholder="Company / organization name" />
        </WizardField>
      )}

      <WizardField label="Destination" error={errors.destination?.message}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted" />
          <WizardInput
            {...register('destination')}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            placeholder="Search destination..."
            className="pl-10"
            error={errors.destination}
          />
          {open && filtered.length > 0 && (
            <div className="absolute z-20 w-full mt-1 rounded-xl border border-subtle bg-surface shadow-xl overflow-hidden">
              {filtered.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => pickDestination(d)}
                  className={cn(
                    'w-full text-left px-4 py-2.5 text-sm hover:bg-brand-500/5 transition-colors',
                    destination === d && 'bg-brand-500/10 text-brand-600 font-medium'
                  )}
                >
                  {d}
                </button>
              ))}
            </div>
          )}
        </div>
      </WizardField>

      <WizardField label="Travel Date" error={errors.travelDate?.message}>
        <div className="relative max-w-xs">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted pointer-events-none" />
          <WizardInput {...register('travelDate')} type="date" className="pl-10" error={errors.travelDate} />
        </div>
      </WizardField>

      <div className="grid grid-cols-3 gap-4">
        {[
          { key: 'adults', label: 'Adults', min: 1 },
          { key: 'children', label: 'Children', min: 0 },
          { key: 'infants', label: 'Infants', min: 0 },
        ].map(({ key, label, min }) => (
          <WizardField key={key} label={label} error={errors[key]?.message}>
            <WizardInput
              {...register(key)}
              type="number"
              min={min}
              className="text-center font-semibold metric-tabular"
              error={errors[key]}
            />
          </WizardField>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <WizardField label="Hotel Category">
          <select {...register('hotelCategory')} className="input-premium h-10">
            <option value="3_star">3 Star</option>
            <option value="4_star">4 Star</option>
            <option value="5_star">5 Star</option>
            <option value="luxury">Luxury</option>
            <option value="no_hotel">No Hotel (Cab only / without hotel)</option>
          </select>
        </WizardField>
        <WizardField label="Budget Range">
          <select
            {...register('budgetRange')}
            className="input-premium h-10"
            onChange={(e) => {
              const next = e.target.value;
              setValue('budgetRange', next);
              const picked = BUDGET_RANGE_OPTIONS.find((b) => b.value === next);
              if (picked && next !== 'custom') {
                setValue('budget', picked.amount);
                setValue('customBudget', '');
              }
            }}
          >
            <option value="">Select budget range</option>
            {BUDGET_RANGE_OPTIONS.map((b) => (
              <option key={b.value} value={b.value}>{b.label}</option>
            ))}
          </select>
        </WizardField>
        {budgetRange === 'custom' ? (
          <WizardField label="Custom Budget (₹)">
            <div className="relative">
              <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted pointer-events-none" />
              <WizardInput {...register('customBudget')} type="number" min={1000} className="pl-10" />
            </div>
          </WizardField>
        ) : (
          <WizardField label="Budget (₹)">
            <div className="relative">
              <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted pointer-events-none" />
              <WizardInput {...register('budget')} type="number" min={1000} className="pl-10" />
            </div>
          </WizardField>
        )}
        <WizardField label="Requirements">
          <textarea
            {...register('requirements')}
            className="input-premium min-h-[88px]"
            placeholder="Any special requirement..."
          />
        </WizardField>
      </div>
    </motion.div>
  );
}
