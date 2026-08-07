import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Local `custom/` trial media is contributor-only and must never reach a
 * production bundle — `build`, `desktop` and `dist:win` all drop it. The dev
 * server keeps the eager glob so dropping files into custom/ still works; set
 * AVATAR_INCLUDE_CUSTOM=1 to keep them in a build on purpose.
 * @param {boolean} includeCustom
 */
function stripCustomEnvs(includeCustom) {
  return {
    name: 'avatar-strip-custom-envs',
    transform(code, id) {
      if (includeCustom) return null;
      const norm = id.replace(/\\/g, '/');
      if (!norm.endsWith('/config/environments.js')) return null;
      if (!code.includes('import.meta.glob')) return null;
      const stripped = code.replace(
        /const customModules = import\.meta\.glob\([\s\S]*?\);/,
        'const customModules = {};',
      );
      // A silent no-op here would quietly ship every file in custom/, so a
      // rename or reformat of the glob must break the build, not the embargo.
      if (stripped === code) {
        this.error(
          'avatar-strip-custom-envs: the customModules glob in config/environments.js no longer ' +
            'matches this plugin, so custom/ media would be bundled. Update the pattern.',
        );
      }
      return { code: stripped, map: null };
    },
  };
}

export default defineConfig(({ command }) => {
  // `serve` is the dev server; anything that emits a bundle drops custom/.
  const includeCustom = command === 'serve' || process.env.AVATAR_INCLUDE_CUSTOM === '1';
  return {
    base: './',
    assetsInclude: ['**/*.vrm', '**/*.vrma', '**/*.gif'],
    plugins: [react(), stripCustomEnvs(includeCustom)],
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
  };
});
