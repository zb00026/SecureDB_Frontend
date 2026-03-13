import { useEffect, useState } from 'react';
import { view } from '@forge/bridge';

export interface ForgeContext {
  issueKey?: string;
  issueId?: string;
  accountId?: string;
  userEmail?: string;
}

const CONTEXT_TIMEOUT_MS = 15000;

export interface UseForgeContextResult {
  context: ForgeContext | null;
  error: string | null;
  loading: boolean;
  /** True when loaded in the "Show Database Access Config" issue action modal */
  isRefreshPromptMode?: boolean;
}

export function useForgeContext(): UseForgeContextResult {
  const [context, setContext] = useState<ForgeContext | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshPromptMode, setRefreshPromptMode] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    setLoading(true);

    const timeoutId = setTimeout(() => {
      if (!cancelled) {
        setError('Context loading timed out. Try refreshing the page or reopening the panel.');
        setLoading(false);
      }
    }, CONTEXT_TIMEOUT_MS);

    console.log('[useForgeContext] Getting context...');
    view.getContext()
      .then((ctx: any) => {
        if (cancelled) return;
        clearTimeout(timeoutId);
        console.log('[useForgeContext] Context received:', ctx);
        const extensionType = ctx.extension?.type || ctx.type;
        const isRefreshPromptMode = extensionType === 'jira:issueAction';
        const forgeContext: ForgeContext = {
          issueKey: ctx.extension?.issue?.key || ctx.platformContext?.issueKey,
          issueId: ctx.extension?.issue?.id || ctx.platformContext?.issueId,
          accountId: ctx.accountId || ctx.extension?.accountId,
          userEmail: ctx.user?.email || ctx.account?.email,
        };
        console.log('[useForgeContext] Parsed context:', forgeContext, 'isRefreshPromptMode:', isRefreshPromptMode);
        setContext(forgeContext);
        setLoading(false);
        setRefreshPromptMode(isRefreshPromptMode);
      })
      .catch((err: any) => {
        if (cancelled) return;
        clearTimeout(timeoutId);
        console.error('[useForgeContext] Error getting context:', err);
        setError(err?.message || 'Failed to load Jira context');
        setContext(null);
        setLoading(false);
      });

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, []);

  return { context, error, loading, isRefreshPromptMode: refreshPromptMode };
}
