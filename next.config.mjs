/** @type {import('next').NextConfig} */
const nextConfig = {
  // 勿使用 output: "export"：静态导出不包含 App Router 的 /api/*，线上聊天会 404。
  images: { unoptimized: true },
  trailingSlash: true,
  // pdf-parse 内含 pdf.js，不能被 webpack 打包
  experimental: {
    serverComponentsExternalPackages: ['pdf-parse'],
  },
};

export default nextConfig;
