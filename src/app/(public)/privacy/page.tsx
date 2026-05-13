// Phase 7 will replace this with the full privacy policy text.
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "隱私權政策" };

export default function PrivacyPage() {
  return (
    <main id="main" className="mx-auto max-w-3xl px-6 py-16">
      <Link href="/" className="text-muted hover:text-foreground mb-8 inline-block text-sm">
        ← 返回首頁
      </Link>
      <h1 className="font-serif text-4xl font-semibold tracking-tight">隱私權政策</h1>
      <p className="text-muted mt-6 text-sm">本頁面內容待補充。</p>
    </main>
  );
}
