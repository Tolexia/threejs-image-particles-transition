import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import glsl from 'vite-plugin-glsl'


// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    glsl()
  ],
  build:
  {
      outDir: './build', // Output in the build/ folder
      emptyOutDir: true, // Empty the folder first
      sourcemap: true // Add sourcemap
  },
})
