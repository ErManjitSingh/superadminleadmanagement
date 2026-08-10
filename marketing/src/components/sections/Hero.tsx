import { heroFlipCards } from "@/lib/data";
import { ExploreTabs } from "@/components/sections/ExploreTabs";

export function Hero() {
  return (
    <section className="overflow-hidden bg-[#fffaf6]">
      <div className="relative mx-auto min-h-[480px] w-full max-w-[1440px] overflow-hidden">
        <div className="absolute -left-20 -top-28 h-80 w-80 rounded-full bg-orange-100/70 blur-3xl" />
        <div className="absolute bottom-0 left-[38%] h-52 w-52 rounded-full bg-amber-100/60 blur-3xl" />

        <div className="absolute inset-y-0 right-0 hidden w-[54%] overflow-hidden lg:block">
          <div className="absolute inset-0 overflow-hidden rounded-bl-[110px]">
            <img
              src="https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=1400&q=88"
              alt="A scenic Indian mountain holiday"
              className="h-full w-full object-cover"
              width="900"
              height="620"
              loading="eager"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#fffaf6] via-transparent to-black/5" />
          </div>

          <div className="absolute bottom-8 right-8 rounded-2xl border border-white/60 bg-white/90 px-4 py-3 shadow-xl backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {heroFlipCards.slice(0, 3).map((card) => (
                  <img key={card.front} src={card.front} alt="" className="h-9 w-9 rounded-full border-2 border-white object-cover" width="36" height="36" />
                ))}
              </div>
              <div>
                <p className="text-[13px] font-extrabold text-[#17213a]">10L+ happy travellers</p>
                <p className="text-[10px] text-[#687086]"><span className="text-amber-500">★★★★★</span> 4.8 trusted rating</p>
              </div>
            </div>
          </div>
        </div>

        <div className="th-container relative z-10 flex min-h-[480px] items-center py-14">
          <div className="max-w-[590px]">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white px-3.5 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[#d75b15] shadow-sm">
              <span className="h-2 w-2 rounded-full bg-[#ff6b18]" /> Made for your kind of holiday
            </div>
            <h1 className="text-[44px] font-extrabold leading-[1.02] tracking-[-0.04em] text-[#15203a] sm:text-[62px]">
              Incredible India,
              <br />
              <span className="bg-gradient-to-r from-[#ff650c] to-[#f59e0b] bg-clip-text text-transparent">made personal.</span>
            </h1>
            <p className="mt-5 max-w-[500px] text-[15px] leading-7 text-[#626b7f] sm:text-[17px]">
              Handpicked stays, memorable experiences and thoughtfully planned journeys—all designed around you.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href="#packages" className="inline-flex items-center rounded-full bg-[#ff650c] px-6 py-3.5 text-[14px] font-bold text-white shadow-[0_12px_26px_rgba(255,101,12,.28)] transition hover:-translate-y-0.5 hover:bg-[#e95b08]">
                Explore packages <span className="ml-2">→</span>
              </a>
              <a href="#destinations" className="inline-flex items-center rounded-full border border-[#dfe2e8] bg-white px-6 py-3.5 text-[14px] font-bold text-[#273047] shadow-sm transition hover:border-orange-300">
                Browse destinations
              </a>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-[12px] font-semibold text-[#5f687a]">
              <span>✓ 100% customisable</span>
              <span>✓ Expert support</span>
              <span>✓ Best price promise</span>
            </div>
          </div>
        </div>

        <div className="th-container relative z-20 -mt-20 pb-8 lg:hidden">
          <div className="h-48 overflow-hidden rounded-3xl shadow-xl">
            <img src="https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=1000&q=85" alt="A scenic Indian mountain holiday" className="h-full w-full object-cover" width="800" height="400" />
          </div>
        </div>
      </div>

      <ExploreTabs />
    </section>
  );
}
