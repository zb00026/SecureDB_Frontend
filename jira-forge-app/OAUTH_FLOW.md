# OAuth Flow for Jira Forge App

This document describes the OAuth redirect flow and backend requirements.

## Flow Overview

1. User clicks "Connect with Atlassian" in the Forge panel
2. Frontend opens a popup to `https://auth.atlassian.com/authorize?...&redirect_uri=https://YOUR_BACKEND/api/jira/oauth/callback`
3. User authorizes the app
4. Atlassian redirects to `https://YOUR_BACKEND/api/jira/oauth/callback?code=REAL_OAUTH_CODE&state=...`
5. Backend receives the **real OAuth code** (not account ID)
6. Backend exchanges code for tokens via `POST https://auth.atlassian.com/oauth/token`
7. Backend redirects to a success page that sends the token to the Forge app via `postMessage`

## Backend Requirements

### 1. OAuth Callback Endpoint

**GET** `/api/jira/oauth/callback?code=XXX&state=YYY`

- Receives the redirect from Atlassian with the **real authorization code**
- Exchange the code for tokens:

```java
// Example: Exchange code for token
String tokenUrl = "https://auth.atlassian.com/oauth/token";
Map<String, String> body = new HashMap<>();
body.put("grant_type", "authorization_code");
body.put("client_id", clientId);
body.put("client_secret", clientSecret);
body.put("code", code);  // Real code from query param
body.put("redirect_uri", redirectUri);  // Must match exactly what was sent to authorize
```

- After successful exchange, redirect to the success page (see below)

### 2. Success Page

After exchanging the code, redirect the user to a page that communicates the token back to the Forge app:

**Redirect to:** `https://YOUR_BACKEND/oauth-success.html?token=ACCESS_TOKEN`

Create a static page `oauth-success.html` (or serve it from your backend):

```html
<!DOCTYPE html>
<html>
<head><title>Authentication Successful</title></head>
<body>
  <p>Authentication successful. You can close this window.</p>
  <script>
    (function() {
      const params = new URLSearchParams(location.search);
      const token = params.get('token');
      if (token && window.opener) {
        window.opener.postMessage({ type: 'oauth-success', token }, '*');
      }
      setTimeout(function() { window.close(); }, 1500);
    })();
  </script>
</body>
</html>
```

**Security note:** Passing the token in the URL is acceptable for this flow because:
- The page loads in a popup and immediately postMessages and closes
- Use HTTPS
- Consider using a short-lived one-time code instead; the success page exchanges it for the token via a backend API

### 3. Redirect URI

The `redirect_uri` sent to Atlassian must **exactly match** the one registered in your OAuth app settings:

- Format: `https://YOUR_BACKEND/api/jira/oauth/callback`
- No trailing slash
- Must be HTTPS in production

**Register the callback URL** in your Atlassian OAuth app (Developer Console → Your App → Authorization → Callback URL).

### 4. Forge Variables

Set these via `forge variables set`:

```bash
forge variables set DAM_API_BASE_URL https://your-backend.com
forge variables set DAM_OAUTH_CLIENT_ID your-atlassian-oauth-client-id
```

Create an OAuth 2.0 client at: https://developer.atlassian.com/console/myapps/

## Error Handling

If the backend receives an invalid code (e.g. account ID instead of OAuth code), return a clear error:

```java
if (code != null && code.matches("\\d+:[-a-f0-9]+")) {
    throw new SecurityException(
        "Received account ID instead of OAuth code. " +
        "Use the OAuth redirect flow: user must authorize at auth.atlassian.com"
    );
}
```

## Testing

1. Deploy the Forge app: `forge deploy`
2. Open a Database Access Request issue in Jira
3. Click "Connect with Atlassian"
4. Authorize in the popup
5. Popup closes and the panel loads with the token
