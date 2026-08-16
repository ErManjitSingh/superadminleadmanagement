import {
  BadgeIndianRupee,
  ShieldCheck,
  Award,
  Lock,
} from "lucide-react";

const items = [
  {
    icon: ShieldCheck,
    title: "Trusted by Millions",
    desc: "10L+ happy travellers",
  },
  {
    icon: Award,
    title: "Flexible Booking",
    desc: "Easy changes & cancellations",
  },
  {
    icon: Lock,
    title: "Secure Payments",
    desc: "100% safe & secure",
  },
  {
    icon: BadgeIndianRupee,
    title: "Best Price Guarantee",
    desc: "Get the best deals always",
  },
];

export function TrustBar() {
  return (
    <section className="mt-8 border-y border-[#e8ebe9] bg-[#f5f6f5] sm:mt-10 sm:border-[#efe6d8] sm:bg-[#fcf8f2]">
      <div className="mx-auto grid w-full max-w-[1200px] grid-cols-2 gap-x-3 gap-y-5 px-4 py-6 sm:gap-8 sm:px-6 sm:py-9 lg:grid-cols-4 lg:gap-6 lg:py-10">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.title} className="flex items-start gap-2.5 sm:gap-3.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center text-[#003322] sm:h-10 sm:w-10 sm:text-[#f47920]">
                <Icon className="h-[20px] w-[20px] sm:h-[22px] sm:w-[22px]" strokeWidth={2} />
              </div>
              <div>
                <p className="text-[13px] font-bold leading-tight text-[#003322] sm:text-[15px] sm:text-[#111827]">
                  {item.title}
                </p>
                <p className="mt-0.5 text-[11px] leading-snug text-[#6b7280] sm:mt-1 sm:text-[13px]">
                  {item.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
