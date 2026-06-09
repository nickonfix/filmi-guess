/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Theme-aware (flip on .dark) — driven by CSS variables
        ink: 'rgb(var(--ink) / <alpha-value>)',
        body: 'rgb(var(--body) / <alpha-value>)',
        mute: 'rgb(var(--mute) / <alpha-value>)',
        'on-primary': 'rgb(var(--on-primary) / <alpha-value>)',
        primary: 'rgb(var(--primary) / <alpha-value>)',
        band: 'rgb(var(--band) / <alpha-value>)',
        'on-band': '#ffffff',
        canvas: 'rgb(var(--canvas) / <alpha-value>)',
        'canvas-soft': 'rgb(var(--canvas-soft) / <alpha-value>)',
        'canvas-soft-2': 'rgb(var(--canvas-soft-2) / <alpha-value>)',
        hairline: 'rgb(var(--hairline) / <alpha-value>)',
        'hairline-strong': 'rgb(var(--hairline-strong) / <alpha-value>)',

        // Fixed brand gradient stops
        cyan: '#50e3c2',
        violet: '#7928ca',
        'highlight-pink': '#ff0080',
        'g-develop-start': '#007cf0',
        'g-develop-end': '#00dfd8',
        'g-preview-start': '#7928ca',
        'g-preview-end': '#ff0080',
        'g-ship-start': '#ff4d4d',
        'g-ship-end': '#f9cb28',

        // Semantic (flip on .dark)
        link: 'rgb(var(--link) / <alpha-value>)',
        'link-deep': 'rgb(var(--link-deep) / <alpha-value>)',
        'link-soft': '#d3e5ff',
        success: '#0cce6b',
        'success-soft': 'rgb(var(--success-soft) / <alpha-value>)',
        'success-deep': 'rgb(var(--success-deep) / <alpha-value>)',
        error: '#ee0000',
        'error-soft': 'rgb(var(--error-soft) / <alpha-value>)',
        'error-deep': 'rgb(var(--error-deep) / <alpha-value>)',
        warning: '#f5a623',
        'warning-soft': 'rgb(var(--warning-soft) / <alpha-value>)',
        'warning-deep': 'rgb(var(--warning-deep) / <alpha-value>)',
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
        // Geist stacked-shadow ladder — flip on .dark via CSS variables
        hairline: 'var(--sh-hairline)',
        card: 'var(--sh-card)',
        'card-md': 'var(--sh-card-md)',
        'card-lg': 'var(--sh-card-lg)',
        modal: 'var(--sh-modal)',
        btn: 'var(--sh-btn)',
        'btn-primary': 'var(--sh-btn-primary)',
        // Always-dark spotlight surfaces (bands, winner card, overlays)
        'card-dark':
          '0px 2px 2px rgba(0,0,0,0.3), 0px 8px 16px -4px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(255,255,255,0.08)',
        focus: '0 0 0 3px rgba(0,112,243,0.3)',
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
