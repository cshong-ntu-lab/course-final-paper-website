import { Inter, JetBrains_Mono, Noto_Sans_TC, Noto_Serif_TC } from "next/font/google";

export const fontSans = Inter({
  subsets: ["latin"],
  variable: "--font-sans-en",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const fontSansTC = Noto_Sans_TC({
  subsets: ["latin"],
  variable: "--font-sans-tc",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const fontSerifTC = Noto_Serif_TC({
  subsets: ["latin"],
  variable: "--font-serif-tc",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono-token",
  weight: ["400", "500", "600"],
  display: "swap",
});

export const fontVariables = [
  fontSans.variable,
  fontSansTC.variable,
  fontSerifTC.variable,
  fontMono.variable,
].join(" ");
