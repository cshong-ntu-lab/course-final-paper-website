// design.md §3.4 — L2 Editorial Split
// Login is a public page; the server-action / route handler does the actual exchange.

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { Crest } from "@/components/Crest";
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
        <Link href="/" className="font-sans text-xl font-semibold">
          臺灣大學社會學系
        </Link>

        <div>
          <blockquote className="font-serif text-2xl leading-[1.45] font-medium tracking-tight text-pretty">
            &ldquo;The future of AI research will require training models to better understand the
            science of social relationships.&rdquo;
          </blockquote>
          <footer className="text-subtle mt-5 text-xs leading-relaxed">
            —— C.A. Bail, <cite>Can Generative AI improve social science?</cite>, Proc. Natl. Acad.
            Sci. U.S.A. 121 (21) e2314021121 (2024).
          </footer>
        </div>

        <div className="text-subtle text-xs">© 2026 NTU Sociology</div>
      </aside>

      {/* Right form column */}
      <main id="main" className="bg-surface grid place-items-center p-10 md:p-16">
        <div className="w-full max-w-sm">
          {/* Mobile-only wordmark at top */}
          <Link href="/" className="mb-8 inline-block font-sans text-lg font-semibold md:hidden">
            臺灣大學社會學系
          </Link>

          <Crest size="lg" className="mb-4" />
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
