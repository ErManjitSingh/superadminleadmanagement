import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Start Free Demo",
  description: "Create your Travel CRM workspace — 14-day free trial, no credit card required.",
};

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
