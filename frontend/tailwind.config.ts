/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#0A0F1E',
          900: '#0D1424',
          800: '#111827',
          700: '#1a2235',
          600: '#1F2937',
        },
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'Fira Code', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
