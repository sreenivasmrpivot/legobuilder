/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'lego-red': '#D01012',
        'lego-blue': '#0057A8',
        'lego-green': '#237841',
        'lego-yellow': '#FEC400',
        'lego-orange': '#F57D20',
        'lego-purple': '#6B327B',
        'lego-cyan': '#00BCD4',
        'lego-brown': '#8D7452',
      },
    },
  },
  plugins: [],
};
