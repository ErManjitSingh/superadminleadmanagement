"use client";

import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { siteConfig } from "@/lib/config";

/** Marketing /signup → CRM SaaS onboarding wizard */
export default function SignupRedirectPage() {
  useEffect(() => {
    window.location.replace(siteConfig.crmSignup);
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#0b0b14] text-white">
      <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
      <p className="text-sm text-white/60">Opening signup wizard…</p>
    </div>
  );
}
