// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // ... 其他配置
    },
  },
  plugins: [
    // ⚠️ 最终的关键：确保安装并引入 @tailwindcss/typography 插件
    require('@tailwindcss/typography'), 
  ],
}