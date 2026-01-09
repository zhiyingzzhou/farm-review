/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./web/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          50: "hsl(var(--primary) / 0.08)",
          100: "hsl(var(--primary) / 0.12)",
          200: "hsl(var(--primary) / 0.18)",
          300: "hsl(var(--primary) / 0.26)",
          400: "hsl(var(--primary) / 0.4)",
          500: "hsl(var(--primary))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
          500: "hsl(var(--secondary))",
        },
        tertiary: {
          DEFAULT: "hsl(var(--tertiary))",
          foreground: "hsl(var(--tertiary-foreground))",
          500: "hsl(var(--tertiary))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
          400: "hsl(var(--secondary) / 0.85)",
          500: "hsl(var(--secondary))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },

        surface: {
          50: "hsl(var(--foreground) / 0.98)",
          100: "hsl(var(--foreground) / 0.92)",
          200: "hsl(var(--foreground) / 0.86)",
          300: "hsl(var(--foreground) / 0.78)",
          400: "hsl(var(--muted-foreground))",
          500: "hsl(var(--muted-foreground) / 0.9)",
          600: "hsl(var(--border))",
          700: "hsl(var(--border) / 0.9)",
          800: "hsl(var(--muted))",
          900: "hsl(var(--card))",
          950: "hsl(var(--background))",
        },
      },
      fontFamily: {
        display: ['Orbitron', 'Share Tech Mono', 'monospace'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
        tech: ['Share Tech Mono', 'monospace'],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      animation: {
        "blink": "blink 1s step-end infinite",
        "glitch": "glitch 0.5s ease-in-out infinite",
        "pulse-neon": "pulse-neon 2s ease-in-out infinite",
        "float": "float 3s ease-in-out infinite",
        "scan": "scan 8s linear infinite",
        "gradient": "gradient 8s linear infinite",
        "shimmer": "shimmer 2s linear infinite",
        "slide-up": "slideUp 0.5s ease-out",
        "slide-down": "slideDown 0.3s ease-out",
        "fade-in": "fadeIn 0.5s ease-out",
        "scale-in": "scaleIn 0.3s ease-out",
        "bounce-in": "bounceIn 0.6s ease-out",
      },
      keyframes: {
        blink: {
          "50%": { opacity: "0" },
        },
        glitch: {
          "0%, 100%": { transform: "translate(0)" },
          "20%": { transform: "translate(-2px, 2px)" },
          "40%": { transform: "translate(2px, -2px)" },
          "60%": { transform: "translate(-1px, -1px)" },
          "80%": { transform: "translate(1px, 1px)" },
        },
        "pulse-neon": {
          "0%, 100%": { boxShadow: "var(--neon-glow)" },
          "50%": { boxShadow: "var(--neon-glow-lg)" },
        },
        scan: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100vh)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        gradient: {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideDown: {
          "0%": { opacity: "0", transform: "translateY(-10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        bounceIn: {
          "0%": { opacity: "0", transform: "scale(0.3)" },
          "50%": { transform: "scale(1.05)" },
          "70%": { transform: "scale(0.9)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
      boxShadow: {
        neon: "var(--neon-glow)",
        "neon-sm": "var(--neon-glow-sm)",
        "neon-lg": "var(--neon-glow-lg)",
        "neon-secondary": "var(--neon-secondary)",
        "neon-tertiary": "var(--neon-tertiary)",
      },
    },
  },
  plugins: [],
}
