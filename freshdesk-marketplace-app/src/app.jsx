/**
 * Freshdesk Marketplace App Entry Point
 * This is a minimal standalone app that uses Hagrids backend API
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { QueryApp } from './components/QueryApp';



// Listen for postMessage from FDK or parent window
globalThis.addEventListener('message', (event) => {
  console.log('[Hagrids] Received postMessage:', event.data, 'from:', event.origin);
  if (event.data && event.data.type === 'FDK_READY' && event.data.app) {
    console.log('[Hagrids] FDK app received via postMessage');
    globalThis.app = event.data.app;
  }
  // Also check if parent sends app object
  if (event.data && event.data.app && typeof event.data.app.initialized === 'function') {
    console.log('[Hagrids] App object received via postMessage');
    globalThis.app = event.data.app;
  }
});

// Also check parent window for app object (if same origin or accessible)
function checkParentWindow() {
  try {
    if (globalThis.parent && globalThis.parent !== globalThis) {
      if (globalThis.parent.app && typeof globalThis.parent.app.initialized === 'function') {
        console.log('[Hagrids] Found app in parent window');
        globalThis.app = globalThis.parent.app;
        return true;
      }
    }
  } catch (e) {
    console.log('[Hagrids] Error checking parent window:', e);
  }
  return false;
}

// According to FDK v2.3+ migration guide:
// - The {{{appclient}}} script tag is injected by Freshdesk
// - The app object should be available globally after the script loads
// - We should wait for the app object to be available

// Wait for both DOM and FDK to be ready
let retryCount = 0;
const MAX_RETRIES = 50;

function initializeApp() {
  const container = document.getElementById('root');
  
  console.log('[Hagrids] initializeApp called, retry:', retryCount);
  
  // Show loading state
  if (container) {
    container.innerHTML = `<div style="padding: 20px; text-align: center;">
      <div>Loading Freshdesk SDK...</div>
      <div style="font-size: 11px; color: #666; margin-top: 5px;">Retry: ${retryCount}/${MAX_RETRIES}</div>
    </div>`;
  }

  // Check if FDK's app object exists (FDK v2.3+ uses global 'app' object)
  // The {{{appclient}}} script tag injects this automatically
  let fdkApp = null;
  if (app !== undefined) {
    fdkApp = app;
  } else if (globalThis.app !== undefined) {
    fdkApp = globalThis.app;
  }

  if (!fdkApp || typeof fdkApp.initialized !== 'function') {
    retryCount++;
    if (retryCount < MAX_RETRIES) {
      // The {{{appclient}}} script should load the app object
      // Wait a bit longer for it to be available
      console.log(`[Hagrids] Waiting for FDK app object... (${retryCount}/${MAX_RETRIES})`);
      setTimeout(initializeApp, 500);
    } else {
      console.error('[Hagrids] FDK app object not found after max retries');
      console.error('[Hagrids] Available globals:', {
        'typeof app': typeof app,
        'typeof globalThis.app': typeof globalThis.app,
        'globalThis.FreshworksWidget': typeof globalThis.FreshworksWidget
      });
      renderError('Freshdesk SDK (FDK) failed to load. Please ensure:<br/>1. FDK server is running (`fdk run`)<br/>2. You are accessing Freshdesk with `?dev=true` parameter<br/>3. The {{{appclient}}} script tag is present in index.html<br/>4. Check browser console for errors');
    }
    return;
  }

  startApp(fdkApp);
}

function startApp(fdkApp) {
  console.log('[Hagrids] Starting app with FDK:', fdkApp);

  // Initialize Freshworks SDK
  fdkApp.initialized()
    .then(function(client) {
      console.log('[Hagrids] app.initialized() success, got client');
      
      // Get installation parameters
      return client.iparams.get('hagrids_api_url').then(function(iparams) {
        console.log('[Hagrids] Got iparams:', iparams);
        const apiBaseUrl = iparams.hagrids_api_url;
        
        if (!apiBaseUrl) {
          renderError('Hagrids API URL not configured. Please configure it at http://localhost:10001/custom_configs');
          return;
        }

        console.log('[Hagrids] API URL:', apiBaseUrl);

        // Get current user from Freshdesk
        return client.data.get('loggedInUser').then(function(data) {
          console.log('[Hagrids] Got loggedInUser data:', data);
          
          // Validate that we got the user data
          if (!data || !data.loggedInUser) {
            throw new Error('Failed to get logged-in user data from Freshdesk');
          }
          
          // Email is nested in contact object
          const email = data.loggedInUser.contact?.email;
          const name = data.loggedInUser.contact?.name;
          
          if (!email) {
            throw new Error('User email is not available. Please ensure you are logged into Freshdesk.');
          }
          
          const freshdeskUser = {
            email: email,
            name: name || email.split('@')[0], // Fallback to email prefix if name not available
          };

          console.log('[Hagrids] Rendering app for user:', freshdeskUser.email);
          // Render the app
          renderApp(apiBaseUrl, freshdeskUser, client);
        });
      });
    })
    .catch(function(error) {
      console.error('[Hagrids] Freshworks SDK error:', error);
      renderError('Failed to initialize app: ' + (error.message || JSON.stringify(error)));
    });
}

function renderApp(apiBaseUrl, freshdeskUser, client) {
  const container = document.getElementById('root');
  const root = createRoot(container);

  root.render(
    <React.StrictMode>
      <QueryApp
        apiBaseUrl={apiBaseUrl}
        freshdeskUser={freshdeskUser}
        client={client}
      />
    </React.StrictMode>
  );
}

function renderError(message) {
  const container = document.getElementById('root');
  const div = document.createElement('div');
  div.innerHTML = `
    <div style="padding: 20px; color: #d32f2f; background: #fff; margin: 10px; border-radius: 4px; border: 1px solid #ffcdd2;">
      <h3 style="margin-bottom: 10px;">Error</h3>
      <div style="font-size: 13px;">${message}</div>
    </div>
  `;
  container.innerHTML = '';
  container.appendChild(div);
}

// Wait for FDK to potentially inject scripts, then start
function waitForFdkInjection() {
  // Check if parent window has injected anything
  checkParentWindow();
  
  // Wait a bit for FDK to inject scripts
  setTimeout(() => {
    // Check all script tags to see if FDK injected anything
    const scripts = Array.from(document.scripts);
    console.log('[Hagrids] All scripts after wait:', scripts.map(s => ({
      src: s.src,
      text: s.textContent.substring(0, 100)
    })));
    
    // Check if app object exists now
    if (app !== undefined && app.initialized) {
      console.log('[Hagrids] App object found after wait');
      startApp(app);
    } else {
      // Start normal initialization
      initializeApp();
    }
  }, 1000); // Wait 1 second for FDK injection
}

// Start initialization
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', waitForFdkInjection);
} else {
  waitForFdkInjection();
}
