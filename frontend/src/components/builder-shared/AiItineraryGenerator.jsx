import { useState } from 'react';
import { Bot, Copy, Loader2, Pencil, RefreshCw, Sparkles, Wand2 } from 'lucide-react';
import { Button } from '../ui/button';
import GlassCard from '../quotations/builder/GlassCard';
import { generateItineraryFromAI } from './aiItineraryService';
import { cn } from '../../lib/utils';

function inputCls(extra = '') {
  return cn('input-premium w-full rounded-xl text-sm', extra);
}

export default function AiItineraryGenerator({
  prompt,
  onPromptChange,
  itinerary = [],
  onItineraryChange,
  destination = 'Himachal Pradesh',
  days,
  nights,
  onDurationChange,
}) {
  const [generating, setGenerating] = useState(false);
  const [manualEdit, setManualEdit] = useState(false);
  const [error, setError] = useState('');
  const [regenerateCount, setRegenerateCount] = useState(0);
  const [lastLogistics, setLastLogistics] = useState(null);

  const runGenerate = async (regenerate = false) => {
    if (!prompt?.trim()) {
      setError('Describe the package you want — e.g. "Pickup from Delhi, 3 Nights 4 Days Himachal honeymoon"');
      return;
    }
    setError('');
    setGenerating(true);
    if (regenerate) setManualEdit(false);

    const nextSeed = regenerate ? regenerateCount + 1 : 0;
    if (regenerate) setRegenerateCount(nextSeed);
    else setRegenerateCount(0);

    try {
      const result = await generateItineraryFromAI({
        prompt,
        destination,
        days,
        nights,
        variationSeed: nextSeed,
      });
      onItineraryChange(result.days);
      if (result.logistics) setLastLogistics(result.logistics);
      if (onDurationChange) {
        onDurationChange({ days: result.totalDays, nights: result.totalNights });
      }
      // Scroll to itinerary after generate
      requestAnimationFrame(() => {
        document.getElementById('ai-itinerary-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    } catch {
      setError('Could not generate itinerary. Try again or edit manually.');
    } finally {
      setGenerating(false);
    }
  };

  const copyItinerary = async () => {
    const text = (itinerary || [])
      .map((d) => `Day ${d.day}: ${d.title}\n${d.description || ''}`)
      .join('\n\n');
    await navigator.clipboard.writeText(text);
  };

  const updateDay = (index, patch) => {
    const next = [...itinerary];
    next[index] = { ...next[index], ...patch };
    onItineraryChange(next);
  };

  return (
    <div className="space-y-5">
      <GlassCard className="p-5 sm:p-6 bg-gradient-to-br from-violet-500/10 via-indigo-500/5 to-sky-500/10 border-violet-500/20">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-violet-500/30 shrink-0">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black flex items-center gap-2">
              AI Itinerary Generator
              <Sparkles className="w-5 h-5 text-violet-500" />
            </h2>
            <p className="text-sm text-content-muted mt-0.5">
              Describe the trip — AI drafts day-wise itinerary in seconds
            </p>
          </div>
        </div>

        <textarea
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          rows={4}
          placeholder='Describe any trip in your own words — destinations, days, pickup city, activities (e.g. Kerala 5N houseboat, Goa honeymoon, Shimla Manali Rohtang from Delhi)'
          className={cn(inputCls('h-auto py-3 resize-none'), 'border-violet-500/20 focus:ring-violet-500/30')}
        />

        {error && <p className="text-sm text-red-600 mt-2">{error}</p>}

        <div className="flex flex-wrap gap-2 mt-4">
          <Button
            type="button"
            className="rounded-xl gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500"
            disabled={generating}
            onClick={() => runGenerate(false)}
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
            Generate Itinerary
          </Button>
          <Button
            type="button"
            variant="outline"
            className="rounded-xl gap-2"
            disabled={generating || !prompt?.trim()}
            onClick={() => runGenerate(true)}
          >
            <RefreshCw className={cn('w-4 h-4', generating && 'animate-spin')} /> Regenerate
          </Button>
          <Button
            type="button"
            variant="outline"
            className="rounded-xl gap-2"
            disabled={!itinerary.length}
            onClick={copyItinerary}
          >
            <Copy className="w-4 h-4" /> Copy
          </Button>
          <Button
            type="button"
            variant="outline"
            className="rounded-xl gap-2"
            disabled={!itinerary.length}
            onClick={() => setManualEdit((v) => !v)}
          >
            <Pencil className="w-4 h-4" /> {manualEdit ? 'Done Editing' : 'Edit Manually'}
          </Button>
        </div>
      </GlassCard>

      {lastLogistics?.pickup && (
        <div className="flex flex-wrap gap-2 px-1">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-500/15 text-emerald-800 border border-emerald-500/25">
            Pickup: {lastLogistics.pickup}
          </span>
          {lastLogistics.drop && (
            <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-sky-500/15 text-sky-800 border border-sky-500/25">
              Drop: {lastLogistics.drop}
            </span>
          )}
        </div>
      )}

      {!itinerary.length && !generating && (
        <div className="rounded-2xl border border-dashed border-violet-500/25 bg-violet-500/5 p-10 text-center">
          <Bot className="w-10 h-10 mx-auto text-violet-400 mb-3" />
          <p className="text-sm font-medium text-content-primary">No itinerary yet</p>
          <p className="text-xs text-content-muted mt-1">Enter a prompt above and click Generate Itinerary</p>
        </div>
      )}

      {generating && (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-2xl bg-surface-elevated/60 animate-pulse p-4 space-y-2">
              <div className="h-4 w-20 bg-slate-200/80 rounded" />
              <div className="h-5 w-3/4 bg-slate-200/80 rounded" />
              <div className="h-3 w-full bg-slate-200/60 rounded" />
              <div className="h-3 w-full bg-slate-200/60 rounded" />
              <div className="h-3 w-2/3 bg-slate-200/60 rounded" />
            </div>
          ))}
        </div>
      )}

      {!generating && itinerary.length > 0 && (
        <div id="ai-itinerary-results" className="space-y-3">
          {itinerary.map((day, index) => (
            <GlassCard key={day.id || `day-${day.day}-${index}`} className="p-4 border-subtle/80">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-black uppercase tracking-wider text-violet-600 bg-violet-500/10 px-2.5 py-1 rounded-full">
                  Day {day.day}
                </span>
              </div>
              {manualEdit ? (
                <div className="space-y-2">
                  <input
                    value={day.title || ''}
                    onChange={(e) => updateDay(index, { title: e.target.value })}
                    className={inputCls('h-10 font-semibold')}
                    placeholder="Day title"
                  />
                  <textarea
                    value={day.description || ''}
                    onChange={(e) => updateDay(index, { description: e.target.value })}
                    rows={6}
                    className={inputCls('h-auto py-2 resize-y min-h-[120px]')}
                    placeholder="Detailed day description — morning, afternoon, evening activities..."
                  />
                </div>
              ) : (
                <>
                  <h3 className="font-bold text-content-primary">{day.title}</h3>
                  <p className="text-sm text-content-secondary mt-2 leading-relaxed whitespace-pre-wrap">
                    {day.description}
                  </p>
                  {(day.meals || day.activities || day.transport) && (
                    <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-subtle/60">
                      {day.transport && (
                        <span className="text-[11px] font-semibold px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-800">
                          {day.transport}
                        </span>
                      )}
                      {day.meals && (
                        <span className="text-[11px] font-semibold px-2 py-1 rounded-lg bg-amber-500/10 text-amber-800">
                          Meals: {day.meals}
                        </span>
                      )}
                      {day.activities && (
                        <span className="text-[11px] font-semibold px-2 py-1 rounded-lg bg-sky-500/10 text-sky-800">
                          {day.activities}
                        </span>
                      )}
                    </div>
                  )}
                </>
              )}
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
