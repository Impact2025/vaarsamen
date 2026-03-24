import type { Config } from 'tailwindcss'

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
        primary:                  '#46f1c5',
        'primary-container':      '#00d4aa',
        'on-primary':             '#00382b',
        surface:                  '#071325',
        'surface-container':      '#142032',
        'surface-container-high': '#1f2a3d',
        'surface-container-low':  '#101c2e',
        'on-surface':             '#d7e3fc',
        'on-surface-variant':     '#bacac2',
        secondary:                '#adc8f5',
        'secondary-container':    '#2f4a70',
        error:                    '#ffb4ab',
        outline:                  '#85948d',
      },
      fontFamily: {
        headline: ['Inter', 'sans-serif'],
        body:     ['Manrope', 'sans-serif'],
        label:    ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      borderRadius: {
        card: '2.5rem',
      },
      boxShadow: {
        glow:    '0 0 30px rgba(70,241,197,0.3)',
        'glow-lg': '0 0 60px rgba(70,241,197,0.4)',
        deep:    '0 20px 60px rgba(3,14,32,0.8)',
      },
      backdropBlur: {
        glass: '30px',
      },
    },
  },
  plugins: [],
}

export default config
