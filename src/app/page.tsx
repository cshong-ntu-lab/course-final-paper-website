import { Button } from "@/components/ui/button";

// Phase 0 hello-world — verifies design.md tokens render correctly.
// Will be replaced in Phase 4 with the public homepage (design.md §3.1).
export default function Home() {
  return (
    <main id="main" className="mx-auto max-w-3xl px-7 py-24">
      <p className="text-2xs text-subtle mb-3 font-mono uppercase tracking-[0.08em]">
        Phase 0 · Design Foundation
      </p>
      <h1 className="text-foreground font-serif text-5xl font-semibold tracking-tight">
        課程報告 · 台大社會所
      </h1>
      <p className="text-muted mt-5 max-w-prose font-serif text-xl leading-[1.8]">
        Forest accent ·{" "}
        <a
          href="#"
          className="text-accent decoration-accent/40 underline underline-offset-[3px] hover:decoration-current"
        >
          連結會用 accent 色
        </a>
        ，搭配 underline-offset 讓閱讀流暢。
      </p>

      <div className="mt-10 flex flex-wrap items-center gap-3">
        <Button>發布報告</Button>
        <Button variant="secondary">取消</Button>
        <Button variant="ghost">編輯</Button>
        <Button variant="link">查看 diff →</Button>
        <Button variant="destructive">下架</Button>
      </div>

      <div className="border-border mt-12 border-t pt-6">
        <p className="text-subtle text-sm">
          這是 Phase 0 hello-world，驗證 design.md §1 tokens（Forest accent · Noto Serif TC ·
          JetBrains Mono）已正確套用。
        </p>
      </div>
    </main>
  );
}
