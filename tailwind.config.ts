import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        beli: {
          teal: '#00505E', // dark teal/green from screenshots
        },
      },
      fontFamily: {
        serif: ['Times New Roman', 'serif'],
      },
      boxShadow: {
        'sheet-top': '0 -4px 16px 4px rgba(0, 0, 0, 0.25)',
      },    
    },
  },
  plugins: [],
}
export default config

