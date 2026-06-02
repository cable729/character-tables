import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/** GitHub Pages project site: https://cable729.github.io/character-tables/ */
const pagesBase = '/character-tables/'

export default defineConfig(({ mode }) => ({
  base:
    mode === 'production' && process.env.GITHUB_PAGES === 'true'
      ? pagesBase
      : '/',
  plugins: [react(), tailwindcss()],
}))
