import { faqItems } from "@/lib/data";

export function FAQ() {
  return (
    <section id="faq" className="section-pad bg-[var(--sand)]">
      <div className="mx-auto max-w-3xl">
        <div className="mb-10 text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-[var(--lagoon)]">
            FAQs
          </p>
          <h2 className="font-display text-4xl font-extrabold tracking-tight text-[var(--ink)]">
            Before you pack your bags
          </h2>
        </div>

        <div className="space-y-3">
          {faqItems.map((item) => (
            <details
              key={item.q}
              className="group rounded-2xl bg-white px-5 shadow-sm ring-1 ring-[var(--ink)]/6 open:pb-4"
            >
              <summary className="cursor-pointer list-none py-5 font-display text-[15px] font-bold text-[var(--ink)] [&::-webkit-details-marker]:hidden">
                <span className="flex items-center justify-between gap-4">
                  {item.q}
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--mist)] text-[var(--lagoon)] transition group-open:rotate-45">
                    +
                  </span>
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
