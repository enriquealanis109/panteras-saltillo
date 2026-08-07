import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        pantera: {
          black: "#0a0a0a",
          green: "#16a34a",
          "green-light": "#22c55e",
          "green-dark": "#15803d",
          gray: "#111111",
          "gray-light": "#1a1a1a",
        },
      },
      fontFamily: {
        heading: ["Syne", "sans-serif"],
        body:    ["Space Grotesk", "sans-serif"],
        sans:    ["Space Grotesk", "sans-serif"],
      },
      animation: {
        "fade-in":   "fadeIn 0.6s ease-out",
        "slide-up":  "slideUp 0.6s ease-out",
        "orb-slow":  "orbFloat 8s ease-in-out infinite",
        "orb-mid":   "orbFloat 6s ease-in-out infinite reverse",
        "orb-fast":  "orbFloat 4.5s ease-in-out infinite",
        "glow-pulse":"glowPulse 3s ease-in-out infinite",
        "hero-1":    "heroIn 0.8s cubic-bezier(0.22,1,0.36,1) both",
        "hero-2":    "heroIn 0.8s cubic-bezier(0.22,1,0.36,1) 0.15s both",
        "hero-3":    "heroIn 0.8s cubic-bezier(0.22,1,0.36,1) 0.3s both",
        "hero-4":    "heroIn 0.8s cubic-bezier(0.22,1,0.36,1) 0.45s both",
        "hero-5":    "heroIn 0.8s cubic-bezier(0.22,1,0.36,1) 0.6s both",
        "hero-6":    "heroIn 0.8s cubic-bezier(0.22,1,0.36,1) 0.75s both",
      },
      keyframes: {
        fadeIn: {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%":   { opacity: "0", transform: "translateY(30px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        orbFloat: {
          "0%, 100%": { transform: "translateY(0) scale(1)" },
          "50%":      { transform: "translateY(-40px) scale(1.05)" },
        },
        glowPulse: {
          "0%, 100%": { boxShadow: "0 0 30px 8px rgba(22,163,74,0.35), 0 0 80px 20px rgba(22,163,74,0.15)" },
          "50%":      { boxShadow: "0 0 50px 15px rgba(22,163,74,0.55), 0 0 120px 40px rgba(22,163,74,0.25)" },
        },
        heroIn: {
          "0%":   { opacity: "0", transform: "translateY(32px)", filter: "blur(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)",    filter: "blur(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
