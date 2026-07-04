import { useState } from 'react';
import {
  Bot,
  ChevronDown,
  ChevronUp,
  Copy,
  Info,
  Loader2,
  Pencil,
  RefreshCw,
  Sparkles,
  Wand2,
} from 'lucide-react';
import { Button } from '../ui/button';
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
  const [warning, setWarning] = useState('');
  const [regenerateCount, setRegenerateCount] = useState(0);
  const [lastLogistics, setLastLogistics] = useState(null);
  const [collapsed, setCollapsed] = useState(false);
  const [expandedDays, setExpandedDays] = useState({});

  const totalDays = itinerary.length || days || 0;
  const totalNights = Math.max(0, totalDays - 1);

  const runGenerate = async (regenerate = false) => {
    if (!prompt?.trim()) {
      setError('Describe the package you want — e.g. "Pickup from Delhi, 3 Nights 4 Days Himachal honeymoon"');
      return;
    }
    setError('');
    setWarning('');
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
      if (result.warning) setWarning(result.warning);
      setCollapsed(false);
      setExpandedDays({});
    } catch (err) {
      const msg = err?.message || 'Could not generate itinerary. Try again or edit manually.';
      setError(msg);
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

  const toggleDay = (key) => {
    setExpandedDays((prev) => {
      const currentlyOpen = prev[key] ?? true;
      return { ...prev, [key]: !currentlyOpen };
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-slate-900">AI Itinerary</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Describe the trip — AI drafts a day-wise itinerary in seconds
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 lg:gap-5 items-start">
        {/* Left — generator */}
        <div className="rounded-2xl border border-violet-200/80 bg-gradient-to-br from-violet-50 via-white to-indigo-50/60 p-5 shadow-sm">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-violet-500/25 shrink-0">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                AI Itinerary Generator
                <Sparkles className="w-4 h-4 text-violet-500" />
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Write a short brief and generate a full day plan
              </p>
            </div>
          </div>

          <textarea
            value={prompt}
            onChange={(e) => onPromptChange(e.target.value)}
            rows={5}
            placeholder="Create a 3 Nights 4 Days Himachal package covering Shimla and Manali for a honeymoon couple..."
            className={cn(
              inputCls('h-auto py-3 resize-none bg-white'),
              'border-violet-200 focus:ring-violet-500/30',
            )}
          />

          {error && (
            <p className="text-sm text-red-600 mt-2 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          {warning && !error && (
            <p className="text-sm text-amber-700 mt-2 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
              {warning}
            </p>
          )}

          <div className="flex flex-wrap gap-2 mt-4">
            <Button
              type="button"
              className="rounded-xl gap-2 bg-violet-600 hover:bg-violet-500 text-white shadow-md shadow-violet-500/20"
              disabled={generating}
              onClick={() => runGenerate(false)}
            >
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
              Generate Itinerary
            </Button>
            <Button
              type="button"
              variant="outline"
              className="rounded-xl gap-2 bg-white"
              disabled={generating || !prompt?.trim()}
              onClick={() => runGenerate(true)}
            >
              <RefreshCw className={cn('w-4 h-4', generating && 'animate-spin')} /> Regenerate
            </Button>
            <Button
              type="button"
              variant="outline"
              className="rounded-xl gap-2 bg-white"
              disabled={!itinerary.length}
              onClick={copyItinerary}
            >
              <Copy className="w-4 h-4" /> Copy
            </Button>
            <Button
              type="button"
              variant="outline"
              className="rounded-xl gap-2 bg-white"
              disabled={!itinerary.length}
              onClick={() => setManualEdit((v) => !v)}
            >
              <Pencil className="w-4 h-4" /> {manualEdit ? 'Done Editing' : 'Edit Manually'}
            </Button>
          </div>

          <div className="mt-4 rounded-xl border border-violet-100 bg-white/80 p-3 flex gap-2.5">
            <Info className="w-4 h-4 text-violet-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-slate-800">How it works?</p>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                AI creates a detailed day-wise itinerary including attractions, transfers, meals and travel times from your brief.
              </p>
            </div>
          </div>
        </div>

        {/* Right — results */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm min-h-[320px]">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">AI Generated Itinerary</h3>
              {itinerary.length > 0 && (
                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-violet-100 text-violet-700">
                  {totalDays} Days / {totalNights} Nights
                </span>
              )}
            </div>
            {itinerary.length > 0 && (
              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-lg h-8 gap-1 text-xs"
                  onClick={() => setManualEdit((v) => !v)}
                >
                  <Pencil className="w-3.5 h-3.5" /> Edit
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-lg h-8 gap-1 text-xs"
                  onClick={() => setCollapsed((v) => !v)}
                >
                  {collapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
                  {collapsed ? 'Expand All' : 'Collapse All'}
                </Button>
              </div>
            )}
          </div>

          {lastLogistics?.pickup && (
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-100">
                Pickup: {lastLogistics.pickup}
              </span>
              {lastLogistics.drop && (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-sky-50 text-sky-800 border border-sky-100">
                  Drop: {lastLogistics.drop}
                </span>
              )}
            </div>
          )}

          {!itinerary.length && !generating && (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 p-10 text-center">
              <Bot className="w-10 h-10 mx-auto text-violet-300 mb-3" />
              <p className="text-sm font-medium text-slate-700">No itinerary yet</p>
              <p className="text-xs text-slate-500 mt-1">
                Enter a prompt and click Generate Itinerary
              </p>
            </div>
          )}

          {generating && (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="rounded-xl bg-slate-50 animate-pulse p-4 space-y-2 border border-slate-100">
                  <div className="h-4 w-20 bg-slate-200/80 rounded" />
                  <div className="h-5 w-3/4 bg-slate-200/80 rounded" />
                  <div className="h-3 w-full bg-slate-200/60 rounded" />
                </div>
              ))}
            </div>
          )}

          {!generating && itinerary.length > 0 && !collapsed && (
            <div id="ai-itinerary-results" className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
              {itinerary.map((day, index) => {
                const key = day.id || `day-${day.day}-${index}`;
                const isOpen = expandedDays[key] ?? true;
                return (
                  <div
                    key={key}
                    className="rounded-xl border border-slate-200 bg-slate-50/50 overflow-hidden"
                  >
                    <button
                      type="button"
                      className="w-full flex items-start gap-3 p-3.5 text-left hover:bg-white/70 transition-colors"
                      onClick={() => toggleDay(key)}
                    >
                      <span className="text-[10px] font-black uppercase tracking-wider text-violet-700 bg-violet-100 px-2 py-1 rounded-md shrink-0 mt-0.5">
                        Day {day.day}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-slate-900 text-sm leading-snug">{day.title}</p>
                        {!isOpen && day.description && (
                          <p className="text-xs text-slate-500 mt-1 line-clamp-1">{day.description}</p>
                        )}
                        {isOpen && (day.transport || day.meals) && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {day.transport && (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                                {day.transport}
                              </span>
                            )}
                            {day.meals && (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800">
                                Meals: {day.meals}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <ChevronDown
                        className={cn(
                          'w-4 h-4 text-slate-400 shrink-0 mt-1 transition-transform',
                          isOpen && 'rotate-180',
                        )}
                      />
                    </button>

                    {isOpen && (
                      <div className="px-3.5 pb-3.5 pt-0">
                        {manualEdit ? (
                          <div className="space-y-2 pl-0 sm:pl-[4.5rem]">
                            <input
                              value={day.title || ''}
                              onChange={(e) => updateDay(index, { title: e.target.value })}
                              className={inputCls('h-9 font-semibold bg-white')}
                              placeholder="Day title"
                            />
                            <textarea
                              value={day.description || ''}
                              onChange={(e) => updateDay(index, { description: e.target.value })}
                              rows={4}
                              className={inputCls('h-auto py-2 resize-y min-h-[96px] bg-white')}
                              placeholder="Detailed day description..."
                            />
                          </div>
                        ) : (
                          day.description && (
                            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap pl-0 sm:pl-[4.5rem]">
                              {day.description}
                            </p>
                          )
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {!generating && itinerary.length > 0 && collapsed && (
            <p className="text-sm text-slate-500 text-center py-8">
              Itinerary collapsed — click Expand All to review days.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
