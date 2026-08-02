import { defineConfig } from 'vite';

export default defineConfig({
  // Relative asset paths so the build can be dropped on any static host,
  // including a project subdirectory.
  base: './',
  build: {
    target: 'es2022',
  },
});
