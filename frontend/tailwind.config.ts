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
      typography: {
        DEFAULT: {
          css: {
            color: '#e2e8f0',
            'h1,h2,h3,h4': { color: '#00D4FF' },
            code: {
              color: '#22d3ee',
              backgroundColor: '#1F2937',
              padding: '2px 6px',
              borderRadius: '4px',
            },
            'code::before': { content: '""' },
            'code::after': { content: '""' },
            a: { color: '#00D4FF' },
            strong: { color: '#f1f5f9' },
            blockquote: { borderColor: '#00D4FF', color: '#94a3b8' },
            hr: { borderColor: '#1F2937' },
            li: { color: '#cbd5e1' },
            'ul > li::marker': { color: '#00D4FF' },
            'ol > li::marker': { color: '#00D4FF' },
          },
        },
      },
    },
  },
  plugins: [],
}
