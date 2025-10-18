/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'nunito': ['Nunito', 'sans-serif'],
      },
      boxShadow: {
        'cartoon': '5px 5px 0px 0px rgba(0,0,0,1)',
        'cartoon-sm': '2px 2px 0px 0px rgba(0,0,0,1)',
      }
    },
  },
  plugins: [],
}