import type { Config } from 'tailwindcss';

// Every colour in HeyVanilla is a CSS variable so the whole app re-skins
// instantly when the theme changes. Tailwind just points at those vars.
const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './features/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'bg-primary': 'var(--bg-primary)',
        'bg-secondary': 'var(--bg-secondary)',
        'bg-card': 'var(--bg-card)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        accent: 'var(--accent)',
        'accent-light': 'var(--accent-light)',
        'accent-dark': 'var(--accent-dark)',
        border: 'var(--border)',
        success: 'var(--success)',
        warning: 'var(--warning)',
        danger: 'var(--danger)',
      },
      fontFamily: {
        display: 'var(--font-display)',
        body: 'var(--font-body)',
      },
      borderRadius: {
        theme: 'var(--radius)',
      },
      backdropBlur: {
        glass: '12px',
      },
      transitionDuration: {
        DEFAULT: '200ms',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'draw-line': {
          '0%': { width: '0' },
          '100%': { width: '120px' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.5s ease forwards',
        'draw-line': 'draw-line 0.6s ease forwards',
      },
    },
  },
  plugins: [],
};

export default config;
