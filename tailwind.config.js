/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './app/**/*.{vue,js,ts}',
    './components/**/*.{vue,js,ts}',
    './composables/**/*.{js,ts}',
    './layouts/**/*.{vue,js,ts}',
    './pages/**/*.{vue,js,ts}',
    './plugins/**/*.{js,ts}',
    './stores/**/*.{js,ts}',
    './server/**/*.{js,ts}',
  ],

  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#1B2E4C',
          dark: '#142238',
          yellow: '#FCD95A',
          muted: '#DFDED9',
        },
      },

      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },

  plugins: [],
}