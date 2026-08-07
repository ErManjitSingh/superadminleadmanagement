import { destinationSections } from "@/lib/data";
import { siteConfig } from "@/lib/config";
import { PackageCard } from "./PackageCard";

export function Packages() {
  return (
    <div id="packages" className="bg-white py-10 sm:py-12">
      <div className="space-y-12 sm:space-y-14">
        {destinationSections.map((section) => (
          <section key={section.id} id={section.id} className="scroll-mt-24">
            <div className="th-container mb-5 flex items-end justify-between gap-3">
              <h2 className="text-[24px] font-bold tracking-tight text-[#202020] sm:text-[28px]">
                {section.title}
              </h2>
              <a
                href={siteConfig.whatsapp}
                target="_blank"
                rel="noreferrer"
                className="shrink-0 text-[13px] font-bold text-[var(--th-orange)] hover:underline"
              >
                View All
              </a>
            </div>

            <div className="th-container">
              <div className="hide-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:gap-[16px] sm:px-0">
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
