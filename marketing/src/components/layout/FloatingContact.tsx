"use client";

import { Phone, MessageCircle } from "lucide-react";
import { siteConfig } from "@/lib/config";

const telHref = `tel:${siteConfig.contactPhone.replace(/\s/g, "")}`;

/** Mobile sticky bottom bar — Call | WhatsApp | Enquire */
export function MobileFloatingFooter() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] border-t border-black/10 bg-white/95 px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_30px_rgba(15,23,42,0.12)] backdrop-blur-md lg:hidden">
      <div className="mx-auto grid max-w-lg grid-cols-3 gap-2">
        <a
          href={telHref}
          className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl bg-[#003322] text-[13px] font-bold text-white"
        >
          <Phone className="h-4 w-4" strokeWidth={2.4} />
          Call
        </a>
        <a
          href={siteConfig.whatsapp}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl bg-[#25D366] text-[13px] font-bold text-white"
        >
          <MessageCircle className="h-4 w-4" strokeWidth={2.4} />
          WhatsApp
        </a>
        <a
          href={siteConfig.whatsapp}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl bg-[#f46c14] text-[13px] font-bold text-white"
        >
          Enquire
        </a>
      </div>
    </div>
  );
}

/** Floating WhatsApp + Call buttons (above sticky footer on mobile) */
export function FloatingContactButtons() {
  return (
    <div className="fixed bottom-[4.75rem] right-3 z-[61] flex flex-col gap-2.5 lg:bottom-6 lg:right-5">
      <a
        href={siteConfig.whatsapp}
        target="_blank"
        rel="noreferrer"
        aria-label="Chat on WhatsApp"
        className="flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_8px_24px_rgba(37,211,102,0.45)] transition hover:scale-105 lg:h-14 lg:w-14"
      >
        <MessageCircle className="h-6 w-6 lg:h-7 lg:w-7" strokeWidth={2.2} fill="currentColor" />
      </a>
      <a
        href={telHref}
        aria-label={`Call ${siteConfig.contactPhone}`}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-[#003322] text-white shadow-[0_8px_24px_rgba(0,51,34,0.4)] transition hover:scale-105 lg:h-14 lg:w-14"
      >
        <Phone className="h-5 w-5 lg:h-6 lg:w-6" strokeWidth={2.4} />
      </a>
    </div>
  );
}
