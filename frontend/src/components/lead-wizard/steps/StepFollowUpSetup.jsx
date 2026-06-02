import { useFormContext } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Calendar, Clock } from 'lucide-react';
import WizardField, { WizardInput, WizardTextarea } from '../WizardField';

export default function StepFollowUpSetup() {
  const { register, formState: { errors } } = useFormContext();

  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -24 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-xl font-bold text-content-primary">Follow-up Setup</h2>
        <p className="text-sm text-content-muted mt-1">Schedule the first follow-up for this lead</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <WizardField label="Follow Up Date" error={errors.followUpDate?.message}>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted pointer-events-none" />
            <WizardInput {...register('followUpDate')} type="date" className="pl-10" error={errors.followUpDate} />
          </div>
        </WizardField>
        <WizardField label="Follow Up Time" error={errors.followUpTime?.message}>
          <div className="relative">
            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted pointer-events-none" />
            <WizardInput {...register('followUpTime')} type="time" className="pl-10" error={errors.followUpTime} />
          </div>
        </WizardField>
      </div>

      <WizardField label="Remarks" error={errors.followUpRemarks?.message}>
        <WizardTextarea
          {...register('followUpRemarks')}
          rows={4}
          placeholder="Initial callback — discuss package options and budget..."
          error={errors.followUpRemarks}
        />
      </WizardField>
    </motion.div>
  );
}
