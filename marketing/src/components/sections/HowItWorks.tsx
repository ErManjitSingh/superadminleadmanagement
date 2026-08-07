import { howItWorks } from "@/lib/data";

export function HowItWorks() {
  return (
    <section id="how-it-works" className="section-pad bg-[var(--sand)]">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-2xl">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-[var(--lagoon)]">
            How it works
          </p>
          <h2 className="font-display text-4xl font-extrabold tracking-tight text-[var(--ink)] sm:text-5xl">
            Three easy steps
          </h2>
        </div>

        <div className="mt-14 grid gap-10 lg:grid-cols-3">
          {howItWorks.map((step) => (
            <div key={step.step} className="relative">
              <span className="font-display text-6xl font-extrabold leading-none text-[var(--lagoon)]/15">
                {step.step}
              </span>
              <h3 className="mt-2 font-display text-2xl font-bold text-[var(--ink)]">{step.title}</h3>
              <p className="mt-3 max-w-sm text-[15px] leading-relaxed text-[var(--ink)]/55">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
