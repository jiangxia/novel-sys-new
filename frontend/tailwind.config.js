/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Monaco', 'Fira Code', 'monospace']
      },
      colors: {
        gray: {
          50: '#fafafa', 100: '#f5f5f5', 200: '#e5e5e5', 300: '#d4d4d4',
          400: '#a3a3a3', 500: '#737373', 600: '#525252', 700: '#404040', 800: '#262626', 900: '#171717'
        },
        blue: {
          500: '#0070f3', 600: '#0070f3', 700: '#0056b3'
        },
        v0: {
          sidebar: '#F8F9FA',
          editor: '#FFFFFF'
        }
      },
      spacing: {
        '12': '48px', '16': '64px', '24': '96px', '32': '128px'
      },
      borderRadius: {
        'button': '6px', 'card': '8px', 'message': '16px'
      },
      transitionDuration: {
        'fast': '150ms', 'normal': '250ms', 'slow': '400ms'
      },
      boxShadow: {
        'hover': '0 1px 3px rgba(0,0,0,0.1)',
        'card': '0 4px 6px rgba(0,0,0,0.05)', 
        'popup': '0 10px 25px rgba(0,0,0,0.1)',
        'deep': '0 25px 50px rgba(0,0,0,0.15)'
      }
    },
  },
  plugins: [],
}