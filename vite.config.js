import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  
  base: '/',
  build: {
    sourcemap: mode === 'development',
    outDir: 'dist'
  },
  server: {
    historyApiFallback: true
  }
}));
