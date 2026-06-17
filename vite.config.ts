/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Homepage is served at the domain root (threadwick.com). The Studio lives at
// /studio via a Vercel rewrite (see vercel.json), so this build always uses base '/'.
export default defineConfig({
  base: '/',
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    // No vendor chunk-splitting: the production build is prerendered to fully
    // static HTML + CSS and the client JS is stripped (see scripts/prerender.mjs),
    // so the bundle the client build emits here is only used to extract the CSS.
    // That bundle is thrown away, so its size doesn't matter — silence the warning.
    chunkSizeWarningLimit: Infinity,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/setupTests.ts',
    css: false,
  },
});
