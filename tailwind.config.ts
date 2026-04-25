import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#faf8f5",
        paper: "#f7f3ec",
        sand: "#f0ebe1",
        bone: "#fcfaf6",
        ink: "#1a1a1a",
        soot: "#2a2622",
        cocoa: "#5a4a30",
        clay: "#c9b896",
        claret: "#6e2a2e",
        tea: "#a89478",
      },
      fontFamily: {
        serif: ['"Playfair Display"', "Georgia", "serif"],
        editorial: ['"Cormorant Garamond"', "Georgia", "serif"],
      },
      letterSpacing: {
        editorial: "0.22em",
      },
    },
  },
  plugins: [],
};

export default config;
