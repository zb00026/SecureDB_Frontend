/**
 * Full Screen Query App Entry Point
 * This version reads data from sessionStorage and renders QueryApp in full screen
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { QueryApp } from './components/QueryApp';

function initializeFullScreenApp() {
  const container = document.getElementById('root');
  
  // Get data from URL parameters first (most reliable), then fallback to sessionStorage
  let appData = null;
  
  try {
    // Try to get data from URL parameters
    const urlParams = new URLSearchParams(globalThis.location.search);
    const urlData = urlParams.get('data');
    
    if (urlData) {
      appData = JSON.parse(decodeURIComponent(urlData));
      console.log('[Hagrids] Loaded data from URL parameters');
    } else {
      // Fallback to sessionStorage
      const storedData = sessionStorage.getItem('hagrids_query_app_data');
      if (storedData) {
        appData = JSON.parse(storedData);
        console.log('[Hagrids] Loaded data from sessionStorage');
      }
    }
    
    // Validate data and check timestamp
    if (appData) {
      // Check if data is not too old (30 minutes - more lenient)
      const maxAge = 30 * 60 * 1000; // 30 minutes
      if (appData.timestamp && Date.now() - appData.timestamp > maxAge) {
        console.warn('[Hagrids] Data expired');
        appData = null;
        sessionStorage.removeItem('hagrids_query_app_data');
      }
      
      // Validate required fields
      if (!appData.apiBaseUrl || !appData.secretKey || !appData.freshdeskUser) {
        console.warn('[Hagrids] Missing required fields in data');
        appData = null;
      }
    }
  } catch (error) {
    console.error('[Hagrids] Failed to read data:', error);
    appData = null;
  }

  if (!appData?.apiBaseUrl || !appData?.secretKey || !appData?.freshdeskUser) {
    container.innerHTML = `
      <div style="padding: 40px; text-align: center; max-width: 600px; margin: 100px auto; background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <h2 style="margin-bottom: 20px; color: #d32f2f;">⚠️ Session Expired</h2>
        <p style="margin-bottom: 20px; color: #666; line-height: 1.6;">
          The full screen session has expired or the data is missing. 
          Please close this window and open it again from the Freshdesk app.
        </p>
        <button 
          onclick="window.close()" 
          style="padding: 10px 20px; background: #1976d2; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; font-weight: 600;"
        >
          Close Window
        </button>
      </div>
    `;
    return;
  }

  // Render the app
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <QueryApp
        apiBaseUrl={appData.apiBaseUrl}
        secretKey={appData.secretKey}
        freshdeskUser={appData.freshdeskUser}
        client={null} // Not needed for full screen version
      />
    </React.StrictMode>
  );
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeFullScreenApp);
} else {
  initializeFullScreenApp();
}
