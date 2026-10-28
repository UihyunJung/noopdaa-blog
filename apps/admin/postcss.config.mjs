/** @type {import('postcss-load-config').Config} */
const config = {
  // Tailwind v4: 전용 PostCSS 플러그인 하나로 처리 (autoprefixer 내장)
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
