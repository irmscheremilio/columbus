import type { Config } from 'tailwindcss'

export default {
  content: [
    './components/**/*.{js,vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './plugins/**/*.{js,ts}',
    './app.vue',
  ],
  theme: {
    extend: {
      colors: {
        // Columbus Brand Colors
        brand: {
          orange: '#F29901', // Primary brand color
          DEFAULT: '#F29901',
        },
        background: {
          DEFAULT: '#F5F5F5', // General background
          card: '#F5F5F5', // Cards use same color, separated by border
          highlight: '#FFFFFF', // White for highlights
        },
        border: {
          DEFAULT: '#E5E5E5', // Thin gray border for cards
        },
        // Keep primary as orange-based shades for compatibility
        primary: {
          50: '#FEF7E6',
          100: '#FDECC9',
          200: '#FBD894',
          300: '#F9C15F',
          400: '#F6A930',
          500: '#F29901', // Main brand color
          600: '#D68501',
          700: '#B16F01',
          800: '#8C5701',
          900: '#6C4301',
          950: '#4D2F01',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Craw Modern', 'Georgia', 'serif'], // For highlighting important words
      },
      borderWidth: {
        DEFAULT: '1px',
      },
      boxShadow: {
        // Remove default shadows, use borders instead
        none: 'none',
        card: 'none', // Cards should have no shadow
      },
      animation: {
        'flow-line': 'flowLine 3s ease-in-out infinite',
        'fade-in-up': 'fadeInUp 0.6s ease-out forwards',
        'fade-in-down': 'fadeInDown 0.6s ease-out forwards',
      },
      keyframes: {
        flowLine: {
          '0%': { transform: 'translateX(-100%)' },
          '50%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInDown: {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
} satisfies Config
