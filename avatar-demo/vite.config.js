import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  assetsInclude: ['**/*.vrm', '**/*.vrma', '**/*.gif'],
  plugins: [react()],
});
