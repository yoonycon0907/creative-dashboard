import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Sans_KR } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const notoSansKr = Noto_Sans_KR({
  variable: "--font-noto-sans-kr",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Meta 광고 소재별 성과 대시보드",
  description: "Meta 광고 소재의 성과를 집계하여 한눈에 비교하세요",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} ${notoSansKr.variable} h-full antialiased`}
      style={{ fontFamily: "var(--font-noto-sans-kr)" }}
    >
      <body className="min-h-full flex flex-col" style={{ fontFamily: "var(--font-noto-sans-kr)" }}>{children}</body>
    </html>
  );
}
