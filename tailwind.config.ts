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
        'vb-bg':     '#06060e',
        'vb-bg2':    '#0c0c1d',
        'vb-bg3':    '#10101f',
        'vb-indigo': '#6366f1',
        'vb-purple': '#a855f7',
        'vb-cyan':   '#22d3ee',
        'vb-green':  '#10b981',
        'vb-text':   '#f8fafc',
        'vb-muted':  '#64748b',
        'vb-muted2': '#94a3b8',
      },
      fontFamily: {
        inter:  ['var(--font-inter)', 'sans-serif'],
        space:  ['var(--font-space)', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config
