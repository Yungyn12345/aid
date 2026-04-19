import type { Config } from 'tailwindcss'

export default <Partial<Config>>{
  content: [
    './app/**/*.{js,ts,vue}',
    './components/**/*.{js,ts,vue}',
    './composables/**/*.{js,ts,vue}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './utils/**/*.{js,ts}'
  ],
  theme: {
    extend: {
      colors: {
        ink: '#0d1b36',
        inkSoft: '#1e3156',
        line: '#29406f',
        mist: '#edf2ff',
        cream: '#f6f1e8',
        sand: '#dccfba',
        accent: '#74d5ff',
        coral: '#ff8f70'
      },
      fontFamily: {
        display: ['Unbounded', 'sans-serif'],
        body: ['Manrope', 'sans-serif']
      },
      boxShadow: {
        glow: '0 25px 80px rgba(116, 213, 255, 0.18)'
      },
      backgroundImage: {
        mesh: 'radial-gradient(circle at top left, rgba(116,213,255,0.22), transparent 32%), radial-gradient(circle at top right, rgba(255,143,112,0.16), transparent 22%), linear-gradient(180deg, #102247 0%, #091124 100%)'
      }
    }
  }
}
