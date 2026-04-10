import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brick: {
          red: '#D01012',
          blue: '#0057A8',
          green: '#00852B',
          yellow: '#FFD700',
          white: '#FFFFFF',
          black: '#1B1B1B',
          orange: '#FF7E14',
          'dark-gray': '#6B5A5A',
          'light-gray': '#A0A0A0',
          brown: '#8B4513',
        },
      },
    },
  },
  plugins: [],
};

export default config;
