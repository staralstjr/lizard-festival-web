import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // 빌드 시 타입 에러가 있어도 무시하고 진행합니다
  typescript: {
    ignoreBuildErrors: true,
  },
  // 빌드 시 ESLint 에러가 있어도 무시하고 진행합니다
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.pstatic.net', // 네이버 이미지 서버 허용
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com', // 플레이스홀더 허용
      },
    ],
  },
};
export default nextConfig;
