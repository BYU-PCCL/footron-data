import { defineConfig } from 'vite';

/**
 * `base: './'` matters: Footron serves each experience from its own
 * subdirectory, so absolute asset paths would 404 on the wall.
 *
 * `build_experiences.py` reads `directories.footronStatic` from package.json
 * and takes `dist/` as the static root, so the CI build step needs no special
 * casing here.
 */
export default defineConfig({
  base: './',
  server: { port: 5173, host: true },
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 2000,
    // the wall loads from local disk; one request beats many
    assetsInlineLimit: 0
  }
});
