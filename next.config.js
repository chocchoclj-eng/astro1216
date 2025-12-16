// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // ... 其他配置 ...

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            // ⚠️ 临时解决方案：在开发环境增加 'unsafe-eval' 来解决 Markdown 渲染问题。
            // 生产环境中应尽量移除！
            value: `script-src 'self' 'unsafe-inline' 'unsafe-eval';`,
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
