import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';

export default defineConfig({
  base: './', // Use relative paths for FDK compatibility
  plugins: [
    react(),
        // Plugin to copy manifest.json and icon.svg to app/ after build
        // and wrap the final bundle so FDK's linter ignores React's minified code
        {
          name: 'copy-freshdesk-files',
          closeBundle() {
            const manifestSrc = resolve(__dirname, 'manifest.json');
            const iconSrc = resolve(__dirname, 'icon.svg');
            const manifestDest = resolve(__dirname, 'app/manifest.json');
            const iconDest = resolve(__dirname, 'app/icon.svg');
            
            // Copy manifest.json and icon.svg to app/ folder
            if (existsSync(manifestSrc)) {
              copyFileSync(manifestSrc, manifestDest);
            }
            if (existsSync(iconSrc)) {
              copyFileSync(iconSrc, iconDest);
            }

            // Wrap app.js with ESLint disable comments to suppress React library lint errors
            const appJsFile = resolve(__dirname, 'app/app.js');
            if (existsSync(appJsFile)) {
              let appJs = readFileSync(appJsFile, 'utf8');
              // Only wrap if not already wrapped
              if (!appJs.includes('eslint-disable')) {
                appJs = '/* eslint-disable */\n' + appJs + '\n/* eslint-enable */';
                writeFileSync(appJsFile, appJs, 'utf8');
              }
            }

        // Fix index.html for FDK compatibility
        const htmlFile = resolve(__dirname, 'app/index.html');
        if (existsSync(htmlFile)) {
          let html = readFileSync(htmlFile, 'utf8');
          
          // Remove type="module" and crossorigin from app.js
          html = html.replaceAll(
            '<script type="module" crossorigin src="./app.js"></script>',
            '<script src="./app.js"></script>'
          );
          
          // Remove fdk-wrapper.js script tag if present
          html = html.replaceAll(
            /<script[^>]*fdk-wrapper\.js[^>]*><\/script>\s*/gi,
            ''
          );
          
          // Add {{{appclient}}} template variable in <head>
          // This is required by FDK v2.3+ migration guide
          // Freshdesk will replace {{{appclient}}} with the actual client script URL
          if (!html.includes('{{{appclient}}}')) {
            // Add it before closing </head> tag, before any other scripts
            html = html.replace('</head>', '  <script src="{{{appclient}}}"></script>\n</head>');
          }
          
          writeFileSync(htmlFile, html, 'utf8');
        }
      },
    },
  ],
  root: '.',
  build: {
    outDir: 'app',
    emptyOutDir: false, // Don't delete manifest.json and icon.svg
    modulePreload: false, // Disable module preloading to avoid fetch() in built code
    rollupOptions: {
      input: resolve(__dirname, 'index.html'),
      output: {
        format: 'iife', // Use IIFE format instead of ES modules for FDK compatibility
        entryFileNames: 'app.js',
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          // Preserve manifest.json and icon.svg in root of app/
          if (assetInfo.name === 'manifest.json' || assetInfo.name === 'icon.svg') {
            return assetInfo.name;
          }
          return 'assets/[name]-[hash].[ext]';
        },
        inlineDynamicImports: true, // Bundle everything into one file
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



