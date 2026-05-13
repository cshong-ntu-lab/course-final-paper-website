"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[ErrorBoundary]", error);
  }, [error]);

  return (
    <div className="bg-background flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <p className="text-subtle font-mono text-2xs uppercase tracking-[0.12em]">發生錯誤</p>
      <h1 className="font-serif mt-3 text-3xl font-semibold tracking-tight">出了一點問題</h1>
      <p className="text-muted mt-3 max-w-sm text-sm leading-relaxed">
        伺服器遇到未預期的錯誤。請稍後再試，或聯繫課程管理員。
      </p>
      {error.digest && (
        <p className="text-subtle mt-2 font-mono text-xs">錯誤代碼：{error.digest}</p>
      )}
      <button
        onClick={reset}
        className="bg-accent text-accent-foreground hover:bg-accent-hover mt-8 rounded px-5 py-2.5 text-sm font-medium transition-colors"
      >
        重試
      </button>
    </div>
  );
}
