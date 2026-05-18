"use client";

import { useState } from "react";

import { updateProfileAction } from "@/actions/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAvatarUpload } from "@/lib/client/useImageUpload";
import { cn } from "@/lib/utils";

interface Props {
  currentName: string;
  email: string;
  currentTitle: string;
  currentBio: string;
  currentAvatarUrl: string | null | undefined;
}

export function SettingsForm({
  currentName,
  email,
  currentTitle,
  currentBio,
  currentAvatarUrl,
}: Props) {
  const [name, setName] = useState(currentName);
  const [title, setTitle] = useState(currentTitle);
  const [bio, setBio] = useState(currentBio);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(currentAvatarUrl ?? null);
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const avatarUpload = useAvatarUpload();

  const isDirty =
    name.trim() !== currentName ||
    title !== currentTitle ||
    bio !== currentBio ||
    avatarUrl !== (currentAvatarUrl ?? null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setSaved(false);
    setError(null);
    const res = await updateProfileAction({
      profileDisplayName: name,
      title,
      bio,
      avatarUrl,
    });
    setPending(false);
    if (res.ok) {
      setSaved(true);
    } else if (res.error === "invalid_input") {
      setError("作者名稱須介於 2–30 個字元之間。");
    } else {
      setError("儲存失敗，請稍後再試。");
    }
  }

  const handleAvatarUpload = async (file: File) => {
    const url = await avatarUpload.upload(file);
    if (url) {
      setAvatarUrl(url);
      setSaved(false);
    }
  };

  const handleAvatarRemove = () => {
    setAvatarUrl(null);
    setSaved(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Avatar */}
      <div>
        <Label>頭像</Label>
        <div className="mt-1.5 flex items-center gap-4">
          <div className="relative h-16 w-16 shrink-0">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt="頭像"
                className="h-16 w-16 rounded-full object-cover ring-1 ring-border"
              />
            ) : (
              <div className="bg-canvas border-border flex h-16 w-16 items-center justify-center rounded-full border">
                <span className="text-subtle text-xl font-serif font-semibold">
                  {(currentName || "?")[0]}
                </span>
              </div>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="cursor-pointer">
              <div
                className={cn(
                  "border-border bg-surface inline-flex items-center gap-1.5 rounded border px-3 py-1.5 font-mono text-[11px] transition-colors hover:border-accent hover:text-accent",
                  avatarUpload.state.phase === "uploading" && "opacity-60",
                )}
              >
                {avatarUpload.state.phase === "uploading"
                  ? `${avatarUpload.state.percent}%`
                  : avatarUpload.state.phase === "compressing" ||
                      avatarUpload.state.phase === "finalizing"
                    ? "處理中…"
                    : "上傳頭像"}
              </div>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void handleAvatarUpload(f);
                  e.target.value = "";
                }}
              />
            </label>
            {avatarUpload.state.phase === "error" && (
              <p className="text-warning-fg font-mono text-[11px]">上傳失敗，請重試</p>
            )}
            {avatarUrl && (
              <button
                type="button"
                onClick={handleAvatarRemove}
                className="text-subtle hover:text-foreground text-left font-mono text-[11px] hover:underline"
              >
                移除頭像
              </button>
            )}
            <p className="text-subtle font-mono text-[10px]">JPG · PNG · WebP，最大 5 MB</p>
          </div>
        </div>
      </div>

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
        <Label htmlFor="profile-title">稱謂</Label>
        <Input
          id="profile-title"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            setSaved(false);
          }}
          placeholder="如：社會學系碩士生"
          maxLength={60}
        />
      </div>

      <div>
        <Label htmlFor="profile-bio">自我介紹</Label>
        <textarea
          id="profile-bio"
          value={bio}
          onChange={(e) => {
            setBio(e.target.value);
            setSaved(false);
          }}
          rows={3}
          placeholder="選填，顯示於報告頁面底部"
          maxLength={400}
          className="border-border-strong bg-surface placeholder:text-subtle focus-visible:border-accent focus-visible:ring-accent-soft min-h-[72px] w-full resize-y rounded border px-3 py-2 font-sans text-sm leading-relaxed focus-visible:ring-2 focus-visible:outline-none"
        />
      </div>

      <div>
        <Label>Email</Label>
        <div className="border-border flex h-9 items-center justify-between rounded border bg-canvas px-3 text-sm">
          <span className="text-muted">{email}</span>
          <span className="text-subtle font-mono text-2xs">由 Google 提供，無法變更</span>
        </div>
      </div>

      <div className="pt-1">
        <Button type="submit" disabled={pending || !isDirty}>
          {pending ? "儲存中…" : "儲存變更"}
        </Button>
      </div>
    </form>
  );
}
