// design.md §3.4 — L2 Editorial Split
// Login is a public page; the server-action / route handler does the actual exchange.

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { Crest } from "@/components/Crest";
import { getCurrentUser } from "@/lib/server/auth";

import loginPainting from "@/assets/login-painting.jpg";

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
      {/* Left painting panel (md+): the department building */}
      <aside className="relative isolate hidden flex-col justify-between overflow-hidden p-16 text-white md:flex">
        <Image
          src={loginPainting}
          alt="社會科學院大樓的手繪畫作"
          fill
          priority
          placeholder="blur"
          sizes="50vw"
          className="-z-20 object-cover object-[55%_center]"
        />
        {/* scrims keep the site name and small print legible over the painting */}
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-linear-to-b from-black/45 via-transparent via-35% to-black/45"
        />

        <Link
          href="/"
          className="self-start font-sans text-xl font-semibold [text-shadow:0_1px_8px_rgb(0_0_0/0.4)]"
        >
          臺灣大學社會學系
        </Link>

        <div className="text-xs text-white/85 [text-shadow:0_1px_6px_rgb(0_0_0/0.5)]">
          © 2026 NTU Sociology
        </div>
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
