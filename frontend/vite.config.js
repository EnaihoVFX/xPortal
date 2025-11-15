import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true
  },
  build: {
    rollupOptions: {
      onwarn(warning, warn) {
        // Suppress ethers v6 warnings about providers
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE' || 
            warning.message?.includes('providers')) {
          return
        }
        warn(warning)
      }
    }
  }
})


