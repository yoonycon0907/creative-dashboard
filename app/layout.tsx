import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Meta 광고 소재별 성과 대시보드",
  description: "Meta 광고 소재의 성과를 집계하여 한눈에 비교하세요",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
