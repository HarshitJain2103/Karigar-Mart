// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path" // <-- 1. ADD THIS LINE

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // v-- 2. ADD THIS ENTIRE 'resolve' BLOCK v--
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    allowedHosts: ['.ngrok-free.app'],
  },
})