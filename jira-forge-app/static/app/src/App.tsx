import React, { useState, useEffect, useCallback } from 'react';
import { useForgeContext } from './hooks/useForgeContext';
import { getAccessConfig, getCurrentUserEmail, authenticateForgeUser, AccessConfig, ROLES } from './hooks/useResolver';
import { AccessConfigForm } from './components/AccessConfigForm';
import { ConfigDisplay } from './components/ConfigDisplay';
import { RefreshPrompt } from './components/RefreshPrompt';
import styles from './App.module.css';

function App() {
  const { context, error: contextError, loading: contextLoading, isRefreshPromptMode } = useForgeContext();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [authComplete, setAuthComplete] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [config, setConfig] = useState<AccessConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasAccessorRole = roles.includes(ROLES.ACCESSOR);
  const hasAssetOwnerRole = roles.includes(ROLES.ASSET_OWNER);

  // Fetch user email and authenticate with backend - returns roles (Accessor, Asset Owner)
  useEffect(() => {
    if (!context?.accountId) return;
    let cancelled = false;
    const run = async () => {
      try {
        const email = await getCurrentUserEmail();
        if (cancelled) return;
        setUserEmail(email);
        const { roles: authRoles } = await authenticateForgeUser(context.accountId!, email ?? undefined);
        if (cancelled) return;
        setRoles(authRoles);
        setAuthComplete(true);
        setAuthError(null);
      } catch (err: any) {
        if (!cancelled) {
          const msg = err?.message || 'Authentication failed';
          const is404OrHtml = msg.includes('404') || msg.includes('web page instead of the API');
          setAuthError(
            is404OrHtml
              ? 'Cannot reach the backend API (404). Check that DAM_API_BASE_URL is set to your API root (e.g. https://ami.hagrids.com) and that /api/jira/auth is deployed and reachable.'
              : msg
          );
        }
      }
    };
    run();
    return () => { cancelled = true; };
  }, [context?.accountId]);

  const loadConfig = useCallback(async () => {
    if (!context?.issueKey || !context?.accountId) return;

    try {
      setLoading(true);
      setError(null);
      console.log('[App] Loading config for issue:', context.issueKey);

      const existingConfig = await getAccessConfig(context.issueKey, context.accountId, userEmail ?? undefined);

      console.log('[App] Config loaded:', existingConfig ? 'Found' : 'Not found');

      setConfig(existingConfig);
      if (existingConfig?.isLocked) {
        setShowForm(false);
      }
    } catch (err: any) {
      console.error('[App] Error loading config:', err);
      setError(err.message || 'Failed to load configuration. Check that DAM_API_BASE_URL and BACKEND_SECRET are set.');
    } finally {
      setLoading(false);
    }
  }, [context?.issueKey, context?.accountId, userEmail]);

  useEffect(() => {
    if (authComplete && context?.issueKey && context?.accountId) {
      loadConfig();
    }
  }, [authComplete, context?.issueKey, context?.accountId, loadConfig]);

  const handleConfigSuccess = (newConfig: AccessConfig) => {
    setConfig(newConfig);
    setShowForm(false);
    setError(null);
  };

  if (contextLoading) {
    return (
      <div className={styles.app}>
        <p>Loading context...</p>
      </div>
    );
  }

  if (isRefreshPromptMode) {
    return <RefreshPrompt />;
  }

  if (contextError) {
    return (
      <div className={styles.app}>
        <p className={styles.error}>{contextError}</p>
      </div>
    );
  }

  if (!context) {
    return (
      <div className={styles.app}>
        <p className={styles.error}>Unable to load context.</p>
      </div>
    );
  }

  if (!context.issueKey) {
    return (
      <div className={styles.app}>
        <p className={styles.error}>
          Unable to load issue information. Please refresh the page.
        </p>
      </div>
    );
  }

  if (!context.accountId) {
    return (
      <div className={styles.app}>
        <p className={styles.error}>
          Unable to identify user. Please ensure you are logged in to Jira.
        </p>
      </div>
    );
  }

  if (authError) {
    return (
      <div className={styles.app}>
        <h3 className={styles.heading}>Database Access Configuration</h3>
        <p className={styles.error}>{authError}</p>
        <p style={{ fontSize: '13px', color: '#666', marginTop: '8px' }}>
          You cannot configure access until authentication succeeds. Please contact your administrator.
        </p>
      </div>
    );
  }

  if (!authComplete) {
    return (
      <div className={styles.app}>
        <p>Authenticating...</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.app}>
        <p>Loading configuration...</p>
        <p style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
          If this takes too long, the backend may be unreachable. Check forge variables.
        </p>
      </div>
    );
  }

  const showConfigView = config && !showForm && (hasAccessorRole || (hasAssetOwnerRole && config.showApproveReject));
  let mainContent: React.ReactNode;
  if (showConfigView) {
    mainContent = (
      <>
        <ConfigDisplay
          config={config}
          showApproveReject={config.showApproveReject}
          accessRequestId={config.damRequestId}
          accountId={context.accountId}
          userEmail={userEmail ?? undefined}
          issueKey={context.issueKey}
          issueId={context.issueId}
          onApproveRejectSuccess={loadConfig}
        />
        {hasAccessorRole && config.jiraRequesterId === context?.accountId && (
          <button
            className={styles.button}
            onClick={() => setShowForm(true)}
          >
            Update Configuration
          </button>
        )}
      </>
    );
  } else if (showForm) {
    mainContent = (
      <AccessConfigForm
        issueKey={context.issueKey}
        issueId={context.issueId || ''}
        userEmail={userEmail || context.accountId}
        accountId={context.accountId}
        initialConfig={config ?? undefined}
        onSuccess={handleConfigSuccess}
        onCancel={() => setShowForm(false)}
      />
    );
  } else if (hasAccessorRole) {
    mainContent = (
      <>
        <p>No access configuration found. Configure database access for this issue.</p>
        <button
          className={styles.button}
          onClick={() => setShowForm(true)}
        >
          Configure Access
        </button>
      </>
    );
  } else {
    mainContent = (
      <p>You cannot set database access configuration. Only users with the Accessor role can request access.</p>
    );
  }

  return (
    <div className={styles.app}>
      <h3 className={styles.heading}>Database Access Configuration</h3>

      {error && <div className={styles.error}>{error}</div>}

      {mainContent}
    </div>
  );
}

export default App;
