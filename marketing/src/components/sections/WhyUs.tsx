import { whyUs } from "@/lib/data";

export function WhyUs() {
  return (
    <section id="why-us" className="section-pad relative overflow-hidden bg-[var(--mist)]">
      <div
        className="pointer-events-none absolute -right-24 top-10 h-72 w-72 rounded-full bg-[var(--lagoon)]/10 blur-3xl"
        aria-hidden
      />
      <div className="relative mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-[var(--lagoon)]">
            Why travel with us
          </p>
          <h2 className="font-display text-4xl font-extrabold tracking-tight text-[var(--ink)] sm:text-5xl">
            Less planning stress. More actual holiday.
          </h2>
          <p className="mt-4 text-lg text-[var(--ink)]/55">
            We handle the boring bits so you can focus on views, food and memories.
          </p>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2">
          {whyUs.map((item, i) => (
            <div
              key={item.title}
              className="rounded-[1.5rem] bg-white p-8 shadow-[0_18px_50px_-30px_rgba(7,28,30,0.35)] ring-1 ring-[var(--ink)]/5"
            >
              <span className="font-display text-sm font-bold text-[var(--coral)]">
                0{i + 1}
              </span>
              <h3 className="mt-3 font-display text-2xl font-bold text-[var(--ink)]">{item.title}</h3>
              <p className="mt-3 text-[15px] leading-relaxed text-[var(--ink)]/55">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
