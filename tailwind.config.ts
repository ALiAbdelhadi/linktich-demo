import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0A0A0F',
        foreground: '#F8FAFC',
        card: {
          DEFAULT: '#12121A',
          hover: '#181824',
          elevated: '#1F1F2E',
          foreground: '#F8FAFC',
        },
        popover: {
          DEFAULT: '#12121A',
          foreground: '#F8FAFC',
        },
        primary: {
          DEFAULT: '#4A00E0', // Electric Indigo
          hover: '#5E17EB',
          light: '#7B2CBF',
          dark: '#3700B3',
          foreground: '#FFFFFF',
        },
        secondary: {
          DEFAULT: '#00D4FF', // Bright Cyan
          hover: '#38BDF8',
          light: '#7DD3FC',
          dark: '#0284C7',
          foreground: '#0A0A0F',
        },
        gold: {
          DEFAULT: '#FFD700', // Subtle Gold Highlights
          50: '#FEFCE8',
          100: '#FEF9C3',
          400: '#FACC15',
          500: '#EAB308',
          600: '#CA8A04',
          glow: 'rgba(255, 215, 0, 0.25)',
        },
        border: 'rgba(255, 255, 255, 0.08)',
        input: 'rgba(255, 255, 255, 0.12)',
        ring: '#00D4FF',
        muted: {
          DEFAULT: '#1E1E2D',
          foreground: '#94A3B8',
        },
        accent: {
          DEFAULT: '#181824',
          foreground: '#00D4FF',
        },
      },
      boxShadow: {
        indigo: '0 0 25px -5px rgba(74, 0, 224, 0.45)',
        cyan: '0 0 25px -5px rgba(0, 212, 255, 0.35)',
        gold: '0 0 20px -3px rgba(255, 215, 0, 0.3)',
        glass: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'electric-cyan': 'linear-gradient(135deg, #4A00E0 0%, #00D4FF 100%)',
        'gold-glow': 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
        'dark-glass': 'linear-gradient(180deg, rgba(18, 18, 26, 0.8) 0%, rgba(10, 10, 15, 0.95) 100%)',
      },
      fontFamily: {
        sans: ['Cairo', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
