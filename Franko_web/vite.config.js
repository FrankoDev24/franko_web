import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/',
  build: {
    outDir: 'dist', // 👈 Ensure this matches Amplify build config
  },
  plugins: [react()],
})
