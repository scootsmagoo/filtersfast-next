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
        // FiltersFast brand colors - EXACT match from original site CSS
        brand: {
          // Primary Orange (exact from original)
          orange: '#f26722',
          'orange-dark': '#f58612',
          'orange-light': '#fda74d',
          'orange-hover': '#FF6700',
          
          // Primary Blue (exact from original - #054f97 is THE main blue)
          blue: '#054f97',
          'blue-dark': '#2352a0',
          'blue-link': '#086db6',
          'blue-link-hover': '#001e59',
          'blue-account': '#0066c0',
          'blue-badge': '#002F8C',
          'blue-secondary': '#05247d',
          
          // Success/Green colors
          green: {
            success: '#37b033',
            bright: '#37D42E',
            confirm: '#11AB00',
          },
          
          gray: {
            50: '#f9fafb',
            100: '#f3f4f6',
            200: '#e5e7eb',
            300: '#d1d5db',
            400: '#9ca3af',
            500: '#6b7280',
            600: '#4b5563',
            700: '#374151',
            800: '#1f2937',
            900: '#111827',
          }
        },
      },
      fontFamily: {
        sans: ['Lato', 'museo-sans-rounded', 'Verdana', 'sans-serif', 'Helvetica'],
      },
    },
  },
  plugins: [],
};
export default config;

