import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Cloud, Loader2, Package, Save } from 'lucide-react';
import { Button } from '../../ui/button';
import GlassCard from '../../quotations/builder/GlassCard';
import PackageBuilderStepNav from './PackageBuilderStepNav';
import PackagePreviewPanel from './PackagePreviewPanel';
import { usePackageBuilder } from './usePackageBuilder';
import {
  StepBasics,
  StepDestinations,
  StepItinerary,
  StepHotels,
  StepTransport,
  StepActivities,
  StepMeals,
  StepPricing,
  StepInclusions,
  StepExclusions,
  StepPolicies,
  StepNotes,
  StepGallery,
  StepVideos,
  StepSeo,
  StepTags,
  StepFeatures,
  StepPreview,
  StepPublish,
} from './PackageBuilderSteps';

export default function PremiumPackageBuilder({ packageId }) {
  const b = usePackageBuilder(packageId);
  const [previewMode, setPreviewMode] = useState('desktop');

  const goNext = () => b.setStep((s) => Math.min(b.totalSteps, s + 1));
  const goBack = () => b.setStep((s) => Math.max(1, s - 1));

  if (b.loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
      </div>
    );
  }

  const renderStep = () => {
    switch (b.step) {
      case 1: return <StepBasics b={b} />;
      case 2: return <StepDestinations b={b} />;
      case 3: return <StepItinerary b={b} />;
      case 4: return <StepHotels b={b} />;
      case 5: return <StepTransport b={b} />;
      case 6: return <StepActivities b={b} />;
      case 7: return <StepMeals b={b} />;
      case 8: return <StepPricing b={b} />;
      case 9: return <StepInclusions b={b} />;
      case 10: return <StepExclusions b={b} />;
      case 11: return <StepPolicies b={b} />;
      case 12: return <StepNotes b={b} />;
      case 13: return <StepGallery b={b} />;
      case 14: return <StepVideos b={b} />;
      case 15: return <StepSeo b={b} />;
      case 16: return <StepTags b={b} />;
      case 17: return <StepFeatures b={b} />;
      case 18: return <StepPreview b={b} previewMode={previewMode} setPreviewMode={setPreviewMode} />;
      case 19: return <StepPublish b={b} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50/80 via-white to-sky-50/60 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 pb-12">
      <div className="sticky top-0 z-30 border-b border-white/20 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl">
        <div className="max-w-[1600px] mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link to="/packages" className="p-2 rounded-xl hover:bg-white/60 dark:hover:bg-slate-800 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/25">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-sm font-black text-content-primary">{b.isEdit ? 'Edit Package' : 'Create Package'}</h1>
                <p className="text-[11px] text-content-muted">{b.state.name || 'Untitled'} · Step {b.step}/{b.totalSteps}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <AutosaveBadge status={b.autosaveStatus} />
            <Button type="button" variant="outline" size="sm" className="rounded-xl gap-1.5" disabled={b.saving} onClick={() => b.save()}>
              <Save className="w-4 h-4" /> Save
            </Button>
          </div>
        </div>
      </div>

      {b.error && (
        <div className="max-w-[1600px] mx-auto px-4 pt-3">
          <p className="text-sm text-red-600 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2">{b.error}</p>
        </div>
      )}

      <div className="max-w-[1600px] mx-auto p-4 flex gap-4">
        <aside className="hidden xl:block w-52 shrink-0">
          <GlassCard className="p-3 sticky top-20">
            <PackageBuilderStepNav step={b.step} maxReached={b.maxReached} onStepChange={b.setStep} />
          </GlassCard>
        </aside>

        <main className="flex-1 min-w-0 max-w-4xl">
          <GlassCard className="p-6 sm:p-8 min-h-[560px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={b.step}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                {renderStep()}
              </motion.div>
            </AnimatePresence>

            {b.step < 19 && (
              <div className="flex justify-between mt-8 pt-6 border-t border-white/30">
                <Button type="button" variant="outline" className="rounded-xl gap-2" disabled={b.step === 1} onClick={goBack}>
                  <ArrowLeft className="w-4 h-4" /> Back
                </Button>
                <Button type="button" variant="amber" className="rounded-xl gap-2 shadow-lg shadow-amber-500/20" disabled={!b.canContinue} onClick={goNext}>
                  Continue <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </GlassCard>
        </main>

        <aside className="hidden lg:block w-72 xl:w-80 shrink-0">
          <PackagePreviewPanel pkg={b.draftPreview} previewMode={previewMode} />
        </aside>
      </div>
    </div>
  );
}

function AutosaveBadge({ status }) {
  if (status === 'saving') {
    return <span className="text-xs text-content-muted flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Saving…</span>;
  }
  if (status === 'saved') {
    return <span className="text-xs text-emerald-600 flex items-center gap-1"><Cloud className="w-3 h-3" /> Saved</span>;
  }
  return null;
}
