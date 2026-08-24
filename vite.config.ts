import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {fileURLToPath} from 'url';
import {defineConfig} from 'vite';

const projectRoot = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig(() => {
  const mobileDevHost = process.env.TAURI_DEV_HOST;

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(projectRoot, '.'),
      },
    },
    server: {
      host: mobileDevHost || '127.0.0.1',
      strictPort: true,
      // File watching can be disabled in constrained development environments.
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      hmr: mobileDevHost
        ? {
            protocol: 'ws',
            host: mobileDevHost,
            port: 3001,
          }
        : process.env.DISABLE_HMR !== 'true',
    },
  };
});
