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
};

export default nextConfig;
