/** @type {import('next').NextConfig} */
const nextConfig = {
  // 勿使用 output: "export"：静态导出不包含 App Router 的 /api/*，线上聊天会 404。
  images: { unoptimized: true },
  trailingSlash: true,
};

export default nextConfig;
