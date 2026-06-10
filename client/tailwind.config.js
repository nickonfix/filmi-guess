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

        // JKLM-style party palette — teal/green primaries + warm accents.
        teal: '#1ab0a2',
        'teal-deep': '#0e8c80',
        leaf: '#62b24e',
        'leaf-deep': '#4a9038',
        sunshine: '#f4c152',
        coral: '#ef6f5e',
        sky: '#4fa0dd',
        // Per-player avatar accents (cycled in the ring/leaderboard)
        'av-1': '#1ab0a2',
        'av-2': '#ef6f5e',
        'av-3': '#4fa0dd',
        'av-4': '#f4c152',
        'av-5': '#62b24e',
        'av-6': '#a874d6',

        // Semantic (flip on .dark)
        link: 'rgb(var(--link) / <alpha-value>)',
        'link-deep': 'rgb(var(--link-deep) / <alpha-value>)',
        'link-soft': '#cfeeea',
        success: '#3fb46f',
        'success-soft': 'rgb(var(--success-soft) / <alpha-value>)',
        'success-deep': 'rgb(var(--success-deep) / <alpha-value>)',
        error: '#e5614c',
        'error-soft': 'rgb(var(--error-soft) / <alpha-value>)',
        'error-deep': 'rgb(var(--error-deep) / <alpha-value>)',
        warning: '#f2b23e',
        'warning-soft': 'rgb(var(--warning-soft) / <alpha-value>)',
        'warning-deep': 'rgb(var(--warning-deep) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'Nunito', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'JetBrains Mono', 'ui-monospace', 'monospace'],
        display: ['var(--font-display)', 'Fredoka', 'var(--font-sans)', 'sans-serif'],
      },
      borderRadius: {
        xs: '6px',
        sm: '9px',
        md: '13px',
        lg: '18px',
        xl: '22px',
        '2xl': '28px',
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
          '0px 4px 0px rgba(0,0,0,0.25), 0px 10px 24px -6px rgba(0,0,0,0.45), inset 0 0 0 1px rgba(255,255,255,0.08)',
        focus: '0 0 0 4px rgba(26,176,162,0.30)',
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
