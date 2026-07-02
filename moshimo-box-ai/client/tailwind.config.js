/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        box: {
          bg: '#0f0a1e',
          card: '#1c1433',
          accent: '#ffb84d',
          accent2: '#8b5cf6',
        },
      },
      keyframes: {
        'box-open': {
          '0%': { transform: 'scale(1) rotate(0deg)', opacity: '1' },
          '50%': { transform: 'scale(1.15) rotate(-6deg)', opacity: '1' },
          '100%': { transform: 'scale(0) rotate(20deg)', opacity: '0' },
        },
        glow: {
          '0%,100%': { opacity: '0.5', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.05)' },
        },
      },
      animation: {
        'box-open': 'box-open 0.9s ease-in forwards',
        glow: 'glow 1.6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
