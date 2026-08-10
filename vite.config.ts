import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000, // Forzado a usar el puerto 3000
    strictPort: false, // Si el 3000 estuviera ocupado, buscará el 3001, etc.
  }
})
