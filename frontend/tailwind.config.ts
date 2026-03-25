import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#050816",
        surface: "#0a1023",
        panel: "rgba(15, 23, 42, 0.72)",
        accent: "#7dd3fc",
        mint: "#6ee7b7",
        glow: "#8b5cf6"
      },
      boxShadow: {
        halo: "0 0 0 1px rgba(255,255,255,0.06), 0 20px 80px rgba(76, 29, 149, 0.25)"
      },
      backgroundImage: {
        "hero-grid":
          "radial-gradient(circle at top, rgba(125,211,252,0.18), transparent 28%), radial-gradient(circle at 80% 10%, rgba(139,92,246,0.22), transparent 30%), linear-gradient(180deg, rgba(10,16,35,0.96), rgba(5,8,22,1))"
      }
    }
  },
  plugins: []
};

export default config;
