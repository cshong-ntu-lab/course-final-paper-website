"use client";
// ```artifact blocks — a student-uploaded single-file HTML page shown as a
// sandboxed window that can go fullscreen. docs/html-artifact-embed.md §3.
//
// Security: the file is fetched and rendered via srcdoc in an iframe sandboxed
// WITHOUT allow-same-origin, so its scripts run in an opaque origin — no access
// to this site's cookies or DOM, and no top-level navigation.

import { Maximize2, Minimize2, X } from "lucide-react";
import * as React from "react";

import {
  type ArtifactRatio,
  isAllowedArtifactUrl,
  parseArtifactBlock,
} from "@/lib/markdown/artifactBlock";

const USE_EMULATOR = process.env.NEXT_PUBLIC_FIREBASE_USE_EMULATOR === "1";
// Must match the bucket in src/lib/firebase/client.ts.
const BUCKET = USE_EMULATOR
  ? "demo-emulator.appspot.com"
  : (process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "");

const SANDBOX =
  "allow-scripts allow-modals allow-popups allow-popups-to-escape-sandbox allow-forms allow-pointer-lock";

const RATIO_CSS: Record<ArtifactRatio, string> = {
  "16:9": "16 / 9",
  "4:3": "4 / 3",
  "1:1": "1 / 1",
  "9:16": "9 / 16",
};

// Opaque-origin documents throw SecurityError on localStorage/sessionStorage
// access. Swap in in-memory stand-ins so pages that use them keep working.
const STORAGE_SHIM = `<script>(function(){function M(){var d=Object.create(null);return{get length(){return Object.keys(d).length},key:function(i){var k=Object.keys(d)[i];return k===undefined?null:k},getItem:function(k){k=String(k);return k in d?d[k]:null},setItem:function(k,v){d[String(k)]=String(v)},removeItem:function(k){delete d[String(k)]},clear:function(){d=Object.create(null)}}}["localStorage","sessionStorage"].forEach(function(n){try{window[n].length}catch(e){try{Object.defineProperty(window,n,{value:M(),configurable:true})}catch(_){}}})})();</script>`;

function withShim(html: string): string {
  // Inject as early as possible, but never before <!DOCTYPE> (quirks mode).
  const anchor = /<head[^>]*>/i.exec(html) ?? /<!doctype[^>]*>/i.exec(html);
  if (!anchor) return STORAGE_SHIM + html;
  const at = anchor.index + anchor[0].length;
  return html.slice(0, at) + STORAGE_SHIM + html.slice(at);
}

// Fetched files, shared across every frame on the page (the editor preview
// re-renders on each keystroke).
const htmlCache = new Map<string, Promise<string>>();

function loadHtml(url: string): Promise<string> {
  let p = htmlCache.get(url);
  if (!p) {
    p = fetch(url).then((res) => {
      if (!res.ok) throw new Error(`http_${res.status}`);
      return res.text();
    });
    p.catch(() => htmlCache.delete(url));
    htmlCache.set(url, p);
  }
  return p;
}

type WebkitElement = HTMLElement & { webkitRequestFullscreen?: () => void };
type WebkitDocument = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => void;
};

function fullscreenElement(): Element | null {
  const d = document as WebkitDocument;
  return d.fullscreenElement ?? d.webkitFullscreenElement ?? null;
}

function useIsDesktop(): boolean | null {
  const [desktop, setDesktop] = React.useState<boolean | null>(null);
  React.useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const sync = () => setDesktop(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return desktop;
}

type Phase = "idle" | "loading" | "ready" | "error";

export function ArtifactFrame({ body }: { body: string }) {
  const block = React.useMemo(() => parseArtifactBlock(body), [body]);
  const allowed = block !== null && isAllowedArtifactUrl(block.url, BUCKET);
  const url = allowed ? block.url : null;

  const wrapperRef = React.useRef<HTMLDivElement>(null);
  const isDesktop = useIsDesktop();
  // Keyed by URL so a different file in the same position (editor edits)
  // starts over from "idle".
  const [loaded, setLoaded] = React.useState<{
    url: string;
    phase: Phase;
    srcDoc: string | null;
  } | null>(null);
  const phase: Phase = loaded && loaded.url === url ? loaded.phase : "idle";
  const srcDoc = loaded && loaded.url === url ? loaded.srcDoc : null;
  // "native" = Fullscreen API; "overlay" = CSS fallback (iPhone Safari).
  const [full, setFull] = React.useState<"native" | "overlay" | null>(null);

  const load = React.useCallback(() => {
    if (!url) return;
    setLoaded({ url, phase: "loading", srcDoc: null });
    loadHtml(url).then(
      (html) => setLoaded({ url, phase: "ready", srcDoc: withShim(html) }),
      () => setLoaded({ url, phase: "error", srcDoc: null }),
    );
  }, [url]);

  // Desktop: load once the window comes within 200px of the viewport.
  React.useEffect(() => {
    if (!isDesktop || phase !== "idle" || !url) return;
    const el = wrapperRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect();
          load();
        }
      },
      { rootMargin: "200px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [isDesktop, phase, url, load]);

  const enterFullscreen = React.useCallback(() => {
    const el = wrapperRef.current as WebkitElement | null;
    if (!el) return;
    const request = el.requestFullscreen?.bind(el) ?? el.webkitRequestFullscreen?.bind(el);
    if (!request) {
      setFull("overlay");
      return;
    }
    try {
      const res = request() as Promise<void> | undefined;
      setFull("native");
      res?.catch(() => setFull("overlay"));
    } catch {
      setFull("overlay");
    }
  }, []);

  const exitFullscreen = React.useCallback(() => {
    if (fullscreenElement()) {
      const d = document as WebkitDocument;
      if (d.exitFullscreen) void d.exitFullscreen();
      else d.webkitExitFullscreen?.();
    }
    setFull(null);
  }, []);

  // Keep state in sync when the user leaves native fullscreen with Esc.
  React.useEffect(() => {
    if (full !== "native") return;
    const onChange = () => {
      if (fullscreenElement() !== wrapperRef.current) setFull(null);
    };
    document.addEventListener("fullscreenchange", onChange);
    document.addEventListener("webkitfullscreenchange", onChange);
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      document.removeEventListener("webkitfullscreenchange", onChange);
    };
  }, [full]);

  // Overlay: lock page scroll, close on Esc.
  React.useEffect(() => {
    if (full !== "overlay") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFull(null);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [full]);

  if (!block || !allowed) {
    return (
      <div className="embed embed-artifact not-prose">
        <p className="embed-artifact-message">
          無法顯示這個互動網頁：網址不是本站上傳的 HTML 檔。請把檔案拖進編輯器重新上傳。
        </p>
      </div>
    );
  }

  const openMobile = () => {
    enterFullscreen();
    if (phase === "idle" || phase === "error") load();
  };

  const showFrame = full !== null || isDesktop === true;
  // Mobile, not fullscreen: a tap-to-open card instead of a cramped window.
  if (isDesktop === false && full === null) {
    return (
      <div ref={wrapperRef} className="embed embed-artifact not-prose">
        <button type="button" onClick={openMobile} className="embed-artifact-card">
          <span className="embed-artifact-kicker">互動網頁</span>
          <span className="embed-artifact-card-title">{block.title}</span>
          <span className="embed-artifact-hint">
            <Maximize2 className="h-3.5 w-3.5" aria-hidden /> 點擊以全螢幕開啟
          </span>
        </button>
      </div>
    );
  }

  return (
    <div
      ref={wrapperRef}
      className="embed embed-artifact not-prose"
      data-full={full ?? undefined}
      data-ratio={block.ratio}
      role={full === "overlay" ? "dialog" : undefined}
      aria-modal={full === "overlay" ? true : undefined}
      aria-label={full === "overlay" ? block.title : undefined}
    >
      <div className="embed-artifact-bar">
        <span className="embed-artifact-title">{block.title}</span>
        {full ? (
          <button type="button" onClick={exitFullscreen} className="embed-artifact-btn">
            {full === "overlay" ? (
              <>
                <X className="h-3.5 w-3.5" aria-hidden /> 關閉
              </>
            ) : (
              <>
                <Minimize2 className="h-3.5 w-3.5" aria-hidden /> 結束全螢幕
              </>
            )}
          </button>
        ) : (
          <button type="button" onClick={enterFullscreen} className="embed-artifact-btn">
            <Maximize2 className="h-3.5 w-3.5" aria-hidden /> 全螢幕
          </button>
        )}
      </div>
      <div className="embed-artifact-viewport" style={{ aspectRatio: RATIO_CSS[block.ratio] }}>
        {showFrame && phase === "ready" && srcDoc !== null ? (
          <iframe
            srcDoc={srcDoc}
            title={block.title}
            sandbox={SANDBOX}
            allow="fullscreen; autoplay"
            referrerPolicy="no-referrer"
          />
        ) : phase === "error" ? (
          <div className="embed-artifact-message">
            <p>無法載入互動網頁。</p>
            <button type="button" onClick={load} className="embed-artifact-btn">
              重試
            </button>
          </div>
        ) : (
          <p className="embed-artifact-message">載入中…</p>
        )}
      </div>
    </div>
  );
}
