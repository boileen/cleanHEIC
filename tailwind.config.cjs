/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1D4ED8',
          bright: '#2563EB',
          hover: '#1E40AF',
          active: '#1E3A8A',
          soft: '#EFF4FF',
        },
        canvas: '#F6F7F9',
        surface: '#FFFFFF',
        line: '#E4E7EC',
        'line-strong': '#CFD4DC',
        ink: {
          DEFAULT: '#101828',
          secondary: '#475467',
          muted: '#667085',
        },
        success: {
          DEFAULT: '#067647',
          bg: '#ECFDF3',
          border: '#A6F4C5',
        },
        danger: '#B42318',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans Variable"', '"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(16, 24, 40, 0.04), 0 4px 12px rgba(16, 24, 40, 0.02)',
        raised:
          '0 10px 25px -5px rgba(16, 24, 40, 0.08), 0 8px 10px -6px rgba(16, 24, 40, 0.04)',
      },
      maxWidth: {
        shell: '1200px',
        sections: '1024px',
        workspace: '896px',
      },
      fontSize: {
        'headline-xl-mobile': [
          '2.25rem',
          { lineHeight: '2.75rem', letterSpacing: '-0.025em', fontWeight: '800' },
        ],
        'headline-xl': ['3rem', { lineHeight: '3.5rem', letterSpacing: '-0.03em', fontWeight: '800' }],
        'headline-lg': ['1.75rem', { lineHeight: '2.25rem', letterSpacing: '-0.02em', fontWeight: '700' }],
        'headline-md': ['1.25rem', { lineHeight: '1.75rem', letterSpacing: '-0.015em', fontWeight: '600' }],
        'body-lg': ['1rem', { lineHeight: '1.6rem' }],
        'body-md': ['0.875rem', { lineHeight: '1.45rem' }],
        control: ['0.875rem', { lineHeight: '1.25rem', letterSpacing: '-0.01em', fontWeight: '600' }],
        'mono-metric': ['0.875rem', { lineHeight: '1.25rem', fontWeight: '500' }],
        'mono-caption': ['0.75rem', { lineHeight: '1rem' }],
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 400ms ease-out both',
      },
    },
  },
  plugins: [],
}
