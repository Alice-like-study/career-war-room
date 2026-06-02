import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        cream: "#F8F4ED",
        ink: "#3D2817",
        cta: "#C41E3A",
        paper: "#FFFBF5",
        terminal: "#1a1410",
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Noto Serif SC", "Songti SC", "SimSun", "serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "Consolas", "monospace"],
      },
      boxShadow: {
        warm: "4px 6px 0 rgba(61, 40, 23, 0.08)",
        card: "6px 8px 0 rgba(61, 40, 23, 0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
