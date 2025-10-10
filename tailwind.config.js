/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'fredoka': ['Fredoka One', 'cursive'],
        'inter': ['Inter', 'sans-serif'],
      },
      colors: {
        'bg-main': '#FFFBEB',
        'bg-card': '#FFFFFF', 
        'text-primary': '#4A3C31',
        'text-secondary': '#7A6A5D',
        'border-color': '#E5D9CB',
        'primary-accent': '#FF8A65',
        'secondary-accent': '#81D4FA',
      },
      boxShadow: {
        'cartoon': '5px 5px 0px 0px rgba(0,0,0,1)',
        'cartoon-sm': '2px 2px 0px 0px rgba(0,0,0,1)',
      }
    },
  },
  plugins: [],
}