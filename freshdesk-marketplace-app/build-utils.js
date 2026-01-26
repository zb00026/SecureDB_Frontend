/**
 * Shared build utilities for Freshdesk app
 * Extracted from vite.config.js and build.js to avoid duplication
 */

import { resolve } from 'node:path';
import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';

/**
 * Wrap JavaScript file with ESLint disable comments
 */
export function wrapWithEslintDisable(filePath) {
  if (existsSync(filePath)) {
    let content = readFileSync(filePath, 'utf8');
    if (!content.includes('eslint-disable')) {
      content = '/* eslint-disable */\n' + content + '\n/* eslint-enable */';
      writeFileSync(filePath, content, 'utf8');
    }
  }
}

/**
 * Fix HTML file for FDK compatibility
 */
export function fixHtmlForFdk(htmlFilePath, scriptName) {
  if (!existsSync(htmlFilePath)) {
    return;
  }

  let html = readFileSync(htmlFilePath, 'utf8');
  
  // Remove type="module" and crossorigin from script
  html = html.replaceAll(
    new RegExp(`<script[^>]*type="module"[^>]*src="[^"]*${scriptName}[^"]*"[^>]*></script>`, 'gi'),
    `<script src="./${scriptName}"></script>`
  );
  
  // Remove fdk-wrapper.js script tag if present (only for index.html)
  if (scriptName === 'app.js') {
    html = html.replaceAll(
      /<script[^>]*fdk-wrapper\.js[^>]*><\/script>\s*/gi,
      ''
    );
    
    // Add {{{appclient}}} template variable in <head>
    if (!html.includes('{{{appclient}}}')) {
      html = html.replace('</head>', '  <script src="{{{appclient}}}"></script>\n</head>');
    }
  }
  
  writeFileSync(htmlFilePath, html, 'utf8');
}

/**
 * Copy manifest, icon, and shared CSS files
 */
export function copyManifestFiles(__dirname) {
  const manifestSrc = resolve(__dirname, 'manifest.json');
  const iconSrc = resolve(__dirname, 'icon.svg');
  const cssSrc = resolve(__dirname, 'shared-styles.css');
  const manifestDest = resolve(__dirname, 'app/manifest.json');
  const iconDest = resolve(__dirname, 'app/icon.svg');
  const cssDest = resolve(__dirname, 'app/shared-styles.css');
  
  if (existsSync(manifestSrc)) {
    copyFileSync(manifestSrc, manifestDest);
  }
  if (existsSync(iconSrc)) {
    copyFileSync(iconSrc, iconDest);
  }
  if (existsSync(cssSrc)) {
    copyFileSync(cssSrc, cssDest);
  }
}

/**
 * Post-build processing for Freshdesk app
 */
export function postBuildProcessing(__dirname) {
  // Copy manifest and icon files
  copyManifestFiles(__dirname);

  // Wrap app.js with ESLint disable comments
  wrapWithEslintDisable(resolve(__dirname, 'app/app.js'));

  // Wrap fullscreen-app.js with ESLint disable comments
  wrapWithEslintDisable(resolve(__dirname, 'app/fullscreen-app.js'));

  // Fix index.html for FDK compatibility
  fixHtmlForFdk(resolve(__dirname, 'app/index.html'), 'app.js');

  // Fix fullscreen.html for production build
  fixHtmlForFdk(resolve(__dirname, 'app/fullscreen.html'), 'fullscreen-app.js');
}
