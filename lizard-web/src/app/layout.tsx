import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "우리 동네 렙타일 | 파충류 샵·병원·행사",
  description: "현재 위치 기반 파충류 샵, 특수동물병원, 렙타일페어 등 행사 정보를 지도에서 확인하세요.",
  referrer: "no-referrer",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">{children}</body>
    </html>
  );
}
