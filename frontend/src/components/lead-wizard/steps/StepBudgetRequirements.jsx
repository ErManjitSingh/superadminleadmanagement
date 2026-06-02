import { useFormContext } from 'react-hook-form';
import { motion } from 'framer-motion';
import { IndianRupee } from 'lucide-react';
import WizardField, { WizardInput, WizardSelect, WizardTextarea } from '../WizardField';
import { HOTEL_CATEGORIES, MEAL_PREFERENCES, TRANSPORT_OPTIONS } from '../constants';

export default function StepBudgetRequirements() {
  const { register, formState: { errors } } = useFormContext();

  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -24 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-xl font-bold text-content-primary">Budget & Requirements</h2>
        <p className="text-sm text-content-muted mt-1">Package preferences and special needs</p>
      </div>

      <WizardField label="Budget (₹)" error={errors.budget?.message}>
        <div className="relative">
          <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted" />
          <WizardInput
            {...register('budget')}
            type="number"
            min={1000}
            step={1000}
            placeholder="75000"
            className="pl-10 text-lg font-semibold metric-tabular"
            error={errors.budget}
          />
        </div>
      </WizardField>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <WizardField label="Hotel Category" error={errors.hotelCategory?.message}>
          <WizardSelect {...register('hotelCategory')} error={errors.hotelCategory}>
            {HOTEL_CATEGORIES.map((h) => <option key={h} value={h}>{h}</option>)}
          </WizardSelect>
        </WizardField>
        <WizardField label="Meal Preference" error={errors.mealPreference?.message}>
          <WizardSelect {...register('mealPreference')} error={errors.mealPreference}>
            {MEAL_PREFERENCES.map((m) => <option key={m} value={m}>{m}</option>)}
          </WizardSelect>
        </WizardField>
        <WizardField label="Transport Requirement" error={errors.transportRequirement?.message} className="sm:col-span-2">
          <WizardSelect {...register('transportRequirement')} error={errors.transportRequirement}>
            {TRANSPORT_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
          </WizardSelect>
        </WizardField>
      </div>

      <WizardField label="Special Requirements" hint="Dietary needs, accessibility, celebrations, etc.">
        <WizardTextarea
          {...register('specialRequirements')}
          rows={4}
          placeholder="Kid-friendly resort, anniversary celebration, wheelchair access..."
          error={errors.specialRequirements}
        />
      </WizardField>
    </motion.div>
  );
}
