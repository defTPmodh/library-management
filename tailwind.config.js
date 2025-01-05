/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#60A5FA', // Blue
          DEFAULT: '#3B82F6',
          dark: '#1D4ED8',
        },
        secondary: {
          light: '#A78BFA', // Purple
          DEFAULT: '#8B5CF6',
          dark: '#6D28D9',
        },
        accent: {
          light: '#34D399', // Emerald
          DEFAULT: '#10B981',
          dark: '#059669',
        },
        background: {
          light: '#F9FAFB',
          DEFAULT: '#F3F4F6',
          dark: '#111827',
        },
        surface: {
          light: '#FFFFFF',
          DEFAULT: '#F9FAFB',
          dark: '#1F2937',
        },
      },
      animation: {
        'gradient': 'gradient 8s linear infinite',
        'float': 'float 3s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        gradient: {
          '0%, 100%': {
            'background-size': '200% 200%',
            'background-position': 'left center'
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': 'right center'
          },
        },
        float: {
          '0%, 100%': {
            transform: 'translateY(0)',
          },
          '50%': {
            transform: 'translateY(-10px)',
          },
        },
      },
      backdropFilter: {
        'none': 'none',
        'blur': 'blur(20px)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
} 