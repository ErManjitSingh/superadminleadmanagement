import { testimonials } from "@/lib/data";

export function Testimonials() {
  return (
    <section id="testimonials" className="section-pad bg-[var(--ink)] text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-[var(--glow)]">
            Traveller stories
          </p>
          <h2 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
            Loved on real trips
          </h2>
        </div>

        <div className="mt-14 grid gap-5 lg:grid-cols-3">
          {testimonials.map((t) => (
            <blockquote
              key={t.name}
              className="flex h-full flex-col rounded-[1.75rem] border border-white/10 bg-gradient-to-b from-white/10 to-white/[0.03] p-7"
            >
              <p className="flex-1 text-[15px] leading-relaxed text-white/80">
                &ldquo;{t.quote}&rdquo;
              </p>
              <footer className="mt-7 border-t border-white/10 pt-5">
                <cite className="not-italic font-display text-lg font-bold text-white">{t.name}</cite>
                <p className="mt-1 text-sm text-white/40">{t.trip}</p>
              </footer>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}
