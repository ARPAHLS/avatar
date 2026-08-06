import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Production / installer builds must not bundle local custom/ trial GIFs.
 * Dev keeps the eager glob so dropping files into custom/ still works.
 */
function stripCustomEnvsForShip() {
  const ship = process.env.AVATAR_SHIP === '1';
  return {
    name: 'avatar-strip-custom-envs',
    transform(code, id) {
      if (!ship) return null;
      const norm = id.replace(/\\/g, '/');
      if (!norm.endsWith('/config/environments.js')) return null;
      if (!code.includes('import.meta.glob')) return null;
      return {
        code: code.replace(
          /const customModules = import\.meta\.glob\([\s\S]*?\);/,
          'const customModules = {};',
        ),
        map: null,
      };
    },
  };
}

export default defineConfig({
  base: './',
  assetsInclude: ['**/*.vrm', '**/*.vrma', '**/*.gif'],
  plugins: [react(), stripCustomEnvsForShip()],
  server: {
    watch: {
      // `npm run thumbs` writes generated portraits into this directory while
      // the dev server is running. Watching it means each write invalidates the
      // module graph, reloads the generator, and starts the whole run again —
      // an endless loop that also interrupts in-flight VRM loads. These are
      // build assets; they never need hot reload.
      ignored: ['**/src/assets/avatars/thumbs/**'],
    },
  },
});
