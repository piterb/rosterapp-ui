/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"] ,
  theme: {
    extend: {
      colors: {
        skyglass: {
          50: "#f4f8fb",
          100: "#e6eff6",
          200: "#c7d9e8",
          300: "#9ab9d3",
          400: "#6a95bd",
          500: "#4c78a3",
          600: "#385a7d",
          700: "#2a4561",
          800: "#1f3448",
          900: "#172636"
        },
        runway: {
          500: "#f39a1d",
          600: "#d48112"
        }
      },
      fontFamily: {
        display: ["\"Poppins\"", "system-ui", "sans-serif"],
        body: ["\"Source Sans 3\"", "system-ui", "sans-serif"]
      },
      boxShadow: {
        panel: "0 20px 50px -30px rgba(15, 23, 42, 0.45)",
        soft: "0 12px 30px -18px rgba(15, 23, 42, 0.4)"
      }
    }
  },
  plugins: []
};
