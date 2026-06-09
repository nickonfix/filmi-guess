/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Ink / text
        ink: '#171717',
        body: '#4d4d4d',
        mute: '#888888',
        'on-primary': '#ffffff',
        primary: '#171717',

        // Surfaces
        canvas: '#ffffff',
        'canvas-soft': '#fafafa',
        'canvas-soft-2': '#f5f5f5',
        hairline: '#ebebeb',
        'hairline-strong': '#a1a1a1',

        // Brand gradient stops
        cyan: '#50e3c2',
        violet: '#7928ca',
        'highlight-pink': '#ff0080',

        // Semantic
        link: '#0070f3',
        'link-deep': '#0761d1',
        'link-soft': '#d3e5ff',
        success: '#0cce6b',
        'success-soft': '#d6f5e3',
        'success-deep': '#0a8f4d',
        error: '#ee0000',
        'error-soft': '#f7d4d6',
        'error-deep': '#c50000',
        warning: '#f5a623',
        'warning-soft': '#ffefcf',
        'warning-deep': '#ab570a',

        // Gradient pairs (for utilities / mockups)
        'g-develop-start': '#007cf0',
        'g-develop-end': '#00dfd8',
        'g-preview-start': '#7928ca',
        'g-preview-end': '#ff0080',
        'g-ship-start': '#ff4d4d',
        'g-ship-end': '#f9cb28',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'JetBrains Mono', 'ui-monospace', 'monospace'],
        display: ['var(--font-sans)', 'Inter', 'sans-serif'],
      },
      borderRadius: {
        xs: '4px',
        sm: '6px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        'pill-sm': '64px',
        pill: '100px',
      },
      boxShadow: {
        // Geist stacked-shadow ladder — light surfaces
        hairline: 'inset 0 0 0 1px rgba(0,0,0,0.07)',
        card: '0px 1px 1px rgba(0,0,0,0.02), 0px 2px 2px rgba(0,0,0,0.04), inset 0 0 0 1px rgba(0,0,0,0.06)',
        'card-md':
          '0px 2px 2px rgba(0,0,0,0.04), 0px 8px 8px -8px rgba(0,0,0,0.06), inset 0 0 0 1px rgba(0,0,0,0.06)',
        'card-lg':
          '0px 2px 2px rgba(0,0,0,0.04), 0px 8px 16px -4px rgba(0,0,0,0.08), inset 0 0 0 1px rgba(0,0,0,0.06)',
        modal:
          '0px 1px 1px rgba(0,0,0,0.02), 0px 8px 16px -4px rgba(0,0,0,0.06), 0px 24px 32px -8px rgba(0,0,0,0.08), inset 0 0 0 1px rgba(0,0,0,0.06)',
        // Dark-band variants (white inset ring)
        'card-dark':
          '0px 2px 2px rgba(0,0,0,0.3), 0px 8px 16px -4px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(255,255,255,0.08)',
        btn: '0px 1px 2px rgba(0,0,0,0.1), inset 0 0 0 1px rgba(0,0,0,0.06)',
        'btn-primary': '0px 1px 2px rgba(0,0,0,0.25)',
        focus: '0 0 0 3px rgba(0,112,243,0.2)',
      },
      animation: {
        'pulse-fast': 'pulse 0.8s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-in': 'bounceIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'slide-up': 'slideUp 0.3s ease-out',
        'fade-in': 'fadeIn 0.4s ease-out',
        'mesh-drift': 'meshDrift 24s ease-in-out infinite',
        shimmer: 'shimmer 2.5s linear infinite',
      },
      keyframes: {
        bounceIn: {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '70%': { transform: 'scale(1.04)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(12px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        meshDrift: {
          '0%, 100%': { transform: 'translate3d(0, 0, 0) scale(1)' },
          '33%': { transform: 'translate3d(-2%, 1.5%, 0) scale(1.05)' },
          '66%': { transform: 'translate3d(2%, -1%, 0) scale(1.03)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      maxWidth: {
        page: '1400px',
        'page-legacy': '1200px',
      },
    },
  },
  plugins: [],
};
