// design.md §3.4 — L2 Editorial Split
// Login is a public page; the server-action / route handler does the actual exchange.

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { getCurrentUser } from "@/lib/server/auth";

export const metadata: Metadata = {
  title: "登入",
  description: "登入 NTU 社會所課程報告平台",
};

export default async function LoginPage() {
  // Already signed in → bounce to role-appropriate home.
  const user = await getCurrentUser();
  if (user) {
    if (user.role === "admin") redirect("/admin");
    if (!user.isOnboarded) redirect("/workspace/onboarding");
    redirect("/workspace");
  }

  return (
    <div className="bg-background grid min-h-screen grid-cols-1 md:grid-cols-2">
      {/* Left editorial column (md+) */}
      <aside className="border-border bg-background hidden flex-col justify-between border-r p-16 md:flex">
        <Link href="/" className="inline-flex items-baseline gap-2">
          <span className="font-serif text-xl font-semibold tracking-tight">研究筆記</span>
          <span className="text-2xs text-subtle font-mono tracking-[0.06em]">NTU SOC</span>
        </Link>

        <div>
          <div className="text-2xs text-subtle mb-5 font-mono uppercase tracking-[0.18em]">
            Vol. 03 · 2026 春
          </div>
          <blockquote className="font-serif text-3xl leading-[1.35] font-medium tracking-tight text-pretty">
            「研究筆記的目的，是讓田野的聲音能夠被聽見、被引用、被回應。」
          </blockquote>
          <footer className="text-subtle mt-4 text-sm">—— 主編語</footer>
        </div>

        <div className="text-subtle text-xs">© 2026 NTU Sociology</div>
      </aside>

      {/* Right form column */}
      <main id="main" className="bg-surface grid place-items-center p-10 md:p-16">
        <div className="w-full max-w-sm">
          {/* Mobile-only wordmark at top */}
          <Link href="/" className="mb-8 inline-flex items-baseline gap-2 md:hidden">
            <span className="font-serif text-lg font-semibold tracking-tight">研究筆記</span>
            <span className="text-2xs text-subtle font-mono tracking-[0.06em]">NTU SOC</span>
          </Link>

          <h1 className="mb-2 font-serif text-4xl font-semibold tracking-tight">登入</h1>
          <p className="text-muted mb-7 font-serif text-base leading-relaxed">
            僅供台大社會所師生使用。
          </p>

          <GoogleSignInButton />

          <p className="text-subtle mt-4 text-xs leading-relaxed">
            登入即表示同意{" "}
            <Link
              href="/tos"
              className="text-accent decoration-accent/40 underline underline-offset-[3px]"
            >
              使用條款
            </Link>{" "}
            與{" "}
            <Link
              href="/privacy"
              className="text-accent decoration-accent/40 underline underline-offset-[3px]"
            >
              隱私政策
            </Link>
            。
          </p>
        </div>
      </main>
    </div>
  );
}
