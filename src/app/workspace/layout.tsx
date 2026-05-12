// Auth gate for all /workspace/* routes. Does NOT render AppHeader here —
// the editor (/workspace/c/{id}) has its own full-viewport chrome and would
// double-stack a global header. Pages that want the standard top nav render
// <AppHeader /> themselves.

import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/server/auth";

export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?from=/workspace");
  return <>{children}</>;
}
