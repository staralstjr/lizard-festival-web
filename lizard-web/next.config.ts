import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false, // 네이버 지도 API 이중 초기화 문제 해결을 위해 비활성화
};

export default nextConfig;
