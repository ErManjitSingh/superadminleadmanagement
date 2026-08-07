import { faqItems } from "@/lib/data";

export function FAQ() {
  return (
    <section id="faq" className="section-padding bg-[var(--sand)]">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 text-center">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[var(--lagoon)]">
            FAQs
          </p>
          <h2 className="font-display text-3xl font-bold tracking-tight text-[var(--ink)]">
            Before you pack
          </h2>
        </div>

        <div className="space-y-2">
          {faqItems.map((item) => (
            <details
              key={item.q}
              className="group rounded-xl bg-white px-4 ring-1 ring-[var(--ink)]/8 open:pb-3"
            >
              <summary className="cursor-pointer list-none py-4 font-display text-sm font-semibold text-[var(--ink)] [&::-webkit-details-marker]:hidden">
                <span className="flex items-center justify-between gap-3">
                  {item.q}
                  <span className="text-[var(--lagoon)] transition group-open:rotate-45">+</span>
                </span>
              </summary>
              <p className="pb-1 text-sm leading-relaxed text-[var(--ink)]/55">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
