"use client";
// First-visit walkthrough of the report editor: Markdown basics, images,
// YouTube, HTML pages, and the sidebar. Each step spotlights the part of the
// editor it talks about (elements carrying data-tour="…"); a step whose target
// is hidden (narrow screens) is shown centred instead.

import Link from "next/link";
import * as React from "react";

import { Info } from "lucide-react";

import { Button } from "@/components/ui/button";
import { MarkdownRenderer } from "@/lib/markdown/Renderer";
import { cn } from "@/lib/utils";

const T = "```";

const CARD_WIDTH = 380;
const MARGIN = 16;
const PAD = 6; // spotlight padding around the target

const PLAYGROUND_START = `## 研究動機

這是一段**粗體**和*斜體*的文字。

- 第一點
- 第二點

> 引用一段受訪者的話

[台大社會系](https://www.sociology.ntu.edu.tw)`;

function Code({ children }: { children: string }) {
  return (
    <pre className="bg-canvas border-border text-foreground m-0 mt-2 overflow-x-auto rounded border px-2.5 py-2 font-mono text-[11.5px] leading-relaxed whitespace-pre-wrap break-all">
      {children}
    </pre>
  );
}

function Playground() {
  const [md, setMd] = React.useState(PLAYGROUND_START);
  return (
    <div className="mt-3 grid gap-2">
      <textarea
        value={md}
        onChange={(e) => setMd(e.target.value)}
        rows={7}
        aria-label="Markdown 練習區"
        spellCheck={false}
        className="border-border-strong bg-surface focus-visible:border-accent focus-visible:ring-accent-soft w-full resize-none rounded border px-2.5 py-2 font-mono text-[12px] leading-relaxed focus-visible:ring-2 focus-visible:outline-none"
      />
      <div className="border-border bg-background max-h-40 overflow-y-auto rounded border px-3 py-1 text-[13px] [&_article]:text-[13px] [&_h2]:mt-2 [&_h2]:text-base">
        <MarkdownRenderer content={md} />
      </div>
    </div>
  );
}

interface Step {
  /** data-tour value of the element to spotlight; none → centred */
  target?: string;
  title: string;
  body: React.ReactNode;
}

const STEPS: Step[] = [
  {
    title: "歡迎使用報告編輯器",
    body: (
      <>
        <p className="m-0">接下來約一分鐘，帶你認識：</p>
        <ol className="m-0 mt-2 list-decimal space-y-0.5 pl-5">
          <li>Markdown 基本格式</li>
          <li>插入照片與網頁</li>
          <li>嵌入 YouTube 影片</li>
          <li>調整互動網頁視窗</li>
          <li>右側欄位的用途</li>
        </ol>
        <p className="text-subtle m-0 mt-2">不需要的話可以直接按「略過教學」。</p>
      </>
    ),
  },
  {
    target: "source",
    title: "在左邊用 Markdown 寫作",
    body: (
      <>
        <p className="m-0">
          Markdown 用簡單的符號標記格式：<code>##</code> 是標題、<code>**文字**</code> 是粗體、
          <code>-</code> 開頭是清單、<code>&gt;</code> 是引用、<code>[文字](網址)</code> 是連結。
        </p>
        <p className="m-0 mt-2">在下面的練習區改改看，結果會即時顯示：</p>
        <Playground />
      </>
    ),
  },
  {
    target: "preview",
    title: "右邊是即時預覽",
    body: (
      <p className="m-0">
        這裡就是讀者看到的樣子。上方的 Write / Both / Preview 可以切換版面。內容每 30
        秒自動儲存，也可以按 Ctrl+S（Mac 為 ⌘S）立即儲存。
      </p>
    ),
  },
  {
    target: "files",
    title: "插入照片與網頁",
    body: (
      <>
        <p className="m-0">
          照片（JPG、PNG、WebP）和互動網頁（單一 .html 檔，例如互動圖表、小遊戲）的插入方式相同：
        </p>
        <ul className="m-0 mt-1 list-disc space-y-0.5 pl-5">
          <li>把檔案直接拖進左邊原始碼區要放的位置</li>
          <li>在這裡「上傳」後，滑到檔案上按「插入」，會放在游標所在處</li>
          <li>照片也可以複製後，在原始碼區按 Ctrl+V 貼上</li>
        </ul>
        <p className="m-0 mt-2">照片會插入這樣一行，引號裡的文字會成為圖說：</p>
        <Code>{`![替代文字](圖片網址 "圖 1：圖說文字")`}</Code>
        <p className="m-0 mt-2">
          網頁會插入一段 artifact 語法，讀者看到的是可以放大成全螢幕的視窗。
        </p>
      </>
    ),
  },
  {
    target: "source",
    title: "嵌入 YouTube 影片",
    body: (
      <>
        <p className="m-0">
          把 YouTube 網址<strong>單獨貼在一行</strong>
          ，前後不要有其他文字，預覽就會變成影片播放器：
        </p>
        <Code>{`上一段文字……

https://www.youtube.com/watch?v=OaTKaHKCAFg

下一段文字……`}</Code>
      </>
    ),
  },
  {
    target: "source",
    title: "調整互動網頁視窗",
    body: (
      <>
        <p className="m-0">插入網頁後，原始碼裡會出現這一段。可以直接改裡面的設定：</p>
        <Code>{`${T}artifact
https://…/page.html
title: 我的互動網頁
ratio: 16:9
${T}`}</Code>
        <ul className="m-0 mt-2 list-disc space-y-0.5 pl-5">
          <li>
            <code>title</code>：視窗上方顯示的名稱，預設取自網頁的標題
          </li>
          <li>
            <code>ratio</code>：視窗比例，可填 16:9、4:3、1:1 或 9:16
          </li>
        </ul>
        <p className="text-subtle m-0 mt-2">
          HTML 裡引用的本機圖片不會跟著上傳，請改成網址或直接嵌進檔案。
        </p>
      </>
    ),
  },
  {
    target: "meta",
    title: "填寫文章資訊",
    body: (
      <>
        <p className="m-0">
          右側是標題、作者、摘要、關鍵字、封面圖等設定。每個欄位旁的
          <Info className="mx-0.5 inline h-3.5 w-3.5 align-[-2px]" aria-label="說明圖示" />
          滑過去就能看到用法。
        </p>
        <p className="m-0 mt-2">寫完後，勾選最上方的「準備好了，請求教師審核」。</p>
      </>
    ),
  },
  {
    target: "help",
    title: "想學更多寫法？",
    body: (
      <>
        <p className="m-0">
          表格、數學式、腳注、程式碼與 Observable 互動圖表的完整寫法和範例，都在
          <Link
            href="/workspace#markdown-cheatsheet"
            target="_blank"
            className="text-accent mx-0.5 underline underline-offset-[3px]"
          >
            「我的工作區」的語法教學
          </Link>
          。
        </p>
        <p className="m-0 mt-2">之後想再看一次這個導覽，點上方的「教學」即可。</p>
      </>
    ),
  },
];

type Rect = { top: number; left: number; width: number; height: number };

function targetRect(target: string | undefined): Rect | null {
  if (!target) return null;
  const el = document.querySelector(`[data-tour="${target}"]`);
  const r = el?.getBoundingClientRect();
  if (!r || r.width === 0 || r.height === 0) return null;
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

/** Beside the target where there's room (right, left, below, above), else centred. */
function cardPosition(rect: Rect | null, cardHeight: number): React.CSSProperties {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const width = Math.min(CARD_WIDTH, vw - MARGIN * 2);
  const centred = { left: (vw - width) / 2, top: Math.max(MARGIN, (vh - cardHeight) / 2), width };
  if (!rect) return centred;
  const clampTop = (t: number) => Math.min(Math.max(MARGIN, t), vh - cardHeight - MARGIN);
  const clampLeft = (l: number) => Math.min(Math.max(MARGIN, l), vw - width - MARGIN);
  if (rect.left + rect.width + PAD + MARGIN + width <= vw - MARGIN) {
    return { left: rect.left + rect.width + PAD + MARGIN, top: clampTop(rect.top), width };
  }
  if (rect.left - PAD - MARGIN - width >= MARGIN) {
    return { left: rect.left - PAD - MARGIN - width, top: clampTop(rect.top), width };
  }
  if (rect.top + rect.height + PAD + MARGIN + cardHeight <= vh - MARGIN) {
    return { left: clampLeft(rect.left), top: rect.top + rect.height + PAD + MARGIN, width };
  }
  if (rect.top - PAD - MARGIN - cardHeight >= MARGIN) {
    return { left: clampLeft(rect.left), top: rect.top - PAD - MARGIN - cardHeight, width };
  }
  return centred;
}

export function EditorTour({ onClose }: { onClose: () => void }) {
  const [index, setIndex] = React.useState(0);
  const [rect, setRect] = React.useState<Rect | null>(null);
  const [cardHeight, setCardHeight] = React.useState(0);
  const cardRef = React.useRef<HTMLDivElement>(null);
  const step = STEPS[index]!;
  const last = index === STEPS.length - 1;

  // follow the target through resizes and the editor's own layout changes
  React.useEffect(() => {
    let frame = 0;
    const measure = () => {
      const next = targetRect(step.target);
      setRect((prev) =>
        prev && next && (Object.keys(next) as (keyof Rect)[]).every((k) => prev[k] === next[k])
          ? prev
          : next,
      );
      if (cardRef.current) setCardHeight(cardRef.current.offsetHeight);
      frame = requestAnimationFrame(measure);
    };
    measure();
    return () => cancelAnimationFrame(frame);
  }, [step.target]);

  React.useEffect(() => {
    cardRef.current?.focus();
  }, [index]);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[70]" role="presentation">
      {rect ? (
        <div
          aria-hidden="true"
          className="ring-accent pointer-events-none fixed rounded-md ring-2 transition-all duration-200"
          style={{
            top: rect.top - PAD,
            left: rect.left - PAD,
            width: rect.width + PAD * 2,
            height: rect.height + PAD * 2,
            boxShadow: "0 0 0 9999px rgba(28, 29, 26, 0.5)",
          }}
        />
      ) : (
        <div aria-hidden="true" className="fixed inset-0 bg-[rgba(28,29,26,0.5)]" />
      )}

      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="editor-tour-title"
        tabIndex={-1}
        style={cardPosition(rect, cardHeight)}
        className={cn(
          "border-border bg-surface fixed flex max-h-[calc(100vh-32px)] flex-col overflow-y-auto rounded-lg border p-5 text-sm leading-relaxed shadow-[var(--shadow-hover)] outline-none",
          // invisible for the first frame, until its height is known
          cardHeight === 0 && "opacity-0",
        )}
      >
        <div className="text-subtle mb-1 font-mono text-2xs tracking-[0.08em]">
          {index + 1} / {STEPS.length}
        </div>
        <h2 id="editor-tour-title" className="m-0 mb-2 font-serif text-lg font-semibold">
          {step.title}
        </h2>
        <div className="text-muted [&_code]:bg-canvas [&_code]:rounded [&_code]:px-1 [&_code]:font-mono [&_code]:text-[12px]">
          {step.body}
        </div>

        <div className="mt-5 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="text-subtle hover:text-foreground text-xs underline-offset-4 hover:underline"
          >
            {last ? "關閉" : "略過教學"}
          </button>
          <div className="flex items-center gap-2">
            {index > 0 && (
              <Button variant="ghost" size="sm" onClick={() => setIndex((i) => i - 1)}>
                上一步
              </Button>
            )}
            <Button size="sm" onClick={() => (last ? onClose() : setIndex((i) => i + 1))}>
              {last ? "開始寫作" : "下一步"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
