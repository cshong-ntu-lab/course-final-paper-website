"use client";

import Link from "next/link";

export default function NotFound() {
  return (
    <div className="bg-background flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <p className="text-subtle font-mono text-2xs uppercase tracking-[0.12em]">404</p>
      <h1 className="font-serif mt-3 text-3xl font-semibold tracking-tight">找不到這個頁面</h1>
      <p className="text-muted mt-3 max-w-sm text-sm leading-relaxed">
        這個網址不存在，或者內容已被移除。
      </p>
      <Link
        href="/"
        className="bg-accent text-accent-foreground hover:bg-accent-hover mt-8 rounded px-5 py-2.5 text-sm font-medium transition-colors"
      >
        回到首頁
      </Link>
    </div>
  );
}
