import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/server.ts'],
  outDir: 'dist',
  format: ['esm'],
  target: 'node20',
  bundle: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  minify: false,
})
