import { destinationSections } from "@/lib/data";
import { siteConfig } from "@/lib/config";
import { PackageCard } from "./PackageCard";

export function Packages() {
  return (
    <div id="packages" className="space-y-10 py-10 sm:py-12">
      {destinationSections.map((section) => (
        <section key={section.id} id={section.id} className="scroll-mt-20">
          <div className="th-container mb-4 flex items-end justify-between gap-3">
            <h2 className="text-2xl font-extrabold tracking-tight text-[var(--th-ink)] sm:text-[28px]">
              {section.title}
            </h2>
            <a
              href={siteConfig.whatsapp}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-bold text-[var(--th-orange)] hover:underline"
            >
              View All
            </a>
          </div>

          <div className="th-container">
            <div className="hide-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
              {section.packages.map((pkg) => (
                <PackageCard key={pkg.id} pkg={pkg} />
              ))}
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}
