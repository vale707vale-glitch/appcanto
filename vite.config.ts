import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'
import { VitePWA } from 'vite-plugin-pwa'

// En GitHub Pages la app se publica en /<repo>/; en Netlify y en local, en /.
const repositorio = process.env.GITHUB_REPOSITORY
const nombreRepositorio = repositorio?.split('/')[1]
const esPaginaDeUsuario = nombreRepositorio?.endsWith('.github.io') ?? false
const base =
  process.env.BASE_PATH ??
  (nombreRepositorio && !esPaginaDeUsuario ? `/${nombreRepositorio}/` : '/')

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.svg', 'icons/pwa-192.png', 'icons/pwa-512.png'],
      manifest: {
        name: 'Aprende a cantar',
        short_name: 'Canta',
        description: 'Practicá afinación vocal con ejercicios y canciones.',
        lang: 'es',
        start_url: base,
        scope: base,
        display: 'standalone',
        background_color: '#020617',
        theme_color: '#020617',
        icons: [
          {
            src: `${base}icons/pwa-192.png`,
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: `${base}icons/pwa-512.png`,
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,webmanifest}'],
      },
    }),
  ],
  test: {
    include: ['src/**/*.test.ts'],
  },
})
