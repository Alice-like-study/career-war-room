import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "应届生求职作战部 · Career War Room",
  description:
    "7 位 AI 军师协作的求职助手，基于 EasyClaw。30 分钟生成你的《校招作战地图》。",
  keywords: ["应届生", "校招", "求职", "AI Agent", "EasyClaw", "作战部"],
  openGraph: {
    title: "应届生求职作战部 · Career War Room",
    description:
      "7 位 AI 军师，30 分钟生成你的《校招作战地图》。基于 EasyClaw 平台。",
    type: "website",
    locale: "zh_CN",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen font-serif">{children}</body>
    </html>
  );
}
