import type { Metadata } from "next";
import "katex/dist/katex.min.css";
import "./globals.css";
import "./catalogue.css";
import { withBasePath } from "./lib/site-url";

export const metadata: Metadata = {
  icons: { icon: withBasePath("/favicon.svg") },
  title: "Paper Atlas · 论文精读库",
  description:
    "持续生长的中英双语论文精读库，包含阅读状态、原文翻译和结构化精读报告。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
