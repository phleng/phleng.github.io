module.exports = {
  purge: {
    enabled: true,
    mode: 'all',
    preserveHtmlElements: false,
    content: ['./src/*.html', './build/build.js', './build/index.html'],
  },
  darkMode: false,
  theme: {
    extend: {
      colors: {
        red: '#660000',
      },
    }
  },
  variants: {
    extend: {},
  },
  plugins: [],
}
