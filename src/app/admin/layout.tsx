import { redirect } from "next/navigation";

import { AppHeader } from "@/components/AppHeader";
import { getCurrentUser } from "@/lib/server/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?from=/admin");
  if (user.role !== "admin") redirect("/workspace");

  return (
    <div className="bg-background min-h-screen">
      <AppHeader
        context="admin"
        user={{ displayName: user.profileDisplayName || user.displayName, email: user.email }}
      />
      {children}
    </div>
  );
}
