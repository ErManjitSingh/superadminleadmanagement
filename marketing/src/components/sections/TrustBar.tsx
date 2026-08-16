import {
  BadgeIndianRupee,
  CalendarRange,
  Users,
  ShieldCheck,
} from "lucide-react";

const items = [
  {
    icon: BadgeIndianRupee,
    title: "Best Price Guarantee",
    desc: "Get the best deals always",
  },
  {
    icon: CalendarRange,
    title: "Flexible Booking",
    desc: "Easy changes & cancellations",
  },
  {
    icon: Users,
    title: "Trusted by Millions",
    desc: "10L+ travellers across India",
  },
  {
    icon: ShieldCheck,
    title: "Secure Payments",
    desc: "100% safe & secure",
  },
];

/** Cream trust strip — exact mock copy & layout */
export function TrustBar() {
  return (
    <section className="mt-10 border-y border-[#efe6d8] bg-[#fcf8f2]">
      <div className="th-container grid grid-cols-1 gap-7 py-9 sm:grid-cols-2 sm:gap-8 lg:grid-cols-4 lg:gap-6 lg:py-10">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.title} className="flex items-start gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center text-[#f27c22]">
                <Icon className="h-[22px] w-[22px]" strokeWidth={2} />
              </div>
              <div>
                <p className="text-[15px] font-bold leading-tight text-[#1a2420]">
                  {item.title}
                </p>
                <p className="mt-1 text-[13px] leading-snug text-[#6b7a72]">
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
