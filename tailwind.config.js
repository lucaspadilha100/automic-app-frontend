/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html","./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // AUTOMIC brand: dark teal/cyan (#22D3EE primary, #0F172A secondary)
        primary: {
          50:  '#f0fdff',
          100: '#ccf9fe',
          200: '#99f1fd',
          300: '#52e4fa',
          400: '#22d3ee',
          500: '#08b5d3',
          600: '#0891b2',
          700: '#0c7490',
          800: '#155e75',
          900: '#164e63',
          950: '#083344',
        },
        slate: {
          50:'#f8fafc',100:'#f1f5f9',200:'#e2e8f0',300:'#cbd5e1',
          400:'#94a3b8',500:'#64748b',600:'#475569',700:'#334155',
          800:'#1e293b',900:'#0f172a',950:'#020617',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        display: ['Cal Sans', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'monospace'],
      },
      boxShadow: {
        soft: '0 1px 3px 0 rgb(0 0 0 / 0.04), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
        card: '0 0 0 1px rgb(0 0 0 / 0.06), 0 2px 8px -1px rgb(0 0 0 / 0.06)',
        glow: '0 0 20px -4px rgb(34 211 238 / 0.3)',
        'glow-sm': '0 0 12px -2px rgb(34 211 238 / 0.25)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.25s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'shimmer': 'shimmer 1.8s ease-in-out infinite',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: { from:{opacity:'0'}, to:{opacity:'1'} },
        slideUp: { from:{opacity:'0',transform:'translateY(10px)'}, to:{opacity:'1',transform:'translateY(0)'} },
        slideInRight: { from:{opacity:'0',transform:'translateX(16px)'}, to:{opacity:'1',transform:'translateX(0)'} },
        shimmer: { '0%,100%':{opacity:'1'}, '50%':{opacity:'0.4'} },
        pulseSoft: { '0%,100%':{opacity:'1'}, '50%':{opacity:'0.7'} },
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.25rem',
      },
    },
  },
  plugins: [],
}
