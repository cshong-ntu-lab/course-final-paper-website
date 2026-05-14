import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "台大社會系";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    <div
      style={{
        background: "#f5f2ec",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "serif",
      }}
    >
      <div
        style={{
          color: "#3a5a3a",
          fontSize: 24,
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          marginBottom: 28,
          fontFamily: "monospace",
        }}
      >
        NTU 社會學研究所
      </div>
      <div
        style={{
          color: "#1a1a1a",
          fontSize: 64,
          fontWeight: 700,
          letterSpacing: "-0.02em",
          lineHeight: 1.15,
        }}
      >
        台大社會系
      </div>
      <div
        style={{
          color: "#666",
          fontSize: 22,
          marginTop: 24,
          letterSpacing: "0.02em",
        }}
      >
        期末報告發表平台
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 40,
          right: 60,
          width: 48,
          height: 48,
          background: "#3a5a3a",
          borderRadius: 8,
        }}
      />
    </div>,
    { ...size },
  );
}
