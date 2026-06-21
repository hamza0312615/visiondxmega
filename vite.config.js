import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./setupTests.js"
  },
  plugins: [react()],
  server: {
    port: 5173,
    open: true
  }
})
