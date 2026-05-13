import type { Metadata } from "next";
import Link from "next/link";

import { Footer } from "@/components/Footer";

export const metadata: Metadata = { title: "隱私權政策" };

export default function PrivacyPage() {
  return (
    <div className="bg-background min-h-screen">
      <div className="mx-auto max-w-[640px] px-6 py-14">
        <Link
          href="/"
          className="text-muted hover:text-foreground mb-10 inline-flex items-center gap-1 text-sm transition-colors"
        >
          ← 返回首頁
        </Link>

        <article className="prose prose-research font-serif">
          <h1>隱私權政策</h1>
          <p className="not-prose text-muted mt-1 mb-8 text-sm">最後更新：2026 年</p>

          <h2>我們收集的資料</h2>
          <p>
            本平台透過 Google OAuth 取得您的 Email 地址與 Google
            顯示名稱，用於識別身份及管理課程成員資格。除此之外，您在報告中自行填寫的公開作者名稱、報告內容及上傳圖片亦會儲存於本平台。
          </p>

          <h2>資料的用途</h2>
          <p>
            收集的資料僅用於提供本平台服務，包括：課程成員管理、報告撰寫與發布、以及學術成果的公開展示。我們不會將您的個人資料出售或提供給第三方。
          </p>

          <h2>公開內容</h2>
          <p>
            已發布的報告（包括標題、作者名稱、摘要與內容）將以網頁形式公開，並可能被搜尋引擎索引。公開頁面不會顯示您的
            Google 帳號名稱或 Email。
          </p>

          <h2>資料保存</h2>
          <p>您的資料將保存至您或課程管理員要求刪除為止。本平台每日進行資料備份。</p>

          <h2>帳號刪除</h2>
          <p>
            本平台目前不提供自助刪除帳號功能。若您需要刪除帳號，請聯繫課程管理員。刪除後，您的已發布報告及上傳圖片將一併移除。
          </p>

          <h2>聯絡方式</h2>
          <p>如對本隱私權政策有任何疑問，請透過課程管理員聯繫。</p>
        </article>
      </div>
      <Footer />
    </div>
  );
}
