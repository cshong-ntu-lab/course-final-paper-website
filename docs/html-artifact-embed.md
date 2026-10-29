# 互動網頁嵌入（HTML artifact）— 規格

> **用途**：讓學生把課堂作業產出的單一 HTML 檔（互動網頁、小遊戲、資料視覺化）拖進編輯頁，嵌在文章指定位置，以視窗呈現，可放大為全螢幕。
> **狀態**：設計定案（2026-10-29），實作於 `feat/html-artifact-embed`。
> **參考檔**：`議題倡議互動網頁_社會三B13305026吳昀寰-1.html`（ntusoc-prototype 資料夾）。

---

## 0. 參考檔的特性

- 單一檔案約 550KB，CSS / JS 全部內嵌；外部只引用 GSAP（cdnjs）與 Google Fonts。
- 以整個瀏覽器視窗為畫布：`html, body { overflow: hidden }`、主舞台 `100vh`。**不會自己長高**，所以嵌入時必須給固定比例的視窗，不能像 Observable 區塊那樣量高度。
- 點擊互動多；沒有用到 `localStorage`、`alert`，但其他學生的檔案可能會用到（§3.2 處理）。

## 1. Markdown 語法

````
```artifact
https://firebasestorage.googleapis.com/v0/b/<bucket>/o/reports%2F...html?alt=media&token=...
title: 勝者為王，敗者為寇
ratio: 16:9
```
````

- 第一個非空行是網址（必填）。其餘為 `key: value`，未知的 key 忽略。
- `title`：選填，顯示在視窗標題列；預設為「互動網頁」。
- `ratio`：`16:9`（預設）、`4:3`、`1:1`、`9:16`。其他值退回 `16:9`。
- 選 fenced code block 而非「單獨一行網址」：可以帶 title / ratio，且 Storage 網址本身看不出是 HTML；也不需動 sanitize schema（沿用 `language-observable` 的攔截方式）。
- **網址白名單**：只接受本站 bucket 下 `reports/` 路徑、副檔名 `.html` 的下載網址（雲端 `firebasestorage.googleapis.com`，模擬器 `127.0.0.1:9199` / `localhost:9199`）。不符合時渲染錯誤提示框，不載入任何東西。

純函式在 `src/lib/markdown/artifactBlock.ts`：`parseArtifactBlock`、`artifactMarkdown`、`isAllowedArtifactUrl`、`findRelativeAssetRefs`、`extractHtmlTitle`，附測試。

## 2. 編輯頁流程

1. 把 `.html` 拖到原始碼區 → 沿用圖片的插入線，標出落點。
2. 放下時先在瀏覽器端檢查：
   - 副檔名 `.html` / `.htm`（拖曳時 `file.type` 可能是空字串，以副檔名為準，上傳時一律標 `text/html`）。
   - 大小 ≤ 10MB（同 `UPLOAD_MAX_BYTES`）。
   - 抓 `<title>` 當預設 title。
   - 掃描 `src` / `href` / CSS `url()` 的**相對路徑**（非 `http(s):`、`data:`、`blob:`、`#`、`mailto:`、`javascript:`）。有的話上傳完跳提醒：「這個檔案引用了 N 個本機檔案（例如 images/a.png），它們不會跟著上傳，嵌入後會顯示不出來。請把圖片改成網址或直接嵌進 HTML。」——只提醒，不阻擋。
3. 上傳（同現有流程：Web SDK → `reports/{reportId}/{uid}/{uploadId}_{name}` → `/api/uploads/finalize`），完成後在落點插入 §1 的區塊。
4. 右側預覽即時顯示視窗，可直接試玩、試全螢幕。
5. 資源欄「檔案資源」：HTML 檔顯示專屬圖示與「插入」按鈕；檔案輸入框的 `accept` 加 `.html`。
6. 刪除檔案時，內文裡引用該網址的 `artifact` 區塊一起清掉（同圖片行為）。
7. Markdown 速查表加一段說明。

## 3. 呈現（`src/lib/markdown/ArtifactFrame.tsx`）

### 3.1 版面

- 外框沿用 `.embed` 樣式（邊框、圓角、`canvas` 底），新增 `.embed-artifact`。
- 上方標題列：左側 title（`text-sm`，單行截斷），右側「全螢幕」按鈕（lucide `Maximize2` 圖示 + 文字）。
- 下方視窗依 `ratio` 設 `aspect-ratio`；`9:16` 限制最大高度 `80vh` 並置中。
- **桌機（≥ 768px）**：進入視窗 200px 範圍內才抓檔並建立 iframe（IntersectionObserver），之後不卸載。載入中顯示「載入中…」。
- **手機（< 768px）**：不在文中執行，只顯示卡片：「互動網頁 · {title}」＋「點擊以全螢幕開啟」，點了才抓檔，直接進入全螢幕。
- 載入失敗：「無法載入互動網頁」＋重試按鈕。

### 3.2 安全性

學生的 HTML 等於任意 JavaScript，**不能在本站網域執行**（會讀到 session cookie）。

- 先 `fetch` 檔案內容，放進 `<iframe srcdoc>`，`sandbox="allow-scripts allow-modals allow-popups allow-popups-to-escape-sandbox allow-forms allow-pointer-lock"`，**不加 `allow-same-origin`** → opaque origin，拿不到 cookie、碰不到外層 DOM；不加 `allow-top-navigation` → 不能把整頁導走。
- 不用 `iframe src=<Storage 網址>`：Storage 物件設為下載（見下），直接當 src 會變成下載而不是顯示。
- 在 srcdoc 的 `<head>` 最前面注入相容性補丁：沙盒內存取 `localStorage` / `sessionStorage` 會丟 `SecurityError`，以記憶體版替身取代，避免作品直接壞掉。
- `allow="fullscreen; autoplay"`：讓作品內的影片可播放。
- **Storage**：HTML 上傳時設定 `contentDisposition: attachment`。有人直接打開 Storage 網址時只會下載，不會在瀏覽器渲染，避免被拿去做釣魚頁。`storage.rules` 強制此條件。

### 3.3 全螢幕

- 對外框（含標題列）呼叫 `requestFullscreen()`；按鈕切換成「結束全螢幕」，Esc 也可退出（監聽 `fullscreenchange` 同步狀態）。
- 不支援的瀏覽器（iPhone Safari）退回 CSS 覆蓋層：`position: fixed; inset: 0; z-index: 60`，鎖住 body 捲動，Esc 或「關閉」按鈕退出。
- 全螢幕時視窗不再套 `aspect-ratio`，填滿標題列以下的空間。

## 4. 後端改動

| 檔案                                    | 改動                                                                                                             |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `storage.rules`                         | `reports/**` 允許 `text/html`，且必須 `contentDisposition` 以 `attachment` 開頭；大小限制不變（10MB）            |
| `src/app/api/uploads/finalize/route.ts` | `contentType` 白名單加 `text/html`                                                                               |
| `src/lib/client/useImageUpload.ts`      | `ALLOWED_CTYPES` 加 `text/html`；`.html` 檔若 `type` 為空補成 `text/html`；上傳 metadata 帶 `contentDisposition` |

不新增 Firestore 欄位；HTML 跟其他上傳一樣記錄在 `reports/{id}/uploads/{uploadId}`。發布快照只存 Markdown，網址不變。

## 5. 部署注意

- `storage.rules` 由 CI 自動部署（`cloudbuild.yaml` / `cloudbuild-test.yaml` 的 `firebase deploy --only firestore:indexes,storage`），不需手動。
- 前端以 `fetch` 讀 Storage，需要 bucket 已套用 repo 根目錄的 `cors.json`（GET、任意 origin）。若預覽出現 CORS 錯誤：`gcloud storage buckets update gs://<bucket> --cors-file=cors.json`。

## 6. 不做

- 多檔案作品（HTML + 資料夾）、zip 上傳。
- 作品之間或與外層頁面的通訊。
- 自動擷取縮圖當手機卡片封面。
