"use client";

import { useEffect } from "react";
import { siteConfig } from "@/lib/config";

/** Marketing /signup → CRM onboarding */
export default function SignupRedirectPage() {
  useEffect(() => {
    window.location.replace(siteConfig.crmSignup);
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-2 bg-[var(--ink)] text-white">
      <p className="text-sm text-white/60">Opening CRM signup…</p>
      <a href={siteConfig.crmSignup} className="text-sm text-[var(--coral)] underline">
        Continue
      </a>
    </div>
  );
}
