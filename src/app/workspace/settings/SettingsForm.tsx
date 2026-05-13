"use client";

import { useState } from "react";

import { setProfileNameAction } from "@/actions/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  currentName: string;
  email: string;
}

export function SettingsForm({ currentName, email }: Props) {
  const [name, setName] = useState(currentName);
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setSaved(false);
    setError(null);
    const res = await setProfileNameAction(name);
    setPending(false);
    if (res.ok) {
      setSaved(true);
    } else if (res.error === "invalid_length") {
      setError("作者名稱須介於 2–30 個字元之間。");
    } else {
      setError("儲存失敗，請稍後再試。");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <Label htmlFor="author-name">預設暱稱</Label>
        <Input
          id="author-name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setSaved(false);
          }}
          placeholder="你的公開署名"
          maxLength={30}
          aria-invalid={!!error}
        />
        <p className="text-subtle mt-1.5 text-xs">
          新建報告時的預設作者名稱。每份報告的作者欄位可再個別修改。
        </p>
        {error && <p className="text-destructive mt-1.5 text-xs">{error}</p>}
        {saved && <p className="text-success-fg mt-1.5 text-xs">已儲存。</p>}
      </div>

      <div>
        <Label>Email</Label>
        <div className="border-border flex h-9 items-center justify-between rounded border bg-canvas px-3 text-sm">
          <span className="text-muted">{email}</span>
          <span className="text-subtle font-mono text-2xs">由 Google 提供，無法變更</span>
        </div>
      </div>

      <div className="pt-1">
        <Button type="submit" disabled={pending || name.trim() === currentName}>
          {pending ? "儲存中…" : "儲存變更"}
        </Button>
      </div>
    </form>
  );
}
