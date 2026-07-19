import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-border border-t">
      {/* Top row — wordmark + description */}
      <div className="mx-auto max-w-[1180px] px-6 py-10 sm:px-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Link href="/" className="font-serif text-base font-semibold tracking-tight">
              台大社會學系
            </Link>
            <p className="text-subtle mt-1.5 max-w-xs text-xs leading-relaxed">
              國立臺灣大學社會學系與社會學研究所人工智慧課程成果
            </p>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-border border-t">
        <div className="mx-auto flex max-w-[1180px] items-center justify-between px-6 py-4 sm:px-10">
          <span className="text-subtle text-xs">© {new Date().getFullYear()} NTU Sociology</span>
          <div className="text-subtle flex gap-4 text-xs">
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              隱私政策
            </Link>
            <Link href="/tos" className="hover:text-foreground transition-colors">
              使用條款
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
