"use client";

import { useRouter, useSearchParams } from "next/navigation";
import * as React from "react";

import { getFirebaseClient } from "@/lib/firebase/client";

// Inline Google "G" mark.
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M21.6 12.227c0-.71-.064-1.392-.182-2.045H12v3.868h5.382a4.6 4.6 0 0 1-1.996 3.018v2.51h3.232c1.891-1.742 2.982-4.305 2.982-7.351z"
        fill="#4285F4"
      />
      <path
        d="M12 22c2.7 0 4.964-.895 6.618-2.422l-3.232-2.51c-.895.6-2.04.955-3.386.955-2.605 0-4.81-1.76-5.598-4.123H3.064v2.59A9.996 9.996 0 0 0 12 22z"
        fill="#34A853"
      />
      <path
        d="M6.402 13.9A6.006 6.006 0 0 1 6.09 12c0-.66.114-1.302.31-1.9V7.51H3.065A9.996 9.996 0 0 0 2 12c0 1.614.386 3.14 1.064 4.49l3.338-2.59z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.977c1.47 0 2.787.505 3.823 1.496l2.868-2.868C16.96 2.99 14.696 2 12 2A9.996 9.996 0 0 0 3.064 7.51l3.338 2.59C7.19 7.737 9.395 5.977 12 5.977z"
        fill="#EA4335"
      />
    </svg>
  );
}

type AuthErrorCode = "popup_closed_by_user" | "popup_blocked" | "session_failed" | "internal";

const ERROR_COPY: Record<AuthErrorCode, string> = {
  popup_closed_by_user: "登入視窗被關閉，請再試一次。",
  popup_blocked: "瀏覽器封鎖了登入彈出視窗，請允許彈出後再試。",
  session_failed: "登入流程失敗，請再試一次或稍後再來。",
  internal: "發生未預期錯誤。",
};

export function GoogleSignInButton() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, setPending] = React.useState(false);
  const [errCode, setErrCode] = React.useState<AuthErrorCode | null>(null);

  async function handleSignIn() {
    setPending(true);
    setErrCode(null);
    try {
      const { signInWithPopup, GoogleAuthProvider } = await import("firebase/auth");
      const { auth } = getFirebaseClient();
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });

      let cred;
      try {
        cred = await signInWithPopup(auth, provider);
      } catch (e) {
        const code = (e as { code?: string })?.code ?? "";
        if (code === "auth/popup-closed-by-user") setErrCode("popup_closed_by_user");
        else if (code === "auth/popup-blocked") setErrCode("popup_blocked");
        else {
          console.error("[GoogleSignIn] signInWithPopup error:", code, e);
          setErrCode("internal");
        }
        setPending(false);
        return;
      }

      const idToken = await cred.user.getIdToken(true);
      const res = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      if (!res.ok) {
        setErrCode("session_failed");
        // Sign out client-side too so the next attempt is clean.
        const { signOut } = await import("firebase/auth");
        await signOut(auth);
        setPending(false);
        return;
      }

      const { role } = (await res.json()) as { role: "student" | "admin" };
      const dest = searchParams.get("from") ?? (role === "admin" ? "/admin" : "/workspace");
      router.push(dest);
      router.refresh();
    } catch {
      setErrCode("internal");
      setPending(false);
    }
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={handleSignIn}
        disabled={pending}
        className="bg-surface border-border-strong hover:bg-canvas focus-visible:ring-accent flex h-11 w-full items-center justify-center gap-3 rounded border text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-60"
      >
        <GoogleIcon className="h-4 w-4" />
        {pending ? "登入中..." : "使用 Google 帳號登入"}
      </button>
      {errCode && (
        <p className="text-destructive text-sm" role="alert">
          {ERROR_COPY[errCode]}
        </p>
      )}
    </div>
  );
}
