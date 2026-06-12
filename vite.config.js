import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/farmacia-system/', // 👈 OBLIGATORIO: es el nombre de tu repositorio
  build: {
    chunkSizeWarningLimit: 1000 // 👈 Esto quita el aviso del tamaño, no importa
  }
})