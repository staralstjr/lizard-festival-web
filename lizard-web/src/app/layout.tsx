import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ringo Cre | 파충류 행사 & 분양 리스트",
  description: "레드바이 & 트익할 화이트 스팟 전문 링고크레입니다. 전국 파충류 행사 일정과 실시간 분양 정보를 확인하세요.",
  icons: {
    icon: "/images/ringoCre.png", // 브라우저 탭에 뜰 이미지 경로
    apple: "/images/ringoCre.png", // 아이폰 홈 화면 추가 시 뜰 이미지
  },
  // 💡 SNS 공유 시 보이는 설정 (Open Graph)
  openGraph: {
    title: "Ringo Cre | 파충류 행사 & 분양 리스트",
    description: "전국 파충류 행사 일정과 실시간 분양 정보를 한눈에!",
    url: "https://lizard-festival-web.vercel.app",
    siteName: "Ringo Cre",
    images: [
      {
        url: "/images/ringoCre.png", // 💡 public/images/ringoCre.png 경로 확인!
        width: 800,
        height: 600,
        alt: "Ringo Cre 로고",
      },
    ],
    locale: "ko_KR",
    type: "website",
  },

  // 💡 트위터용 설정
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
      <body className="antialiased">{children}</body>
    </html>
  );
}
