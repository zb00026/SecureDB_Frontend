/**
 * Custom build script to build main app and fullscreen app separately
 * This is needed because Rollup doesn't support inlineDynamicImports with multiple inputs
 */

import { build } from 'vite';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { postBuildProcessing } from './build-utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Build configuration for main app
const mainAppConfig = {
  base: './',
  plugins: [react()],
  build: {
    outDir: 'app',
    emptyOutDir: false,
    modulePreload: false,
    rollupOptions: {
      input: resolve(__dirname, 'index.html'),
      output: {
        format: 'iife',
        entryFileNames: 'app.js',
        inlineDynamicImports: true,
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'manifest.json' || assetInfo.name === 'icon.svg') {
            return assetInfo.name;
          }
          return 'assets/[name]-[hash].[ext]';
        },
      },
    },
    minify: false,
    sourcemap: false,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
};

// Build configuration for fullscreen app
const fullscreenAppConfig = {
  base: './',
  plugins: [react()],
  build: {
    outDir: 'app',
    emptyOutDir: false,
    modulePreload: false,
    rollupOptions: {
      input: resolve(__dirname, 'fullscreen.html'),
      output: {
        format: 'iife',
        entryFileNames: 'fullscreen-app.js',
        inlineDynamicImports: true,
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'fullscreen.html') {
            return 'fullscreen.html';
          }
          return 'assets/[name]-[hash].[ext]';
        },
      },
    },
    minify: false,
    sourcemap: false,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
};

// Post-build processing - now uses shared utility
function postBuild() {
  postBuildProcessing(__dirname);
}

// Build both apps sequentially
try {
  console.log('Building main app...');
  await build(mainAppConfig);
  
  console.log('Building fullscreen app...');
  await build(fullscreenAppConfig);
  
  console.log('Running post-build processing...');
  postBuild();
  
  console.log('Build complete!');
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
}
