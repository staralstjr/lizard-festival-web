import type { Metadata } from "next";

/**
 * 💡 메타데이터 설정
 * metadataBase 경고를 해결하고 소셜 공유 시 최적화된 정보를 제공합니다.
 */
export const metadata: Metadata = {
  // NEXT_PUBLIC_API_URL이 없을 경우 로컬 호스트를 기본값으로 사용합니다.
  metadataBase: new URL(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'),
  title: "Ringo Cre | 파충류 행사 & 분양 리스트",
  description: "레드바이 & 트익할 화이트 스팟 전문 링고크레",
  icons: {
    icon: "/images/ringoCre.png",
  },
  openGraph: {
    title: "Ringo Cre",
    description: "전국 파충류 행사 일정 모아보기",
    images: ["/images/ringoCre.png"],
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        {/* 💡 네이버 카페 등 외부 이미지가 차단되는 문제를 해결하기 위한 설정입니다. */}
        <meta name="referrer" content="no-referrer" />
        {/* 💡 환경 내에서 globals.css 로드 실패 시 스타일이 깨지는 것을 방지하기 위해 Tailwind CDN을 추가합니다. */}
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body className="antialiased font-sans">
        {children}
      </body>
    </html>
  );
}