import { whyUs } from "@/lib/data";

export function WhyUs() {
  return (
    <section id="why-us" className="section-padding bg-[var(--mist)]">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-xl text-center">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[var(--lagoon)]">
            Why travel with us
          </p>
          <h2 className="font-display text-3xl font-bold tracking-tight text-[var(--ink)] sm:text-4xl">
            Built for real holidays
          </h2>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {whyUs.map((item) => (
            <div key={item.title} className="rounded-2xl bg-white p-6 ring-1 ring-[var(--ink)]/5">
              <h3 className="font-display text-lg font-bold text-[var(--ink)]">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--ink)]/55">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
