/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#e0e5ec',
        surface: '#e0e5ec',
        primary: '#4fd1c5',
        'primary-dark': '#319795',
        secondary: '#a0aec0',
        text: '#2d3748',
        'text-light': '#718096',
        danger: '#e53e3e',
      },
      boxShadow: {
        'soft': '9px 9px 16px rgb(163,177,198,0.6), -9px -9px 16px rgba(255,255,255, 0.5)',
        'soft-sm': '5px 5px 10px rgb(163,177,198,0.6), -5px -5px 10px rgba(255,255,255, 0.5)',
        'soft-lg': '12px 12px 24px rgb(163,177,198,0.6), -12px -12px 24px rgba(255,255,255, 0.5)',
        'soft-xl': '20px 20px 60px rgb(163,177,198,0.6), -20px -20px 60px rgba(255,255,255, 0.5)',
        'soft-inset': 'inset 6px 6px 10px 0 rgba(163,177,198, 0.7), inset -6px -6px 10px 0 rgba(255,255,255, 0.8)',
        'soft-inset-sm': 'inset 3px 3px 6px 0 rgba(163,177,198, 0.7), inset -3px -3px 6px 0 rgba(255,255,255, 0.8)',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      }
    },
  },
  plugins: [],
}
