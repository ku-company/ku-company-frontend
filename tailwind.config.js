/** @type {import('tailwindcss').Config} */
const config = {
  darkMode: ["class"],

  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./styles/**/*.{scss,css}",
    "./node_modules/daisyui/dist/**/*.js",
    "./node_modules/react-daisyui/dist/**/*.js",
  ],

  theme: {
    extend: {
      fontFamily: {
        primary: ["Inter", "sans-serif"],
      },
      colors: {
        primary: "#5D9252",          // เขียว KU
        "primary-light": "#E8F5E9",  // เขียวอ่อน
        white: "#FFFFFF",
        black: "#000000",
        midgreen: {
          500: "#5D9252",
          600: "#4B7843",
        },
      },
      fontSize: {
        h1: "2.5rem",
        h2: "2rem",
        h3: "1.5rem",
        h4: "1.25rem",
        h5: "1rem",
      },
    },
  },

  plugins: [
    require("daisyui"),
    require("@tailwindcss/typography"),
    require("tailwindcss-animate"),
  ],

  // ✅ DaisyUI Theme: เฉพาะ “เขียว–ขาว”
  daisyui: {
    themes: [
      {
        kucompany: {
          primary: "#5D9252",
          "primary-content": "#FFFFFF",
          secondary: "#FFFFFF",
          "secondary-content": "#5D9252",
          accent: "#5D9252",
          "accent-content": "#FFFFFF",
          neutral: "#FFFFFF",
          "neutral-content": "#5D9252",
          "base-100": "#FFFFFF",
          "base-content": "#1A1A1A",
          info: "#5D9252",
          success: "#5D9252",
          warning: "#5D9252",
          error: "#5D9252",
        },
      },
    ],
  },
};

export default config;
