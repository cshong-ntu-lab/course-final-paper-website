"use client";

import * as React from "react";

interface ObservableSandboxProps {
  code: string;
}

// Escape </script> occurrences in student code so they don't prematurely close
// the script tag in the srcDoc HTML template.
function escapeScriptTag(s: string): string {
  return s.replace(/<\/script>/gi, "<\\/script>");
}

function buildSrcDoc(code: string, uid: string): string {
  const escaped = escapeScriptTag(code);
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { box-sizing: border-box; margin: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      font-size: 14px;
      background: transparent;
      padding: 0;
    }
    #root { width: 100%; }
    .obs-error {
      background: #fef2f2;
      border: 1px solid #fca5a5;
      border-radius: 6px;
      padding: 12px 14px;
      color: #991b1b;
      font-family: monospace;
      font-size: 12px;
      white-space: pre-wrap;
      word-break: break-word;
    }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="module">
    import * as Plot from "https://cdn.jsdelivr.net/npm/@observablehq/plot@0.6/+esm";
    import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

    const FRAME_ID = ${JSON.stringify(uid)};
    const root = document.getElementById("root");

    function reportHeight() {
      parent.postMessage({ type: "obs-resize", id: FRAME_ID, height: document.body.scrollHeight }, "*");
    }

    try {
      const result = await (async function() {
        ${escaped}
      })();

      if (result instanceof Element || result instanceof SVGElement) {
        root.appendChild(result);
      } else if (result != null) {
        root.textContent = String(result);
      }
    } catch (err) {
      const div = document.createElement("div");
      div.className = "obs-error";
      div.textContent = "Error: " + (err instanceof Error ? err.message : String(err));
      root.appendChild(div);
    }

    // Report initial height then watch for changes (e.g. async data loading).
    reportHeight();
    const ro = new ResizeObserver(reportHeight);
    ro.observe(document.body);
  </script>
</body>
</html>`;
}

export function ObservableSandbox({ code }: ObservableSandboxProps) {
  const uid = React.useId();
  const [height, setHeight] = React.useState(360);
  const srcDoc = React.useMemo(() => buildSrcDoc(code, uid), [code, uid]);

  React.useEffect(() => {
    function handler(e: MessageEvent) {
      if (
        e.data &&
        typeof e.data === "object" &&
        e.data.type === "obs-resize" &&
        e.data.id === uid &&
        typeof e.data.height === "number" &&
        e.data.height > 0
      ) {
        setHeight(e.data.height);
      }
    }
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [uid]);

  return (
    <iframe
      srcDoc={srcDoc}
      title="Interactive visualization"
      sandbox="allow-scripts"
      style={{ height }}
      className="border-border my-6 w-full rounded border bg-white"
    />
  );
}
