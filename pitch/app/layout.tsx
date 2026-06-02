import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Career War Room · Pitch Deck",
  description: "应届生求职作战部 — 5 分钟路演 PPT",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="h-screen w-screen overflow-hidden font-serif">{children}</body>
    </html>
  );
}
