# Quick Start Guide - Jira Forge App

## Prerequisites

1. **Node.js** (v18 or higher)
2. **Atlassian Account** with Jira Cloud access
3. **Forge CLI** installed globally

## Step-by-Step Setup

### 1. Install Forge CLI

```bash
npm install -g @forge/cli
```

Verify installation:
```bash
forge --version
```

### 2. Login to Forge

```bash
forge login
```

This opens a browser window for Atlassian authentication.

**Important:** 
- `forge login` uses your **Atlassian account** (developer account), not your Jira admin account
- This account is used to register and manage Forge apps
- You can use any Atlassian account (personal or organization)
- If you don't have an Atlassian account, create one at https://id.atlassian.com/signup

### 3. Navigate to App Directory

```bash
cd jira-forge-app
```

### 4. Register Your App

```bash
forge register
```

This will:
- Create a new app in your Atlassian account
- Update `manifest.yml` with your app ID
- Set up the app in Forge

**Important:** Save the app ID that's displayed - you'll need it later.

### 5. Install Dependencies

```bash
npm install
```

### 6. Configure Environment Variables

**For Development (ngrok):**
```bash
forge variables set DAM_API_BASE_URL https://inerasable-lucienne-gratuitously.ngrok-free.dev
forge variables set DAM_OAUTH_CLIENT_ID your-atlassian-oauth-client-id
```

**For Production:**
```bash
forge variables set DAM_API_BASE_URL https://ami.hagrids.com
forge variables set DAM_OAUTH_CLIENT_ID your-atlassian-oauth-client-id
```

**OAuth Client ID:** Create an OAuth 2.0 client at https://developer.atlassian.com/console/myapps/ and use the client ID. The app uses the OAuth redirect flow; see `OAUTH_FLOW.md` for backend requirements.

**View current variables:**
```bash
forge variables list
```

**Note:** The `.env` file is only for local reference. Forge apps use `forge variables set` to configure environment variables in the deployed app.

### 7. Build the App

```bash
npm run build
```

### 8. Deploy to Development

```bash
forge deploy
```

### 9. Install in Your Jira Instance

```bash
forge install
```

You'll be prompted to:
1. Select your Jira site
2. Confirm installation

**Important:**
- You need **Jira Site Admin** access to install the app
- The account used for `forge install` must have admin permissions in the target Jira instance
- This is different from the account used for `forge login`
- If you don't have admin access, ask your Jira administrator to install the app

### 10. Test the App

1. Go to your Jira instance
2. Create or open any issue
3. Look for "Database Access Configuration" panel on the right side
4. Click "Configure Access" button
5. Fill out the form and save

## Development Workflow

### Local Development with Tunnel

```bash
# Terminal 1: Start tunnel (keeps connection to Jira)
forge tunnel

# Terminal 2: Make changes, then deploy
forge deploy
```

The tunnel allows you to test locally while connected to your Jira instance.

### View Logs

```bash
forge logs
```

### Update Environment Variables

```bash
forge variables set VARIABLE_NAME value
forge variables list
```

### Uninstall App

```bash
forge uninstall
```

## Troubleshooting

### App not appearing in Jira

1. Check app is installed: `forge install`
2. Verify app is enabled in Jira Admin → Apps → Manage apps
3. Check browser console for errors
4. Review logs: `forge logs`

### API calls failing

1. Verify environment variables are set: `forge variables list`
2. Check backend API is accessible
3. Verify CORS is enabled on backend
4. Check API token is valid
5. Review function logs: `forge logs --function dam-api-handler`

### Build errors

1. Check Node.js version: `node --version` (should be 18+)
2. Clear node_modules and reinstall: `rm -rf node_modules && npm install`
3. Check Forge CLI version: `forge --version`
4. Review build output for specific errors

## Next Steps

1. **Configure Custom Issue Type** in Jira (see `JIRA_FORGE_APP_SETUP.md`)
2. **Set up Workflow** with approval states
3. **Test Webhook** by approving an issue
4. **Configure Backend** to handle webhook events
5. **Deploy to Production** when ready

## Production Deployment

1. **Build:**
   ```bash
   npm run build
   ```

2. **Deploy to production:**
   ```bash
   forge deploy --environment production
   ```

3. **Set production environment variables:**
   ```bash
   forge variables set DAM_API_BASE_URL https://ami.hagrids.com
   forge variables set DAM_API_TOKEN your-prod-api-token-here
   ```

4. **Submit to Marketplace:**
   - Go to https://developer.atlassian.com/console/myapps/
   - Select your app
   - Click "Submit for review"
   - Complete submission form

## Support

- Forge Documentation: https://developer.atlassian.com/platform/forge/
- Forge Community: https://community.developer.atlassian.com/
- Forge CLI Help: `forge --help`
