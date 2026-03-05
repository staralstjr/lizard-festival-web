import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ringo Cre | 파충류 행사 & 분양 리스트",
  description: "레드바이 & 트익할 화이트 스팟 전문 링고크레입니다. 전국 파충류 행사 일정과 실시간 분양 정보를 확인하세요.",
  icons: {
    icon: "/images/ringoCre.png",
    apple: "/images/ringoCre.png",
  },
  openGraph: {
    title: "Ringo Cre | 파충류 행사 & 분양 리스트",
    description: "전국 파충류 행사 일정과 실시간 분양 정보를 한눈에!",
    url: "https://lizard-festival-web.vercel.app",
    siteName: "Ringo Cre",
    images: [
      {
        url: "/images/ringoCre.png",
        width: 800,
        height: 600,
        alt: "Ringo Cre 로고",
      },
    ],
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ringo Cre | 파충류 행사 & 분양 리스트",
    description: "전국 파충류 행사 일정과 실시간 분양 정보",
    images: ["/images/ringoCre.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        {/* 💡 네이버 이미지 엑박 방지를 위한 핵심 설정입니다. */}
        <meta name="referrer" content="no-referrer" />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}