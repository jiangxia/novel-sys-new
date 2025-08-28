/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(210 18% 87%)",
        input: "hsl(210 18% 87%)",
        ring: "hsl(212 100% 47%)",
        background: "hsl(0 0% 100%)",
        foreground: "hsl(210 11% 15%)",
        primary: {
          DEFAULT: "hsl(212 100% 47%)",
          foreground: "hsl(0 0% 100%)",
        },
        secondary: {
          DEFAULT: "hsl(210 20% 98%)",
          foreground: "hsl(210 11% 15%)",
        },
        destructive: {
          DEFAULT: "hsl(0 84% 60%)",
          foreground: "hsl(0 0% 100%)",
        },
        muted: {
          DEFAULT: "hsl(210 20% 98%)",
          foreground: "hsl(215 16% 47%)",
        },
        accent: {
          DEFAULT: "hsl(210 20% 98%)",
          foreground: "hsl(210 11% 15%)",
        },
        popover: {
          DEFAULT: "hsl(0 0% 100%)",
          foreground: "hsl(210 11% 15%)",
        },
        card: {
          DEFAULT: "hsl(210 20% 98%)",
          foreground: "hsl(210 11% 15%)",
        },
      },
      borderRadius: {
        lg: "8px",
        md: "6px", 
        sm: "4px",
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        mono: ['SF Mono', 'Monaco', 'Cascadia Code', 'monospace'],
      },
    },
  },
  plugins: [],
}