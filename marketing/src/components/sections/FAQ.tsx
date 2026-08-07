import { faqItems } from "@/lib/data";

export function FAQ() {
  return (
    <section id="faq" className="bg-[var(--th-bg)] py-12 sm:py-14">
      <div className="th-container max-w-3xl">
        <h2 className="mb-6 text-center text-2xl font-extrabold tracking-tight sm:text-[28px]">
          Frequently Asked Questions
        </h2>
        <div className="space-y-2">
          {faqItems.map((item) => (
            <details
              key={item.q}
              className="group rounded-xl border border-[var(--th-border)] bg-white px-4 open:pb-3"
            >
              <summary className="cursor-pointer list-none py-4 text-sm font-bold text-[var(--th-ink)] [&::-webkit-details-marker]:hidden">
                <span className="flex items-center justify-between gap-3">
                  {item.q}
                  <span className="text-[var(--th-orange)] transition group-open:rotate-45">+</span>
                </span>
              </summary>
              <p className="pb-1 text-sm leading-relaxed text-[var(--th-muted)]">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
