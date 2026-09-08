/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        f1: {
          red: '#E10600',
          darkRed: '#960400',
          black: '#0E0E12',
          card: '#16161D',
          border: '#2A2A38',
          accent: '#00E5FF',
          yellow: '#FFB800',
          green: '#00E676',
          muted: '#8A8A9E'
        }
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'Consolas', 'monospace'],
        sans: ['"Inter"', 'system-ui', 'sans-serif']
      }
    },
  },
  plugins: [],
}
