import type { Config } from "tailwindcss"

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#cd2bee",
          dark: "#a61cbd",
          light: "#e066f5",
        },
        background: {
          light: "#f8f6f8",
          dark: "#1f1022",
          darker: "#150b18",
        },
        surface: "#ffffff",
        muted: {
          DEFAULT: "#9ca3af",
          foreground: "#6b7280",
        },
      },
      fontFamily: {
        sans: ["Plus Jakarta Sans", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "1rem",
        lg: "1.5rem",
        xl: "2rem",
        "2xl": "2.5rem",
        "3xl": "3rem",
        "4xl": "5rem",
      },
      boxShadow: {
        glow: "0 0 20px rgba(205, 43, 238, 0.4)",
        "glow-lg": "0 0 40px rgba(205, 43, 238, 0.5)",
        "glow-sm": "0 0 10px rgba(205, 43, 238, 0.3)",
        float: "0 10px 30px -10px rgba(0, 0, 0, 0.15)",
        "float-lg": "0 20px 50px -15px rgba(0, 0, 0, 0.25)",
        glass: "0 8px 32px rgba(0, 0, 0, 0.12)",
      },
      animation: {
        marquee: "marquee 30s linear infinite",
        "marquee-slow": "marquee 45s linear infinite",
        "fade-in": "fadeIn 0.6s ease-out forwards",
        "fade-in-up": "fadeInUp 0.6s ease-out forwards",
        "slide-in-right": "slideInRight 0.4s ease-out forwards",
        "scale-in": "scaleIn 0.3s ease-out forwards",
        "pulse-glow": "pulseGlow 2s ease-in-out infinite",
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideInRight: {
          "0%": { opacity: "0", transform: "translateX(100%)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 20px rgba(205, 43, 238, 0.4)" },
          "50%": { boxShadow: "0 0 35px rgba(205, 43, 238, 0.6)" },
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-glow":
          "radial-gradient(ellipse at center, rgba(205, 43, 238, 0.15) 0%, transparent 70%)",
        "gradient-hero":
          "linear-gradient(to bottom, rgba(31, 16, 34, 0.3) 0%, rgba(31, 16, 34, 0.8) 100%)",
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
}

export default config
