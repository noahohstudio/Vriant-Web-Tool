import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// `base: './'` keeps asset paths relative so the build can be hosted from any sub-path (e.g. GitHub Pages).
export default defineConfig({
  plugins: [react()],
  base: './',
});
