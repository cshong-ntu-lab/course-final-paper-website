// docs/design-v2.md §4.0 — 關於本站, linked from the site header.
import type { Metadata } from "next";
import Link from "next/link";

import { Footer } from "@/components/Footer";
import { SiteHeader } from "@/components/public/SiteHeader";

export const metadata: Metadata = {
  title: "關於本站",
  description: "國立臺灣大學社會學系與社會學研究所課程期末論文的發表平台。",
};

export default function AboutPage() {
  return (
    <div className="bg-background min-h-screen">
      <SiteHeader container="max-w-[640px] px-6" />
      <main id="main" className="mx-auto max-w-[640px] px-6 py-14">
        <Link
          href="/"
          className="text-muted hover:text-foreground mb-10 inline-flex items-center gap-1 text-sm transition-colors"
        >
          ← 返回首頁
        </Link>

        <article className="prose prose-research">
          <h1>關於本站</h1>
          <p>
            本站是國立臺灣大學社會學系與社會學研究所課程的期末論文發表平台，讓修課同學的研究成果能以正式、可被檢索與引用的形式對外呈現，也讓課程成員在正式發布前互相檢閱草稿。
          </p>

          <h2>誰在使用這個平台</h2>
          <p>
            修課同學登入後，可以在「工作區」維護個人檔案、撰寫與管理自己的期末論文；授課教師與助教則透過「後台管理」審閱與發布全班的文章。所有訪客都能瀏覽已發布的文章，並依主題、課程或學期篩選。
          </p>

          <h2>引用與著作權</h2>
          <p>
            文章著作權歸作者所有。每篇文章頁都提供引用格式，引用時請註明作者與出處。使用規範詳見
            <Link href="/tos">服務條款</Link>與<Link href="/privacy">隱私政策</Link>。
          </p>
        </article>
      </main>
      <Footer />
    </div>
  );
}
