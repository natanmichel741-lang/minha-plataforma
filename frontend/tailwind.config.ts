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
        sidebar: '#0f1117',
        'sidebar-hover': '#1a1d27',
        'sidebar-active': '#1e2235',
        primary: '#6366f1',
        'primary-dark': '#4f46e5',
      },
    },
  },
  plugins: [],
}
export default config
