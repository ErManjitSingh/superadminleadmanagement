import { testimonials } from "@/lib/data";

export function Testimonials() {
  return (
    <section id="testimonials" className="section-padding bg-[var(--ink)] text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-xl text-center">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[var(--coral)]">
            Traveller stories
          </p>
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Loved by families & couples
          </h2>
        </div>

        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {testimonials.map((t) => (
            <blockquote
              key={t.name}
              className="rounded-2xl border border-white/10 bg-white/5 p-6"
            >
              <p className="text-sm leading-relaxed text-white/75">&ldquo;{t.quote}&rdquo;</p>
              <footer className="mt-5 border-t border-white/10 pt-4">
                <cite className="not-italic font-display font-bold text-white">{t.name}</cite>
                <p className="mt-0.5 text-xs text-white/40">{t.trip}</p>
              </footer>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}
