import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
import { postBuildProcessing } from './build-utils.js';

export default defineConfig({
  base: './', // Use relative paths for FDK compatibility
  plugins: [
    react(),
    // Plugin to copy manifest.json and icon.svg to app/ after build
    // and wrap the final bundle so FDK's linter ignores React's minified code
    {
      name: 'copy-freshdesk-files',
      closeBundle() {
        postBuildProcessing(__dirname);
      },
    },
  ],
  root: '.',
  build: {
    outDir: 'app',
    emptyOutDir: false, // Don't delete manifest.json and icon.svg
    modulePreload: false, // Disable module preloading to avoid fetch() in built code
    rollupOptions: {
      input: resolve(__dirname, 'index.html'), // Only main app for dev mode
      output: {
        format: 'iife', // Use IIFE format instead of ES modules for FDK compatibility
        entryFileNames: 'app.js',
        inlineDynamicImports: true, // Bundle everything into one file
        assetFileNames: (assetInfo) => {
          // Preserve manifest.json, icon.svg, and shared-styles.css in root of app/
          if (assetInfo.name === 'manifest.json' || assetInfo.name === 'icon.svg' || assetInfo.name === 'shared-styles.css') {
            return assetInfo.name;
          }
          return 'assets/[name]-[hash].[ext]';
        },
      },
    },
    minify: false, // Temporarily disable minification to fix FDK coverage error
    sourcemap: false,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});
