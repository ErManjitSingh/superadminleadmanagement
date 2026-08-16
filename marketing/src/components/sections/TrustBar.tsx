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

export function TrustBar() {
  return (
    <section className="border-y border-[#efe8dc] bg-[#fcf8f2]">
      <div className="th-container grid grid-cols-1 gap-6 py-8 sm:grid-cols-2 sm:gap-8 sm:py-10 lg:grid-cols-4">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.title} className="flex items-start gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[rgba(248,128,8,0.12)] text-[var(--th-orange)]">
                <Icon className="h-5 w-5" strokeWidth={2.2} />
              </div>
              <div>
                <p className="text-[15px] font-bold text-[var(--th-ink)]">
                  {item.title}
                </p>
                <p className="mt-0.5 text-[13px] text-[var(--th-muted)]">
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
