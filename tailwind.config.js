/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './*.{ts,tsx}',
    './{src,components,games,riddle,services,tellMeWhy,utils}/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Palette "sky" của Tailwind; 50/100/500/600/700 là các giá trị gốc từ config cũ,
        // các shade còn lại điền bổ sung vì code đã dùng (brand-200/300/400/800/900)
        brand: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        fun: {
          yellow: '#facc15',
          green: '#4ade80',
          red: '#f87171',
          purple: '#c084fc',
        },
      },
      fontFamily: {
        sans: ['Comic Sans MS', 'Comic Sans', 'Verdana', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
