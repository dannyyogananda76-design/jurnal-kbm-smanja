/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  safelist: [
    'bg-green-50', 'bg-green-100', 'text-green-600', 'text-green-700',
    'bg-blue-50', 'bg-blue-100', 'text-blue-600', 'text-blue-700',
    'bg-amber-50', 'bg-amber-100', 'text-amber-600', 'text-amber-700',
    'bg-red-50', 'bg-red-100', 'text-red-600', 'text-red-700',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
