"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  Loader2,
  Lock,
  Mail,
  MapPin,
  Phone,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { siteConfig } from "@/lib/config";

const steps = [
  { title: "Company", icon: Building2 },
  { title: "Contact", icon: User },
  { title: "Security", icon: Lock },
];

const countries = [
  "India",
  "United States",
  "United Kingdom",
  "United Arab Emirates",
  "Singapore",
  "Australia",
  "Canada",
  "Other",
];

export default function SignupPage() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [form, setForm] = useState({
    companyName: "",
    ownerName: "",
    ownerEmail: "",
    phone: "",
    country: "India",
    password: "",
    confirmPassword: "",
    planSlug: "starter",
  });

  const update = (field: string, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  const canProceed = () => {
    if (step === 0) return form.companyName.trim().length >= 2;
    if (step === 1)
      return form.ownerName.trim() && form.ownerEmail.includes("@") && form.phone.trim();
    if (step === 2)
      return form.password.length >= 8 && form.password === form.confirmPassword && accepted;
    return false;
  };

  async function handleSubmit() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${siteConfig.apiUrl}/public/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: form.companyName,
          ownerName: form.ownerName,
          ownerEmail: form.ownerEmail,
          password: form.password,
          phone: form.phone,
          country: form.country,
          planSlug: form.planSlug,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Signup failed");

      setDone(true);
      if (data.token) {
        localStorage.setItem("token", data.token);
      }
      setTimeout(() => {
        window.location.href = siteConfig.crmDashboard;
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card max-w-md p-10 text-center"
        >
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20">
            <Check className="h-8 w-8 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold">Welcome aboard!</h1>
          <p className="mt-2 text-muted-foreground">
            Your company, admin user and trial account have been created. Redirecting to your CRM…
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.15),transparent_50%)]" />

      <div className="relative mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4 py-12">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-2xl p-8"
        >
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-600">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold">Start Your Free Demo</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              14-day trial · No credit card · Setup in 2 minutes
            </p>
          </div>

          {/* Step indicator */}
          <div className="mb-8 flex items-center justify-center gap-2">
            {steps.map((s, i) => (
              <div key={s.title} className="flex items-center gap-2">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                    i <= step
                      ? "bg-primary text-primary-foreground"
                      : "bg-white/10 text-muted-foreground"
                  }`}
                >
                  {i < step ? <Check className="h-4 w-4" /> : i + 1}
                </div>
                {i < steps.length - 1 && (
                  <div
                    className={`h-px w-8 ${i < step ? "bg-primary" : "bg-white/10"}`}
                  />
                )}
              </div>
            ))}
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {step === 0 && (
                <div className="space-y-4">
                  <div>
                    <Label>Company Name</Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        className="pl-10"
                        placeholder="Your travel company name"
                        value={form.companyName}
                        onChange={(e) => update("companyName", e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Country</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <select
                        className="flex h-11 w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 text-sm backdrop-blur-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                        value={form.country}
                        onChange={(e) => update("country", e.target.value)}
                      >
                        {countries.map((c) => (
                          <option key={c} value={c} className="bg-slate-900">
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-4">
                  <div>
                    <Label>Owner Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        className="pl-10"
                        placeholder="Your full name"
                        value={form.ownerName}
                        onChange={(e) => update("ownerName", e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Work Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        className="pl-10"
                        type="email"
                        placeholder="you@company.com"
                        value={form.ownerEmail}
                        onChange={(e) => update("ownerEmail", e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        className="pl-10"
                        placeholder="+91 98765 43210"
                        value={form.phone}
                        onChange={(e) => update("phone", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <div>
                    <Label>Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        className="pl-10"
                        type="password"
                        placeholder="Min. 8 characters"
                        value={form.password}
                        onChange={(e) => update("password", e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        className="pl-10"
                        type="password"
                        placeholder="Confirm your password"
                        value={form.confirmPassword}
                        onChange={(e) => update("confirmPassword", e.target.value)}
                      />
                    </div>
                  </div>
                  <label className="flex items-start gap-3 text-sm">
                    <input
                      type="checkbox"
                      checked={accepted}
                      onChange={(e) => setAccepted(e.target.checked)}
                      className="mt-1 rounded border-white/20"
                    />
                    <span className="text-muted-foreground">
                      I agree to the{" "}
                      <a href="#" className="text-primary hover:underline">
                        Terms of Service
                      </a>{" "}
                      and{" "}
                      <a href="#" className="text-primary hover:underline">
                        Privacy Policy
                      </a>
                    </span>
                  </label>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="mt-8 flex gap-3">
            {step > 0 && (
              <Button variant="outline" onClick={() => setStep(step - 1)} className="flex-1">
                Back
              </Button>
            )}
            {step < 2 ? (
              <Button
                variant="gradient"
                className="flex-1"
                disabled={!canProceed()}
                onClick={() => setStep(step + 1)}
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                variant="gradient"
                className="flex-1"
                disabled={!canProceed() || loading}
                onClick={handleSubmit}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Create Free Demo"
                )}
              </Button>
            )}
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <a href={siteConfig.crmLogin} className="text-primary hover:underline">
              Login
            </a>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
