"use client";
// docs/design-v2.md §4.0 — the one header for every public page (home, preview,
// reader, author, about, legal). Crest + wordmark left, 關於本站 / 文章分類 in
// the middle, account right. Topics and the signed-in user come from
// /api/site-nav after mount, so the pages themselves stay static / ISR.
// Below `sm` the nav and account fold into one 選單 menu to keep a single row
// (the reader's sticky offsets assume a 56px header).

import { ChevronDown, Menu } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { DropdownMenu } from "radix-ui";
import { useCallback, useEffect, useState } from "react";

import type { SiteNavData } from "@/app/api/site-nav/route";
import { Avatar } from "@/components/Avatar";
import { Crest } from "@/components/Crest";
import { FEED_FILTER_HASH, OPEN_FEED_FILTER_EVENT, feedFilterHref } from "@/lib/feed";
import { cn } from "@/lib/utils";

const MENU_CONTENT = cn(
  "border-border bg-surface shadow-soft z-50 max-h-[min(70vh,420px)] min-w-[168px] overflow-y-auto rounded-xl border p-1.5",
  "origin-(--radix-dropdown-menu-content-transform-origin)",
  "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=open]:slide-in-from-top-1 data-[state=open]:duration-180 data-[state=open]:ease-out",
  "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=closed]:duration-120 data-[state=closed]:ease-in",
);
const MENU_ITEM =
  "text-muted data-[highlighted]:bg-canvas data-[highlighted]:text-accent block cursor-pointer rounded-lg px-3.5 py-2 text-sm whitespace-nowrap outline-none";
const MENU_LABEL = "text-subtle px-3.5 pt-2 pb-1 text-2xs font-semibold tracking-[0.12em]";
const MENU_SEPARATOR = "bg-border mx-1 my-1.5 h-px";
/** Topics listed in 文章分類 (most used first); the rest are one click away in
 *  the home filter panel via 「更多主題」. */
const NAV_TOPIC_MAX = 8;
const NAV_LINK = "text-muted hover:text-accent text-sm font-medium transition-colors";

export interface SiteHeaderProps {
  /** Width + side padding of the page's content column, so the crest lines up with it. */
  container?: string;
  /** Where the wordmark and the 文章分類 links go ("/" or "/preview"). */
  homeHref?: string;
  stickyTop?: string;
  /** Right side, before the account (e.g. the reader's 草稿 badge). */
  extra?: React.ReactNode;
  /** Under the header row (e.g. the reader's progress sliver). */
  children?: React.ReactNode;
}

function useSiteNav() {
  const [data, setData] = useState<SiteNavData | null>(null);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    fetch("/api/site-nav")
      .then((res) => (res.ok ? (res.json() as Promise<SiteNavData>) : null))
      .then((d) => {
        if (!cancelled && d) setData(d);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const logout = useCallback(async () => {
    await fetch("/api/auth/session", { method: "DELETE" });
    setData((d) => d && { ...d, user: null });
    router.refresh();
  }, [router]);

  return { data, logout };
}

export function SiteHeader({
  container = "max-w-[1180px] px-6",
  homeHref = "/",
  stickyTop = "top-0",
  extra,
  children,
}: SiteHeaderProps) {
  const { data, logout } = useSiteNav();
  const pathname = usePathname();
  const router = useRouter();
  const topics = data?.topics ?? [];
  const user = data?.user;

  const topicItems = (
    <>
      <DropdownMenu.Item asChild className={MENU_ITEM}>
        <Link href={homeHref}>全部文章</Link>
      </DropdownMenu.Item>
      {topics.length > 0 && <DropdownMenu.Separator className={MENU_SEPARATOR} />}
      {topics.slice(0, NAV_TOPIC_MAX).map((t) => (
        <DropdownMenu.Item key={t} asChild className={MENU_ITEM}>
          <Link href={feedFilterHref({ kind: "topic", value: t }, homeHref)}>{t}</Link>
        </DropdownMenu.Item>
      ))}
      {topics.length > NAV_TOPIC_MAX && (
        <>
          <DropdownMenu.Separator className={MENU_SEPARATOR} />
          <DropdownMenu.Item
            className={cn(MENU_ITEM, "text-accent font-semibold")}
            onSelect={() => {
              if (pathname === homeHref) window.dispatchEvent(new Event(OPEN_FEED_FILTER_EVENT));
              else router.push(`${homeHref}${FEED_FILTER_HASH}`);
            }}
          >
            更多主題（共 {topics.length} 個）
          </DropdownMenu.Item>
        </>
      )}
    </>
  );

  return (
    <header
      className={cn("border-border bg-background/95 sticky z-40 border-b backdrop-blur", stickyTop)}
    >
      <div className={cn("mx-auto flex h-14 items-center justify-between gap-6", container)}>
        <div className="flex shrink-0 items-center gap-2.5">
          <Crest linked />
          <Link href={homeHref} className="font-sans text-lg font-semibold">
            臺灣大學社會學系
          </Link>
        </div>

        <nav aria-label="網站導覽" className="hidden items-center gap-6 sm:flex">
          <Link href="/about" className={NAV_LINK}>
            關於本站
          </Link>
          <DropdownMenu.Root modal={false}>
            <DropdownMenu.Trigger
              className={cn(NAV_LINK, "group inline-flex items-center gap-1 outline-none")}
            >
              文章分類
              <ChevronDown
                aria-hidden="true"
                className="size-3.5 transition-transform duration-150 group-data-[state=open]:rotate-180"
              />
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content align="center" sideOffset={12} className={MENU_CONTENT}>
                {topicItems}
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </nav>

        <div className="flex items-center gap-3.5">
          {extra}

          {/* Account — sm and up */}
          <div className="hidden min-w-[52px] items-center justify-end gap-2.5 sm:flex">
            {data &&
              (user ? (
                <>
                  {user.role === "student" && <Avatar name={user.name} src={user.avatarUrl} />}
                  <Link
                    href={user.role === "admin" ? "/admin" : "/workspace"}
                    className="text-accent hover:text-accent-hover text-sm font-bold transition-colors"
                  >
                    {user.role === "admin" ? "後台管理" : "工作區"}
                  </Link>
                  <button
                    type="button"
                    onClick={logout}
                    className="text-subtle hover:text-accent text-xs underline underline-offset-2 transition-colors"
                  >
                    登出
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  className="bg-accent text-accent-foreground hover:bg-accent-hover rounded-full px-4 py-1.5 text-xs font-semibold transition-colors"
                >
                  登入
                </Link>
              ))}
          </div>

          {/* Everything in one menu below sm */}
          <DropdownMenu.Root modal={false}>
            <DropdownMenu.Trigger
              aria-label="選單"
              className="text-muted hover:text-accent border-border-strong inline-flex size-9 items-center justify-center rounded-full border outline-none sm:hidden"
            >
              <Menu className="size-4" aria-hidden="true" />
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content align="end" sideOffset={10} className={MENU_CONTENT}>
                <DropdownMenu.Item asChild className={MENU_ITEM}>
                  <Link href="/about">關於本站</Link>
                </DropdownMenu.Item>
                <DropdownMenu.Separator className={MENU_SEPARATOR} />
                <DropdownMenu.Label className={MENU_LABEL}>文章分類</DropdownMenu.Label>
                {topicItems}
                <DropdownMenu.Separator className={MENU_SEPARATOR} />
                {user ? (
                  <>
                    <DropdownMenu.Item asChild className={cn(MENU_ITEM, "text-accent font-bold")}>
                      <Link href={user.role === "admin" ? "/admin" : "/workspace"}>
                        {user.role === "admin" ? "後台管理" : "工作區"}
                      </Link>
                    </DropdownMenu.Item>
                    <DropdownMenu.Item className={MENU_ITEM} onSelect={logout}>
                      登出
                    </DropdownMenu.Item>
                  </>
                ) : (
                  <DropdownMenu.Item asChild className={cn(MENU_ITEM, "text-accent font-bold")}>
                    <Link href="/login">登入</Link>
                  </DropdownMenu.Item>
                )}
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      </div>
      {children}
    </header>
  );
}
