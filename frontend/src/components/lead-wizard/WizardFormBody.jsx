import { ArrowLeft, ArrowRight, Save, Plus, ExternalLink, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';
import { WIZARD_STEP_COUNT } from './constants';
import { useWizardForm } from './WizardFormContext';
import StepCustomerDetails from './steps/StepCustomerDetails';
import StepTravelDetails from './steps/StepTravelDetails';
import StepLeadInformation from './steps/StepLeadInformation';
import StepReview from './steps/StepReview';

const STEPS = [
  { Component: StepCustomerDetails, needsLeadId: true },
  { Component: StepTravelDetails, needsLeadId: false },
  { Component: StepLeadInformation, needsLeadId: false },
];

export default function WizardFormBody({
  step,
  isEdit,
  leadId,
  saving,
  onBack,
  onNext,
  onSave,
}) {
  const { values } = useWizardForm();

  return (
    <>
      <div className="p-6 sm:p-8 min-h-[420px]">
        {STEPS.map(({ Component, needsLeadId }, index) => {
          const stepNum = index + 1;
          const active = step === stepNum;
          return (
            <div key={stepNum} className={cn(!active && 'hidden')} aria-hidden={!active}>
              <Component isEdit={isEdit} leadId={needsLeadId ? leadId : undefined} />
            </div>
          );
        })}
        {step === WIZARD_STEP_COUNT && (
          <div>
            <StepReview data={values} />
          </div>
        )}
      </div>

      <div className="px-6 sm:px-8 py-5 border-t border-subtle bg-surface-elevated/40 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {step > 1 ? (
          <Button type="button" variant="outline" onClick={onBack} className="rounded-xl gap-2 order-2 sm:order-1">
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
        ) : (
          <div className="hidden sm:block order-1" />
        )}

        {step < WIZARD_STEP_COUNT ? (
          <Button
            type="button"
            onClick={onNext}
            className="rounded-xl gap-2 sm:ml-auto order-1 sm:order-2 shadow-md shadow-brand-600/15"
          >
            Continue <ArrowRight className="w-4 h-4" />
          </Button>
        ) : (
          <div className="flex flex-col sm:flex-row gap-2 sm:ml-auto order-1 sm:order-2 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={() => onSave('list')}
              className="rounded-xl gap-2 text-brand-700 border-brand-500/40 bg-brand-500/10 hover:bg-brand-500/20"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Lead
            </Button>
            {!isEdit && (
              <Button
                type="button"
                variant="outline"
                disabled={saving}
                onClick={() => onSave('another')}
                className="rounded-xl gap-2 text-violet-700 border-violet-500/40 bg-violet-500/10 hover:bg-violet-500/20"
              >
                <Plus className="w-4 h-4" /> Save & Add Another
              </Button>
            )}
            <Button
              type="button"
              disabled={saving}
              onClick={() => onSave('open')}
              variant="emerald"
              className="rounded-xl gap-2"
            >
              <ExternalLink className="w-4 h-4" /> Save & Open Lead
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
