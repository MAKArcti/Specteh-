import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
  build: {
    // @spectech/shared-types is a symlinked workspace package that ships
    // plain CommonJS; Rollup only auto-converts CJS under node_modules, and
    // pnpm's symlink resolves to a real path outside it, so it must be
    // included explicitly or named imports fail to resolve at build time.
    commonjsOptions: {
      include: [/shared-types/, /node_modules/],
    },
  },
});
