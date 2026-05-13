"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";

import { enrollWithCodeAction, type EnrollResult } from "@/actions/enrollment";
import { setProfileNameAction } from "@/actions/profile";
import { CodeInput } from "@/components/CodeInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Step = 1 | 2;

const NAME_MIN = 2;
const NAME_MAX = 30;

const ENROLL_ERROR_COPY: Record<Exclude<EnrollResult, { ok: true }>["error"], string> = {
  invalid_code_format: "代碼格式不正確 — 共 6 碼英數字。",
  code_not_found: "找不到對應的課程，請確認代碼。",
  enrollment_closed: "這堂課已關閉註冊。請聯絡老師。",
  internal: "發生未預期錯誤，請稍後再試。",
};

export function OnboardingWizard({
  initialName,
  skipNameStep = false,
}: {
  initialName: string;
  skipNameStep?: boolean;
}) {
  const router = useRouter();
  const [step, setStep] = React.useState<Step>(1);
  const [code, setCode] = React.useState<string[]>(Array(6).fill(""));
  const [name, setName] = React.useState(initialName);
  const [pending, setPending] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const courseIdRef = React.useRef<string | null>(null);

  const codeJoined = code.join("");
  const codeComplete = codeJoined.length === 6;
  const nameValid = name.trim().length >= NAME_MIN && name.trim().length <= NAME_MAX;

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
    courseIdRef.current = res.courseId;
    if (skipNameStep) {
      // Keep pending=true so the button stays disabled during navigation.
      router.push("/workspace");
      router.refresh();
      return;
    }
    setPending(false);
    setStep(2);
  }

  async function submitStep2() {
    setErr(null);
    if (!nameValid) {
      setErr("請輸入 2–30 字的作者名稱。");
      return;
    }
    setPending(true);
    const res = await setProfileNameAction(name.trim());
    setPending(false);
    if (!res.ok) {
      setErr("無法儲存名稱，請稍後再試。");
      return;
    }
    router.push("/workspace");
    router.refresh();
  }

  return (
    <main id="main" className="bg-background grid min-h-screen place-items-center p-6 md:p-10">
      <div className="w-full max-w-[480px]">
        {/* Stepper — hidden for already-onboarded users (single step) */}
        {!skipNameStep && (
          <div className="mb-7 flex items-center justify-center gap-3">
            {([1, 2] as const).map((n) => (
              <React.Fragment key={n}>
                <div
                  className={cn(
                    "grid h-6 w-6 place-items-center rounded-full font-mono text-xs font-semibold",
                    n <= step
                      ? "bg-accent text-accent-foreground"
                      : "bg-canvas text-subtle border-border border",
                  )}
                >
                  {n}
                </div>
                {n === 1 && (
                  <div className={cn("h-px w-8", step >= 2 ? "bg-accent" : "bg-border")} />
                )}
              </React.Fragment>
            ))}
            <span className="text-2xs text-subtle ml-2 font-mono uppercase tracking-[0.08em]">
              步驟 {step} / 2
            </span>
          </div>
        )}

        {step === 1 && (
          <>
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
              <p className="text-subtle mt-3 text-center text-xs">
                代碼不區分大小寫；貼上後自動格式化
              </p>
            )}

            <Button
              size="lg"
              className="mt-7 w-full"
              onClick={submitStep1}
              disabled={!codeComplete || pending}
            >
              {pending ? "驗證中..." : "下一步 →"}
            </Button>
          </>
        )}

        {step === 2 && (
          <>
            <h1 className="mb-2 text-center font-serif text-3xl font-semibold tracking-tight">
              你的公開作者名稱
            </h1>
            <p className="text-muted mb-7 text-center font-serif text-base leading-relaxed text-pretty">
              這是會出現在你公開報告上的署名，可與 Google 帳號名稱不同。日後可在設定變更。
            </p>

            <Label htmlFor="profileName">作者名稱</Label>
            <Input
              id="profileName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-11 text-base"
              autoFocus
              maxLength={NAME_MAX}
              disabled={pending}
            />
            <p className="text-subtle mt-2 mb-6 text-xs">
              {NAME_MIN}–{NAME_MAX} 字，可含中文、英文、數字、空格
            </p>

            {/* Preview card */}
            <div className="rounded-md border-border bg-surface mb-7 border px-4 py-3.5">
              <div className="text-2xs text-subtle mb-2 font-mono uppercase tracking-[0.08em]">
                預覽 · 你的報告會這樣顯示
              </div>
              <div className="mb-1 font-serif text-base font-semibold tracking-tight">
                當代社會變遷下的勞動關係研究
              </div>
              <div className="text-subtle text-xs">
                <span className="text-muted font-medium">{name.trim() || "—"}</span> · 2026-04-15 ·
                14 分鐘
              </div>
            </div>

            {err && (
              <p className="text-destructive mb-3 text-sm font-medium" role="alert">
                {err}
              </p>
            )}

            <Button
              size="lg"
              className="w-full"
              onClick={submitStep2}
              disabled={!nameValid || pending}
            >
              {pending ? "儲存中..." : "完成設定，進入工作區"}
            </Button>
            <Button
              variant="ghost"
              size="default"
              className="text-muted mt-2 w-full"
              onClick={() => {
                setErr(null);
                setStep(1);
              }}
              disabled={pending}
            >
              ← 上一步
            </Button>
          </>
        )}
      </div>
    </main>
  );
}
