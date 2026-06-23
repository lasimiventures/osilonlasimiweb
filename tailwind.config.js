/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: '#3A8BC2',
          'blue-dark': '#2E7AAF',
          'blue-light': '#5BA3D4',
          'blue-pale': '#E8F3FB',
          green: '#7CC242',
          'green-dark': '#6BA838',
          'green-light': '#93D45A',
          'green-pale': '#F0F9E8',
        },
      },
    },
  },
  plugins: [],
};
