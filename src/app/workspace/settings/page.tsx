// design.md §3.10 — student profile settings.

import { redirect } from "next/navigation";

import { AppHeader } from "@/components/AppHeader";
import { Footer } from "@/components/Footer";
import { getCurrentUser } from "@/lib/server/auth";

import { SettingsForm } from "./SettingsForm";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?from=/workspace/settings");

  return (
    <div className="bg-background min-h-screen">
      <AppHeader
        context="student"
        user={{ displayName: user.profileDisplayName || user.displayName, email: user.email }}
        breadcrumb={[{ label: "工作區", href: "/workspace" }, { label: "個人設定" }]}
      />

      <main id="main" className="mx-auto max-w-2xl px-6 py-10">
        <div className="mb-8">
          <div className="text-subtle mb-1.5 font-mono text-2xs uppercase tracking-[0.12em]">
            個人設定
          </div>
          <h1 className="font-serif text-3xl font-semibold tracking-tight">個人資料</h1>
        </div>

        <div className="rounded-md border border-border bg-surface p-6">
          <SettingsForm
            currentName={user.profileDisplayName || user.displayName}
            email={user.email}
            currentTitle={user.title ?? ""}
            currentBio={user.bio ?? ""}
            currentAvatarUrl={user.avatarUrl}
          />
        </div>

        <section className="mt-10">
          <h2 className="border-border text-destructive mb-3 border-b pb-2 font-serif text-base font-semibold">
            危險區
          </h2>
          <div className="border-destructive/30 bg-destructive-soft flex items-center justify-between gap-4 rounded-md border px-5 py-4">
            <div>
              <div className="text-destructive-fg mb-0.5 text-sm font-medium">刪除我的帳號</div>
              <div className="text-muted text-xs leading-relaxed">
                所有已發布的報告會被移除、所有上傳的圖片會被刪除。此操作無法復原。
              </div>
            </div>
            <button
              disabled
              className="border-destructive/50 text-destructive shrink-0 cursor-not-allowed rounded border bg-white px-4 py-2 text-sm opacity-50"
              title="請聯繫課程管理員刪除帳號"
            >
              刪除帳號…
            </button>
          </div>
          <p className="text-subtle mt-2 text-xs">如需刪除帳號，請聯繫課程管理員。</p>
        </section>
      </main>

      <Footer />
    </div>
  );
}
