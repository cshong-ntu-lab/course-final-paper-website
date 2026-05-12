import { redirect } from "next/navigation";

import { AppHeader } from "@/components/AppHeader";
import { getCurrentUser } from "@/lib/server/auth";

export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?from=/workspace");

  return (
    <div className="bg-background min-h-screen">
      <AppHeader
        context="student"
        user={{ displayName: user.profileDisplayName || user.displayName, email: user.email }}
      />
      {children}
    </div>
  );
}
