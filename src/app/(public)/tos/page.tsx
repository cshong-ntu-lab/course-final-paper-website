import type { Metadata } from "next";
import Link from "next/link";

import { Footer } from "@/components/Footer";

export const metadata: Metadata = { title: "服務條款" };

export default function TosPage() {
  return (
    <div className="bg-background min-h-screen">
      <main id="main" className="mx-auto max-w-[640px] px-6 py-14">
        <Link
          href="/"
          className="text-muted hover:text-foreground mb-10 inline-flex items-center gap-1 text-sm transition-colors"
        >
          ← 返回首頁
        </Link>

        <article className="prose prose-research font-serif">
          <h1>服務條款</h1>
          <p className="not-prose text-muted mt-1 mb-8 text-sm">最後更新：2026 年</p>

          <h2>服務說明</h2>
          <p>
            本平台（以下簡稱「本服務」）為國立臺灣大學社會學研究所研究生提供期末報告撰寫與發布之平台。本服務由課程授課教師管理，僅供已加入課程之學生使用。
          </p>

          <h2>使用者責任</h2>
          <p>
            使用者應確保其提交之報告內容為本人原創，並遵守學術誠信規範。使用者不得上傳違法、侵權或含有惡意程式碼之內容。
          </p>

          <h2>內容所有權</h2>
          <p>
            報告內容之著作權歸作者所有。使用者授權本平台展示、儲存及備份其內容，以提供本服務所述之功能。
          </p>

          <h2>已發布內容</h2>
          <p>
            經管理員發布之報告將以公開網頁形式呈現，並可能被搜尋引擎索引。使用者理解，已發布內容在網路上的快取版本可能在下架後仍短暫存在。
          </p>

          <h2>服務中斷與終止</h2>
          <p>
            本服務不保證永久可用。管理員保留在任何時候終止、修改或暫停服務的權利，並將盡合理努力事先通知使用者。
          </p>

          <h2>免責聲明</h2>
          <p>
            本服務按「現狀」提供，不提供任何明示或默示之保證。對於使用本服務所產生之直接或間接損失，本平台不承擔責任。
          </p>

          <h2>聯絡方式</h2>
          <p>如對本服務條款有任何疑問，請透過課程管理員聯繫。</p>
        </article>
      </main>
      <Footer />
    </div>
  );
}
