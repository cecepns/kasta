export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: { sans: ["Plus Jakarta Sans", "system-ui", "sans-serif"] },
      colors: {
        sand: { 50: "#FFF8F1", 100: "#FDE3CB", 200: "#F1CBA5" },
        clay: { 400: "#D6965F", 500: "#C27C48", 600: "#A65F2E", 700: "#8A4B1F", 800: "#5E310F", 900: "#2B1608" },
        sun: "#F4D06F",
        mist: "#E0F4F4",
      },
    },
  },
  plugins: [],
};
