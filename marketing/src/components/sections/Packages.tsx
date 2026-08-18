import { destinationSections } from "@/lib/data";
import { PackageCard } from "./PackageCard";

export function Packages() {
  return (
    <div id="packages" className="bg-white py-12 sm:py-16">
      <div className="space-y-14 sm:space-y-16">
        {destinationSections.map((section) => (
          <section key={section.id} id={section.id} className="scroll-mt-24">
            <div className="th-container mb-5 flex items-end justify-between gap-3">
              <div>
                <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--th-orange)]">Explore the best of</p>
                <h2 className="text-[27px] font-extrabold tracking-tight text-[#17213a] sm:text-[32px]">{section.title}</h2>
              </div>
              <a
                href={`#${section.id}`}
                className="shrink-0 text-[13px] font-bold text-[var(--th-orange)] hover:underline"
              >
                View All
              </a>
            </div>

            <div className="th-container">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {section.packages.map((pkg) => (
                  <PackageCard key={pkg.id} pkg={pkg} />
                ))}
              </div>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
