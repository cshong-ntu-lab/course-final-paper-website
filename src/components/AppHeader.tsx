// Top navigation for /workspace + /admin layouts.
// Editorial wordmark left · breadcrumb middle · user identity + logout right.

import Link from "next/link";

import { logoutAction } from "@/actions/auth";
import { Crest } from "@/components/Crest";
import { cn } from "@/lib/utils";

export interface AppHeaderProps {
  context: "student" | "admin";
  user: { displayName: string; email: string };
  breadcrumb?: ReadonlyArray<{ label: string; href?: string }>;
  adminBackLink?: boolean;
  workspaceLink?: boolean;
  /** Width + side padding of the page's <main>, e.g. "max-w-5xl px-7", so the
   *  crest lines up with the content's left edge. */
  container: string;
}

export function AppHeader({
  context,
  user,
  breadcrumb,
  adminBackLink,
  workspaceLink,
  container,
}: AppHeaderProps) {
  const homeHref = context === "admin" ? "/admin" : "/workspace";

  return (
    <header className="border-border bg-surface sticky top-0 z-40 border-b">
      <div className={cn("mx-auto flex h-14 items-center gap-5", container)}>
        <div className="flex shrink-0 items-center gap-2.5">
          <Crest linked />
          <Link
            href={homeHref}
            className="hover:text-accent font-sans text-base font-semibold transition-colors"
          >
            臺灣大學社會學系
          </Link>
        </div>

        {breadcrumb && breadcrumb.length > 0 && (
          <>
            <span className="text-subtle font-mono text-xs">/</span>
            <nav aria-label="breadcrumb" className="flex min-w-0 items-center gap-2 text-sm">
              {breadcrumb.map((item, i) => {
                const isLast = i === breadcrumb.length - 1;
                return (
                  <span key={i} className="flex items-center gap-2">
                    {i > 0 && <span className="text-subtle text-xs">›</span>}
                    {item.href && !isLast ? (
                      <Link
                        href={item.href}
                        className={cn(
                          "hover:text-accent text-muted truncate transition-colors",
                          "max-w-[220px]",
                        )}
                      >
                        {item.label}
                      </Link>
                    ) : (
                      <span
                        className={cn(
                          "text-foreground truncate font-medium",
                          "max-w-[280px]",
                          isLast && "font-serif",
                        )}
                      >
                        {item.label}
                      </span>
                    )}
                  </span>
                );
              })}
            </nav>
          </>
        )}

        <div className="flex-1" />

        <div className="text-subtle hidden text-xs sm:flex sm:items-center sm:gap-3">
          {adminBackLink && (
            <>
              <Link
                href="/admin"
                className="text-accent hover:text-accent-hover font-medium transition-colors focus-visible:outline-none focus-visible:underline focus-visible:underline-offset-[3px]"
              >
                回到管理員頁面
              </Link>
              <span className="bg-border h-3 w-px" />
            </>
          )}
          {workspaceLink && (
            <>
              <Link
                href="/workspace"
                className="text-accent hover:text-accent-hover font-medium transition-colors focus-visible:outline-none focus-visible:underline focus-visible:underline-offset-[3px]"
              >
                查看學生頁面
              </Link>
              <span className="bg-border h-3 w-px" />
            </>
          )}
          <span className="text-muted max-w-[180px] truncate">
            {user.displayName || user.email}
          </span>
          <span className="bg-border h-3 w-px" />
          {context === "student" && (
            <>
              <Link
                href="/workspace/settings"
                className="hover:text-accent transition-colors focus-visible:outline-none focus-visible:underline focus-visible:underline-offset-[3px]"
              >
                設定
              </Link>
              <span className="bg-border h-3 w-px" />
            </>
          )}
          <form action={logoutAction}>
            <button
              type="submit"
              className="hover:text-accent focus-visible:outline-none focus-visible:underline focus-visible:underline-offset-[3px] transition-colors"
            >
              登出
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
