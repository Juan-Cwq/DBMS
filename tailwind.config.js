/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          'deep-blue': '#0D253F',
          'ocean-blue': '#005A7A',
          'aqua': '#00828C',
          'teal': '#00A99D',
          'lime-green': '#A0B55B',
          'orange': '#F58220',
        },
        neutral: {
          'dark-blue': '#1A202C',
          'medium-gray': '#718096',
          'light-gray': '#F7FAFC',
        },
        functional: {
          success: '#38A169',
          warning: '#D69E2E',
          error: '#E53E3E',
          info: '#3182CE',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['DM Serif Display', 'serif'],
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #0D253F 0%, #005A7A 35%, #00A99D 70%, #F58220 100%)',
      },
    },
  },
  plugins: [require('daisyui')],
  daisyui: {
    themes: [
      {
        light: {
          'primary': '#00A99D',
          'secondary': '#005A7A',
          'accent': '#F58220',
          'neutral': '#1A202C',
          'base-100': '#FFFFFF',
          'base-200': '#F7FAFC',
          'base-300': '#E2E8F0',
          'info': '#3182CE',
          'success': '#38A169',
          'warning': '#D69E2E',
          'error': '#E53E3E',
        },
        dark: {
          'primary': '#00A99D',
          'secondary': '#005A7A',
          'accent': '#F58220',
          'neutral': '#F7FAFC',
          'base-100': '#0D253F',
          'base-200': '#1A202C',
          'base-300': '#2D3748',
          'info': '#3182CE',
          'success': '#38A169',
          'warning': '#D69E2E',
          'error': '#E53E3E',
        },
      },
    ],
  },
}
