import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import { visualizer } from 'rollup-plugin-visualizer';

const packageNameFromId = (id: string) => {
  const normalizedId = id.split('\\').join('/');
  const modulesIndex = normalizedId.lastIndexOf('/node_modules/');

  if (modulesIndex === -1) {
    return null;
  }

  const packagePath = normalizedId.slice(modulesIndex + '/node_modules/'.length);
  const segments = packagePath.split('/');

  if (!segments[0]) {
    return null;
  }

  return segments[0].startsWith('@') ? `${segments[0]}/${segments[1]}` : segments[0];
};

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  const shouldAnalyze = env.ANALYZE === 'true';
  return {
    plugins: [
      react(),
      tailwindcss(),
      shouldAnalyze
        ? visualizer({
            filename: 'dist/bundle-analysis.html',
            gzipSize: true,
            brotliSize: true,
            template: 'treemap',
          })
        : null,
    ].filter(Boolean),
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) {
              return undefined;
            }

            const packageName = packageNameFromId(id);

            if (!packageName) {
              return undefined;
            }

            if (
              packageName === 'firebase' ||
              packageName.startsWith('@firebase/') ||
              packageName === 'idb' ||
              packageName === 'cookie' ||
              packageName === 'set-cookie-parser'
            ) {
              return 'firebase';
            }

            if (
              packageName === 'motion' ||
              packageName === 'framer-motion' ||
              packageName.startsWith('motion-')
            ) {
              return 'motion';
            }

            if (packageName === 'react-router-dom' || packageName === 'react-router') {
              return 'router';
            }

            if (packageName === 'react' || packageName === 'react-dom' || packageName === 'scheduler') {
              return 'react-vendor';
            }

            if (packageName === 'lucide-react') {
              return 'icons';
            }

            if (packageName === 'clsx' || packageName === 'tailwind-merge') {
              return 'ui-utils';
            }

            return undefined;
          },
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
