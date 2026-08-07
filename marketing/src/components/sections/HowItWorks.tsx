import { howItWorks } from "@/lib/data";

export function HowItWorks() {
  return (
    <section id="how-it-works" className="section-padding bg-[var(--sand)]">
      <div className="mx-auto max-w-6xl">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[var(--lagoon)]">
          How it works
        </p>
        <h2 className="font-display text-3xl font-bold tracking-tight text-[var(--ink)] sm:text-4xl">
          Three steps to your next trip
        </h2>

        <div className="mt-10 grid gap-8 sm:grid-cols-3">
          {howItWorks.map((step) => (
            <div key={step.step}>
              <span className="font-display text-4xl font-bold text-[var(--lagoon)]/20">{step.step}</span>
              <h3 className="mt-1 font-display text-xl font-bold text-[var(--ink)]">{step.title}</h3>
              <p className="mt-2 text-sm text-[var(--ink)]/55">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
