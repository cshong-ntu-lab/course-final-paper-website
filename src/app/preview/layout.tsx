// Auth-gated layout for all /preview pages.
// Any logged-in user (student or admin) may access preview.

import { redirect } from "next/navigation";

import { PreviewBanner } from "@/components/PreviewBanner";
import { getCurrentUser } from "@/lib/server/auth";

export default async function PreviewLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?from=/preview");

  return (
    <div className="bg-background min-h-screen">
      <PreviewBanner />
      {children}
    </div>
  );
}
