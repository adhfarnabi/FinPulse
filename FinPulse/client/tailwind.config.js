/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#0B0F0D',
          900: '#101512',
          800: '#171C19',
          700: '#212722',
          600: '#2B322C',
          border: '#2A312D',
        },
        paper: {
          100: '#EEEAE0',
          300: '#C9C4B6',
          500: '#9CA79F',
        },
        marigold: {
          400: '#E3A64B',
          500: '#D98E2B',
          600: '#B8721E',
        },
        gain: {
          400: '#5CC2AE',
          500: '#3FA796',
          600: '#2E8577',
        },
        loss: {
          400: '#D97759',
          500: '#C4553B',
          600: '#9C4230',
        },
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        sm: '4px',
        DEFAULT: '6px',
      },
    },
  },
  plugins: [],
};
