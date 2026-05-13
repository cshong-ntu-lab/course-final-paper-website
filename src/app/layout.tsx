import type { Metadata } from "next";
import { Toaster } from "sonner";

import { fontVariables } from "@/lib/fonts";

import "./globals.css";
import "katex/dist/katex.min.css";
import "highlight.js/styles/github.css";

export const metadata: Metadata = {
  title: {
    default: "課程報告 · 台大社會所",
    template: "%s · 課程報告",
  },
  description: "台大社會所研究所課程的期末報告平台",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant" className={`${fontVariables} h-full antialiased`}>
      <body className="bg-background text-foreground min-h-full font-sans">
        <a href="#main" className="skip-link">
          跳至主要內容
        </a>
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            classNames: {
              toast:
                "bg-surface border border-border rounded-md shadow-lg text-foreground font-sans",
              title: "font-medium text-sm",
              description: "text-xs text-muted",
              success: "border-success/30",
              error: "border-destructive/40",
              info: "border-info/40",
            },
          }}
        />
      </body>
    </html>
  );
}
