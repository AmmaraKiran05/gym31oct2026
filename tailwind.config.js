/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        lime: { neon: '#C6FF3D' },
        cyan: { neon: '#22E4F5' },
        ink: {
          950: '#06080B',
          900: '#0B0F14',
          800: '#121820',
          700: '#1A222D',
        },
        // Theme tokens driven by CSS variables (see index.css)
        bg: 'rgb(var(--bg) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        fg: 'rgb(var(--fg) / <alpha-value>)',
        muted: 'rgb(var(--muted) / <alpha-value>)',
        line: 'rgb(var(--line) / <alpha-value>)',
        accent: 'rgb(var(--accent) / <alpha-value>)',
      },
      boxShadow: {
        glow: '0 0 0 1px rgb(var(--accent) / 0.25), 0 8px 40px -8px rgb(var(--accent) / 0.45)',
        soft: '0 10px 40px -12px rgb(0 0 0 / 0.45)',
      },
      backgroundImage: {
        'pulse-gradient': 'linear-gradient(100deg, #C6FF3D 0%, #5CF2A0 45%, #22E4F5 100%)',
      },
      keyframes: {
        float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-12px)' } },
        shimmer: { '0%': { backgroundPosition: '0% 50%' }, '100%': { backgroundPosition: '200% 50%' } },
        beat: {
          '0%,100%': { transform: 'scale(1)' },
          '15%': { transform: 'scale(1.18)' },
          '30%': { transform: 'scale(1)' },
          '45%': { transform: 'scale(1.1)' },
        },
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        // starts after the page has settled so it doesn't compete with first load
        shimmer: 'shimmer 6s linear 2.5s infinite',
        beat: 'beat 1.6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
