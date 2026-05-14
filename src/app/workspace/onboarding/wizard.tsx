"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";

import { enrollWithCodeAction, type EnrollResult } from "@/actions/enrollment";
import { CodeInput } from "@/components/CodeInput";
import { Button } from "@/components/ui/button";

const ENROLL_ERROR_COPY: Record<Exclude<EnrollResult, { ok: true }>["error"], string> = {
  invalid_code_format: "代碼格式不正確 — 共 6 碼英數字。",
  code_not_found: "找不到對應的課程，請確認代碼。",
  enrollment_closed: "這堂課已關閉註冊。請聯絡老師。",
  internal: "發生未預期錯誤，請稍後再試。",
};

export function OnboardingWizard() {
  const router = useRouter();
  const [code, setCode] = React.useState<string[]>(Array(6).fill(""));
  const [pending, setPending] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  const codeJoined = code.join("");
  const codeComplete = codeJoined.length === 6;

  async function submitStep1() {
    setErr(null);
    if (!codeComplete) return;
    setPending(true);
    const res = await enrollWithCodeAction(codeJoined);
    if (!res.ok) {
      setPending(false);
      setErr(ENROLL_ERROR_COPY[res.error]);
      return;
    }
    // Keep pending=true so the button stays disabled during navigation.
    // Do NOT call router.refresh() here — it races against router.push and can
    // cancel the navigation, leaving the button stuck at "驗證中…" forever.
    router.push("/workspace");
  }

  return (
    <main id="main" className="bg-background grid min-h-screen place-items-center p-6 md:p-10">
      <div className="w-full max-w-[480px]">
        <div className="mb-6 text-center">
          <Link
            href="/workspace"
            className="text-muted hover:text-foreground inline-flex items-center gap-1 text-sm transition-colors"
          >
            ← 返回工作區
          </Link>
        </div>
        <h1 className="mb-2 text-center font-serif text-3xl font-semibold tracking-tight">
          輸入課程代碼
        </h1>
        <p className="text-muted mb-8 text-center font-serif text-base leading-relaxed text-pretty">
          代碼由開課老師提供，共 6 碼英數字。沒有代碼？
          <Link href="/" className="text-accent underline underline-offset-[3px]">
            先瀏覽公開頁
          </Link>
          。
        </p>

        <CodeInput value={code} onChange={setCode} error={!!err} disabled={pending} />
        {err ? (
          <p className="text-destructive mt-3 text-center text-sm font-medium" role="alert">
            {err}
          </p>
        ) : (
          <p className="text-subtle mt-3 text-center text-xs">代碼不區分大小寫；貼上後自動格式化</p>
        )}

        <Button
          size="lg"
          className="mt-7 w-full"
          onClick={submitStep1}
          disabled={!codeComplete || pending}
        >
          {pending ? "驗證中..." : "加入課程 →"}
        </Button>
      </div>
    </main>
  );
}
