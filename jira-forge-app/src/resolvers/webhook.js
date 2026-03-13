/**
 * Forge resolver functions for DAM API integration
 * Uses shared secret + HMAC signing to secure API calls (no OAuth popup)
 */

import crypto from 'node:crypto';
import Resolver from '@forge/resolver';
import api, { fetch, route } from '@forge/api';

console.log("Resolver module loading");

const resolver = new Resolver();
console.log("Resolver instance created");

const DAM_API_PLACEHOLDER = 'https://your-dam-backend.com';

/** Get DAM API base URL (no trailing slash). Returns placeholder if not configured. */
const getDamApiUrl = () => {
  const url = (process.env.DAM_API_BASE_URL || DAM_API_PLACEHOLDER).replace(/\/$/, '');
  console.log('[Resolver] DAM_API_BASE_URL:', url === DAM_API_PLACEHOLDER.replace(/\/$/, '') ? 'NOT CONFIGURED' : 'configured');
  return url;
};

const isDamConfigured = () => getDamApiUrl() !== DAM_API_PLACEHOLDER.replace(/\/$/, '');

/** Build signed fetch options for a DAM API path. */
const buildDamRequest = (path, { accountId, userEmail, method = 'GET', body } = {}) => {
  const base = getDamApiUrl();
  const pathWithLeadingSlash = path.startsWith('/') ? path : '/' + path;
  const url = base + pathWithLeadingSlash;
  const headers = getSignedHeaders(accountId, userEmail);
  const options = { method, headers };
  if (body !== undefined && method !== 'GET') {
    options.body = typeof body === 'string' ? body : JSON.stringify(body);
  }
  return { url, options };
};

// Get shared secret for HMAC signing (must match backend)
const getBackendSecret = () => {
  const secret = process.env.BACKEND_SECRET || '';
  if (!secret) {
    throw new Error('BACKEND_SECRET is not configured. Set it using: forge variables set BACKEND_SECRET <your-secret>');
  }
  return secret;
};

// Create HMAC-SHA256 signature for request verification
const createSignature = (secret, accountId, timestamp) => {
  const payload = `${accountId}|${timestamp}`;
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
};

// Build signed headers for backend API calls
const getSignedHeaders = (accountId, userEmail) => {
  const secret = getBackendSecret();
  const timestamp = Date.now().toString();
  const signature = createSignature(secret, accountId, timestamp);
  const headers = {
    'Content-Type': 'application/json',
    'X-User-Id': accountId,
    'X-Timestamp': timestamp,
    'X-Signature': signature,
    'ngrok-skip-browser-warning': 'true',
  };
  if (userEmail) {
    headers['X-User-Email'] = userEmail;
  }
  return headers;
};

/**
 * Serialize request body for approve/reject API calls.
 */
function serializeRequestBody(body) {
  if (body == null) return '{}';
  if (typeof body === 'string') return body;
  return JSON.stringify(body);
}

/**
 * Helper function to add timeout to fetch requests
 */
const fetchWithTimeout = async (url, options, timeoutMs = 20000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    console.log(`[Resolver] Starting fetch with ${timeoutMs}ms timeout`);
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    console.log('[Resolver] Fetch completed successfully');
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeoutMs}ms. Check: ${url}`);
    }
    throw error;
  }
};

/**
 * Authenticate Forge user with DAM backend - must be called before any other API calls
 * POST /api/jira/auth with signed headers
 */
resolver.define('authenticateForgeUser', async ({ payload }) => {
  try {
    const { accountId, userEmail } = payload || {};
    if (!accountId) {
      return { success: false, error: 'accountId is required' };
    }
    if (!isDamConfigured()) {
      return { success: false, error: 'DAM_API_BASE_URL is not configured' };
    }

    const { url, options } = buildDamRequest('/api/jira/auth', { accountId, userEmail, method: 'POST' });
    console.log('[Resolver] Authenticating with backend:', url);

    const response = await fetchWithTimeout(url, options, 20000);

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      const t = errorText.trim();
      const isHtml = t.toLowerCase().startsWith('<!doctype') || t.toLowerCase().startsWith('<html');
      const message = isHtml
        ? `Authentication failed: ${response.status}. The server returned a web page instead of the API. Ensure DAM_API_BASE_URL points to your backend (e.g. https://ami.hagrids.com) and that the route /api/jira/auth exists and is reachable.`
        : `Authentication failed: ${response.status}. ${errorText.substring(0, 200)}`;
      return { success: false, error: message };
    }

    const data = await response.json();
    // Backend should return { roles: string[] } e.g. ["Accessor", "Asset Owner"]
    const roles = Array.isArray(data?.roles) ? data.roles : [];
    return { success: true, data: { ...data, roles } };
  } catch (error) {
    console.error('[Resolver] authenticateForgeUser error:', error);
    return { success: false, error: error?.message };
  }
});

/**
 * Get the issue type name for an issue (e.g. "Database Access Request")
 */
resolver.define('getIssueType', async ({ payload }) => {
  try {
    const { issueKey } = payload || {};
    if (!issueKey) return { success: false, issueType: null, error: 'issueKey is required' };
    const response = await api.asUser().requestJira(route`/rest/api/3/issue/${issueKey}?fields=issuetype`);
    const issue = await response.json();
    const issueType = issue?.fields?.issuetype?.name || null;
    return { success: true, issueType };
  } catch (error) {
    console.error('[Resolver] getIssueType error:', error);
    return { success: false, issueType: null, error: error?.message };
  }
});

/**
 * Get current user's profile from Jira REST API (myself endpoint)
 * Uses asUser() - no extra scope needed. emailAddress may be null if user hid it in profile.
 */
resolver.define('getCurrentUserEmail', async () => {
  try {
    const response = await api.asUser().requestJira(route`/rest/api/3/myself`);
    const user = await response.json();
    return {
      success: true,
      accountId: user.accountId,
      userEmail: user.emailAddress ?? null,
      displayName: user.displayName,
    };
  } catch (error) {
    console.error('[Resolver] getCurrentUserEmail error:', error);
    return { success: false, userEmail: null, error: error?.message };
  }
});

/**
 * Get available assets from DAM backend
 */
resolver.define('getAssets', async ({ payload }) => {
  const startTime = Date.now();
  console.log('[Resolver] getAssets called');

  try {
    const { accountId, userEmail } = payload || {};
    if (!accountId) throw new Error('accountId is required');
    if (!isDamConfigured()) throw new Error('DAM_API_BASE_URL is not configured');

    const { url, options } = buildDamRequest('/api/jira/assets', { accountId, userEmail, method: 'GET' });
    console.log('[Resolver] Calling backend:', url);

    const response = await fetchWithTimeout(url, options, 20000);

    const elapsed = Date.now() - startTime;
    console.log(`[Resolver] getAssets response in ${elapsed}ms, status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`Backend API error: ${response.status}. ${errorText.substring(0, 200)}`);
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error(`[Resolver] getAssets error:`, error);
    return { success: false, error: error.message };
  }
});

/**
 * Save access configuration to DAM backend
 * POST /api/jira/config – body includes jiraAccountId and tables as array
 */
resolver.define('saveAccessConfig', async ({ payload }) => {
  const startTime = Date.now();
  console.log('[Resolver] saveAccessConfig called');

  try {
    const { accountId, ...configPayload } = payload || {};
    if (!accountId) throw new Error('accountId is required');
    if (!isDamConfigured()) throw new Error('DAM_API_BASE_URL is not configured');

    const { url, options } = buildDamRequest('/api/jira/config', {
      accountId,
      userEmail: configPayload.userEmail,
      method: 'POST',
      body: configPayload,
    });
    console.log('[Resolver] Calling backend:', url);

    const response = await fetchWithTimeout(url, options, 20000);

    const elapsed = Date.now() - startTime;
    console.log(`[Resolver] saveAccessConfig response in ${elapsed}ms, status: ${response.status}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Backend API error: ${response.status}`);
    }
    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('[Resolver] saveAccessConfig error:', error);
    return { success: false, error: error.message };
  }
});

/**
 * Get access configuration for an issue
 */
resolver.define('getAccessConfig', async ({ payload }) => {
  const startTime = Date.now();
  console.log('[Resolver] getAccessConfig called');

  try {
    const { issueKey, accountId, userEmail } = payload || {};
    if (!issueKey || !accountId) throw new Error('issueKey and accountId are required');
    if (!isDamConfigured()) throw new Error('DAM_API_BASE_URL is not configured');

    const { url, options } = buildDamRequest(`/api/jira/config/${issueKey}`, { accountId, userEmail, method: 'GET' });
    console.log('[Resolver] Calling backend:', url);

    const response = await fetchWithTimeout(url, options, 20000);

    const elapsed = Date.now() - startTime;
    console.log(`[Resolver] getAccessConfig response in ${elapsed}ms, status: ${response.status}`);

    if (response.status === 404) {
      return { success: false, notFound: true };
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`Backend API error: ${response.status}. ${errorText.substring(0, 200)}`);
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error(`[Resolver] getAccessConfig error:`, error);
    return { success: false, error: error.message };
  }
});

/** PENDING FOR APPROVAL → APPROVED transition */
const TRANSITION_TO_APPROVED = ['Approved Access Request', 'Approve', 'Approved'];

/** PENDING FOR APPROVAL → REJECTED transition */
const TRANSITION_TO_REJECTED = ['Rejected Access Request', 'Reject', 'Rejected'];

/** OPEN → REQUESTED (new request) or APPROVED/REJECTED → REQUESTED (re-submission) */
const TRANSITION_TO_REQUESTED = ['Accessor Requested', 'Update Access Request', 'Requested'];

/** REQUESTED → PENDING FOR APPROVAL transition (only when asset owner found in Jira) */
const TRANSITION_TO_PENDING = ['Assign To Asset Owner', 'Pending for Approval', 'Pending for approval'];

/** Helper: find a transition by name from a list of candidates */
function findTransition(transitions, names) {
  for (const name of names) {
    const t = transitions.find(
      (t) => t.name === name || t.name.toLowerCase() === name.toLowerCase()
    );
    if (t) return t;
  }
  return null;
}

/** Helper: execute a Jira issue transition by ID */
async function executeTransition(issueKey, transitionId) {
  await api.asUser().requestJira(route`/rest/api/3/issue/${issueKey}/transitions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transition: { id: transitionId } }),
  });
}

/** Transition a Jira issue to the first matching status name (non-blocking). */
async function transitionIssueToStatus(issueKey, transitionNames, actionLabel) {
  const transitionsRes = await api.asUser().requestJira(
    route`/rest/api/3/issue/${issueKey}/transitions`
  );
  const transitions = (await transitionsRes.json()).transitions || [];
  const transition = findTransition(transitions, transitionNames);
  if (transition) {
    await executeTransition(issueKey, transition.id);
    console.log(`[Resolver] Issue ${issueKey} → "${transition.name}" after ${actionLabel}`);
  } else {
    const available = transitions.map((t) => t.name).join(', ');
    console.warn(`[Resolver] No "${actionLabel}" transition found. Available: ${available}`);
  }
}

/** Re-assign a Jira issue to the original requestor (non-blocking). */
async function reassignIssueToRequestor(issueKey, jiraRequesterId) {
  if (!jiraRequesterId) {
    console.warn('[Resolver] jiraRequesterId not available – skipping re-assignment');
    return;
  }
  await api.asUser().requestJira(route`/rest/api/3/issue/${issueKey}/assignee`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accountId: jiraRequesterId }),
  });
  console.log(`[Resolver] Issue ${issueKey} re-assigned to requestor (${jiraRequesterId})`);
}

/**
 * Shared handler for approve/reject:
 *  1. POST /api/jira/request/{id}/approve|reject to backend
 *  2. Transition the Jira issue to Approved / Rejected
 *  3. Re-assign the issue back to the requestor
 */
function createRequestActionHandler(action) {
  const actionLabel = action === 'approve' ? 'Approve' : 'Reject';
  const transitionNames = action === 'approve' ? TRANSITION_TO_APPROVED : TRANSITION_TO_REJECTED;

  return async ({ payload }) => {
    try {
      const { accessRequestId, accountId, userEmail, body, issueKey, jiraRequesterId } = payload || {};
      if (!accessRequestId || !accountId) {
        return { success: false, error: 'accessRequestId and accountId are required' };
      }
      if (!isDamConfigured()) {
        return { success: false, error: 'DAM_API_BASE_URL is not configured' };
      }

      const path = `/api/jira/request/${accessRequestId}/${action}`;
      const { url, options } = buildDamRequest(path, {
        accountId,
        userEmail,
        method: 'POST',
        body: serializeRequestBody(body),
      });

      const response = await fetchWithTimeout(url, options, 20000);
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        return { success: false, error: `${actionLabel} failed: ${response.status}. ${errorText.substring(0, 200)}` };
      }

      const data = await response.json();

      if (issueKey) {
        try {
          await transitionIssueToStatus(issueKey, transitionNames, actionLabel);
        } catch (e) {
          console.error(`[Resolver] Transition after ${action} failed:`, e?.message);
        }
        try {
          await reassignIssueToRequestor(issueKey, jiraRequesterId);
        } catch (e) {
          console.error(`[Resolver] Re-assign to requestor failed:`, e?.message);
        }
      } else {
        console.warn('[Resolver] issueKey not provided – skipping transition and re-assignment');
      }

      return { success: true, data };
    } catch (error) {
      console.error(`[Resolver] ${action}AccessRequest error:`, error);
      return { success: false, error: error?.message };
    }
  };
}

resolver.define('approveAccessRequest', createRequestActionHandler('approve'));
resolver.define('rejectAccessRequest', createRequestActionHandler('reject'));

/** Project role name that holds asset owner accounts */
const ASSET_OWNER_ROLE_NAME = 'hagrids.assetowner';

// ── Helpers for assignAndTransitionIssue ──────────────────────────────────────

async function getProjectKeyForIssue(issueKey) {
  const res = await api.asUser().requestJira(route`/rest/api/3/issue/${issueKey}?fields=project`);
  const data = await res.json();
  return data?.fields?.project?.key || null;
}

async function fetchActorEmail(actorAccountId) {
  try {
    const appRes = await api.asApp()
      .requestJira(route`/rest/api/3/user?accountId=${actorAccountId}&expand=emailAddress`);
    const appUser = await appRes.json();
    if (appUser.emailAddress) return appUser.emailAddress;
    const userRes = await api.asUser().requestJira(route`/rest/api/3/user?accountId=${actorAccountId}`);
    const u = await userRes.json();
    return u.emailAddress || null;
  } catch {
    return null;
  }
}

async function getRoleMembersData(projectKey) {
  const rolesRes = await api.asUser().requestJira(route`/rest/api/3/project/${projectKey}/role`);
  const rolesMap = await rolesRes.json();
  const roleEntry = Object.entries(rolesMap).find(
    ([name]) => name.toLowerCase() === ASSET_OWNER_ROLE_NAME.toLowerCase()
  );
  console.log(`[Resolver] roleEntry found=${!!roleEntry}`);
  if (!roleEntry) {
    console.warn(`[Resolver] Role "${ASSET_OWNER_ROLE_NAME}" not found in project ${projectKey}`);
    return { roleAccountIds: [], roleEmails: [], accountIdToEmail: {} };
  }
  const roleId = String(roleEntry[1]).split('/').pop();
  const actorsRes = await api.asUser().requestJira(
    route`/rest/api/3/project/${projectKey}/role/${roleId}`
  );
  const actorsData = await actorsRes.json();
  const userActors = (actorsData.actors || []).filter(
    (a) => a.type === 'atlassian-user-role-actor' && a.actorUser?.accountId
  );
  const roleAccountIds = userActors.map((a) => a.actorUser.accountId);
  console.log(`[Resolver] hagrids.assetowner accountIds:`, roleAccountIds);

  const emailResults = await Promise.all(
    userActors.map(async (a) => ({
      accountId: a.actorUser.accountId,
      email: await fetchActorEmail(a.actorUser.accountId),
    }))
  );
  const roleEmails = [];
  const accountIdToEmail = {};
  emailResults.forEach(({ accountId: aid, email }) => {
    if (email) { roleEmails.push(email); accountIdToEmail[aid] = email; }
  });
  console.log(`[Resolver] visible emails: ${roleEmails.length}/${roleAccountIds.length}`);
  return { roleAccountIds, roleEmails, accountIdToEmail };
}

async function resolveOwnerFromBackend(assetId, roleAccountIds, roleEmails, accountIdToEmail, accountId) {
  if (!isDamConfigured()) {
    console.warn('[Resolver] DAM_API_BASE_URL not configured – skipping asset-owner lookup');
    return { ownerAccountId: null, ownerEmail: null };
  }
  const { url, options } = buildDamRequest('/api/jira/asset-owner', {
    accountId: accountId || 'system',
    method: 'POST',
    body: { assetId, accountIds: roleAccountIds, emails: roleEmails },
  });
  const ownerRes = await fetchWithTimeout(url, options, 10000);
  console.log(`[Resolver] /api/jira/asset-owner status=${ownerRes.status}`);
  if (!ownerRes.ok) {
    const errText = await ownerRes.text().catch(() => '');
    console.warn(`[Resolver] /api/jira/asset-owner ${ownerRes.status}: ${errText.substring(0, 200)}`);
    return { ownerAccountId: null, ownerEmail: null };
  }
  const ownerData = await ownerRes.json();
  const ownerEmail = ownerData?.ownerEmail || ownerData?.email || null;
  let ownerAccountId = ownerData?.ownerAccountId || ownerData?.accountId || null;
  if (ownerEmail && !ownerAccountId) {
    const matched = Object.entries(accountIdToEmail).find(([, e]) => e === ownerEmail);
    if (matched) ownerAccountId = matched[0];
  }
  console.log(`[Resolver] Backend returned ownerEmail=${ownerEmail} ownerAccountId=${ownerAccountId}`);
  return { ownerAccountId, ownerEmail };
}

async function assignIssueToOwner(issueKey, ownerAccountId, ownerEmail) {
  let jiraUser = ownerAccountId ? { accountId: ownerAccountId } : null;
  if (!jiraUser && ownerEmail) {
    const searchRes = await api.asUser().requestJira(route`/rest/api/3/user/search?query=${ownerEmail}`);
    const users = await searchRes.json();
    jiraUser = Array.isArray(users)
      ? (users.find((u) => u.emailAddress === ownerEmail) || users[0] || null)
      : null;
    console.log(`[Resolver] Jira user found by email: accountId=${jiraUser?.accountId}`);
  }
  if (!jiraUser?.accountId) {
    console.warn(`[Resolver] No Jira user found for owner "${ownerEmail}" – skipping assignment`);
    return null;
  }
  await api.asUser().requestJira(route`/rest/api/3/issue/${issueKey}/assignee`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accountId: jiraUser.accountId }),
  });
  console.log(`[Resolver] Issue ${issueKey} assigned to ${ownerEmail} (${jiraUser.accountId})`);
  return jiraUser;
}

async function transitionToRequested(issueKey) {
  const res = await api.asUser().requestJira(route`/rest/api/3/issue/${issueKey}/transitions`);
  const available = (await res.json()).transitions || [];
  console.log(`[Resolver] Available transitions: ${available.map((t) => t.name).join(', ')}`);
  const toRequested = findTransition(available, TRANSITION_TO_REQUESTED);
  if (!toRequested) {
    return { name: null, availableNames: available.map((t) => t.name).join(', ') };
  }
  await executeTransition(issueKey, toRequested.id);
  console.log(`[Resolver] Issue ${issueKey} → "${toRequested.name}"`);
  return { name: toRequested.name, availableNames: null };
}

async function transitionToPending(issueKey, ownerAccountId, toRequestedName) {
  const res = await api.asUser().requestJira(route`/rest/api/3/issue/${issueKey}/transitions`);
  const available = (await res.json()).transitions || [];
  const toPending = findTransition(available, TRANSITION_TO_PENDING);
  if (!toPending) {
    const names = available.map((t) => t.name).join(', ');
    console.warn(`[Resolver] No PENDING transition found. Available: ${names}`);
    return { success: true, assignedTo: ownerAccountId, transitioned: toRequestedName, warning: `Moved to Requested but no "Assign To Asset Owner" transition found. Available: ${names}` };
  }
  await executeTransition(issueKey, toPending.id);
  console.log(`[Resolver] Issue ${issueKey} → "${toPending.name}"`);
  return { success: true, assignedTo: ownerAccountId, transitioned: toPending.name };
}

// ─────────────────────────────────────────────────────────────────────────────

resolver.define('assignAndTransitionIssue', async ({ payload }) => {
  const { issueKey, assetId, accountId } = payload || {};
  if (!issueKey || !assetId) {
    return { success: false, error: 'issueKey and assetId are required' };
  }
  console.log(`[Resolver] assignAndTransitionIssue start – issue=${issueKey} asset=${assetId}`);

  const projectKey = await getProjectKeyForIssue(issueKey).catch((e) => {
    console.error('[Resolver] Step 1 failed:', e?.message); return null;
  });

  const { roleAccountIds, roleEmails, accountIdToEmail } = projectKey
    ? await getRoleMembersData(projectKey).catch((e) => {
        console.error('[Resolver] Step 2 failed:', e?.message);
        return { roleAccountIds: [], roleEmails: [], accountIdToEmail: {} };
      })
    : { roleAccountIds: [], roleEmails: [], accountIdToEmail: {} };

  let { ownerAccountId, ownerEmail } = await resolveOwnerFromBackend(
    assetId, roleAccountIds, roleEmails, accountIdToEmail, accountId
  ).catch((e) => {
    console.error('[Resolver] Step 3 failed:', e?.message);
    return { ownerAccountId: null, ownerEmail: null };
  });

  if (!ownerAccountId && roleAccountIds.length > 0) {
    ownerAccountId = roleAccountIds[0];
    ownerEmail = accountIdToEmail[ownerAccountId] || null;
    console.warn(`[Resolver] Falling back to first role member: accountId=${ownerAccountId}`);
  }

  const ownerJiraUser = await assignIssueToOwner(issueKey, ownerAccountId, ownerEmail).catch((e) => {
    console.error('[Resolver] Step 4/5 failed:', e?.message); return null;
  });

  const requested = await transitionToRequested(issueKey).catch((e) => {
    console.error('[Resolver] Step 6 failed:', e?.message); return null;
  });
  if (!requested) return { success: false, error: 'Transition to Requested failed' };
  if (!requested.name) {
    return { success: true, assignedTo: ownerJiraUser?.accountId || null, warning: `Could not find Requested transition. Available: ${requested.availableNames}` };
  }

  if (!ownerJiraUser?.accountId) {
    return { success: true, assignedTo: null, transitioned: requested.name, warning: 'Owner not found in Jira. Issue moved to Requested only.' };
  }

  return transitionToPending(issueKey, ownerJiraUser.accountId, requested.name).catch((e) => {
    console.error('[Resolver] Step 7 failed:', e?.message);
    return { success: true, assignedTo: ownerJiraUser.accountId, transitioned: requested.name, warning: `Pending transition failed: ${e?.message}` };
  });
});

/**
 * Provision access when issue is approved (webhook/system call)
 * Uses "webhook" as accountId for signature - backend treats as system request
 */
resolver.define('provisionAccess', async ({ payload }) => {
  const startTime = Date.now();
  console.log('[Resolver] provisionAccess called');

  try {
    const { issueKey, issueId, approverEmail, timestamp } = payload || {};
    if (!isDamConfigured()) throw new Error('DAM_API_BASE_URL is not configured');

    const { url, options } = buildDamRequest('/api/jira/provision', {
      accountId: 'webhook',
      userEmail: approverEmail,
      method: 'POST',
      body: { issueKey, issueId, approverEmail, timestamp },
    });
    console.log('[Resolver] Calling backend:', url);

    const response = await fetchWithTimeout(url, options, 20000);

    const elapsed = Date.now() - startTime;
    console.log(`[Resolver] provisionAccess response in ${elapsed}ms, status: ${response.status}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Backend API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.success && data.damRequestId) {
      try {
        await api.asUser().requestJira(`/rest/api/3/issue/${issueKey}/comment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            body: {
              type: 'doc',
              version: 1,
              content: [{
                type: 'paragraph',
                content: [{ type: 'text', text: `Access granted. DAM Request ID: ${data.damRequestId}` }],
              }],
            },
          }),
        });
      } catch (commentError) {
        console.error('Failed to add comment:', commentError);
      }
    }

    return { success: true, data };
  } catch (error) {
    console.error(`[Resolver] provisionAccess error:`, error);
    return { success: false, error: error.message };
  }
});

export const handler = resolver.getDefinitions();
