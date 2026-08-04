/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        avito: {
          green: "#00CC76",
          blue: "#00AAFF",
          red: "#FF4053",
          purple: "#9A41FE",
          yellow: "#FFC000",
          dark: "#141414",
          card: "#F4F5F7",
          border: "#E0E4ED"
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
