import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/server/auth";

// AppHeader is rendered by each admin sub-page so breadcrumbs can vary per route.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?from=/admin");
  if (user.role !== "admin") redirect("/workspace");

  return <div className="bg-background min-h-screen">{children}</div>;
}
