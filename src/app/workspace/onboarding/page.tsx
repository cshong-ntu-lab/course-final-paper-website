// design.md §3.5 — 2-step wizard
// Server component shell; the wizard itself is client because of step + form state.

import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { OnboardingWizard } from "@/app/workspace/onboarding/wizard";
import { getCurrentUser } from "@/lib/server/auth";

export const metadata: Metadata = {
  title: "歡迎加入",
};

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?from=/workspace/onboarding");
  // Admin doesn't onboard — bounce straight to admin.
  if (user.role === "admin") redirect("/admin");
  // Already onboarded → workspace home.
  if (user.isOnboarded) redirect("/workspace");

  return <OnboardingWizard initialName={user.displayName ?? ""} />;
}
