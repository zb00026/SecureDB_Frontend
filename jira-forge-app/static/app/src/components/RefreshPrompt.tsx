import React from 'react';
import { router } from '@forge/bridge';
import styles from './RefreshPrompt.module.css';

/**
 * Shown when user opens the "Show Database Access Config" issue action.
 * Jira only re-evaluates displayConditions on page load, so after changing
 * issue type to "Database Access Request", the panel won't appear until refresh.
 */
export function RefreshPrompt() {
  const handleRefresh = () => {
    router.reload();
  };

  return (
    <div className={styles.prompt}>
      <p>
        If you changed the issue type to <strong>Database Access Request</strong>,
        click below to refresh the page. The Database Access Configuration panel
        will then appear in the right sidebar.
      </p>
      <button className={styles.button} onClick={handleRefresh}>
        Refresh page
      </button>
    </div>
  );
}
