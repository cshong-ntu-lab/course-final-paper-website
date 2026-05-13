// design.md §3.9 — pass to <ReactDiffViewer styles={...} />
// Use a plain object to avoid CSS-in-JS type conflicts with react-diff-viewer-continued.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const diffViewerStyles: any = {
  variables: {
    light: {
      diffViewerBackground: "hsl(var(--surface))",
      diffViewerColor: "hsl(var(--foreground))",
      addedBackground: "#eef5ec",
      addedColor: "hsl(var(--success-fg))",
      removedBackground: "#fbeeec",
      removedColor: "hsl(var(--destructive-fg))",
      wordAddedBackground: "#c9e0c2",
      wordRemovedBackground: "#f5cdc6",
      addedGutterBackground: "#dfeede",
      removedGutterBackground: "#f4ddd8",
      gutterBackground: "hsl(var(--canvas))",
      gutterBackgroundDark: "hsl(var(--canvas))",
      gutterColor: "hsl(var(--subtle))",
      codeFoldGutterBackground: "hsl(var(--canvas))",
      codeFoldBackground: "hsl(var(--canvas))",
      emptyLineBackground: "hsl(var(--background))",
    },
  },
  contentText: { fontFamily: "var(--font-mono)", fontSize: "12.5px", lineHeight: "1.65" },
  gutter: { padding: "3px 8px" },
};
