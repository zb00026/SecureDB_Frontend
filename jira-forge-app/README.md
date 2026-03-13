# Hagrids Jira Forge App

This is a Jira Forge app that integrates Hagrids Database Access Management (DAM) with Jira. It allows users to configure database access requests directly from Jira issues.

## Architecture

This app uses **Atlassian Forge**, which is:
- Serverless (runs on Atlassian's infrastructure)
- Uses Forge UI components
- Connects to your DAM backend API
- Handles Jira webhooks for approval events

## Prerequisites

1. **Node.js** (v18 or higher)
2. **Forge CLI** - Install globally:
   ```bash
   npm install -g @forge/cli
   ```

3. **Atlassian Developer Account** - For `forge login` and app management
   - Create free at https://id.atlassian.com/signup
   - Any Atlassian account works (personal or organization)
   - **Note:** This is NOT your Jira admin account
4. **Jira Site Admin Access** - For `forge install` and testing
   - You need admin permissions in the target Jira instance
   - Can use free Jira Cloud site for testing: https://www.atlassian.com/try/cloud/free
   - **Note:** This is your Jira admin account (different from developer account)

## Project Structure

```
jira-forge-app/
├── manifest.yml          # Forge app manifest
├── src/
│   ├── index.jsx        # Main app UI component
│   └── resolvers/
│       └── webhook.js   # Backend functions (API calls)
├── package.json
└── README.md
```

## Development Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Login to Forge:**
   ```bash
   forge login
   ```
   **Important:** Use your **Atlassian developer account** (any Atlassian account). This is NOT your Jira admin account.

3. **Register your app:**
   ```bash
   forge register
   ```
   This will create a new app in your Atlassian account and update `manifest.yml` with your app ID.

4. **Set environment variables:**
   
   Forge uses environment variables set via the CLI. Set them for your environment:
   
   **For Development (ngrok):**
   ```bash
   forge variables set DAM_API_BASE_URL https://inerasable-lucienne-gratuitously.ngrok-free.dev
   forge variables set DAM_API_TOKEN your-dev-api-token
   ```
   
   **For Production:**
   ```bash
   forge variables set DAM_API_BASE_URL https://ami.hagrids.com
   forge variables set DAM_API_TOKEN your-prod-api-token
   ```
   
   **Note:** The `.env` file is only for local reference. Forge apps use `forge variables set` to configure environment variables in the deployed app.

5. **Build the app:**
   ```bash
   npm run build
   ```

6. **Deploy to development:**
   ```bash
   forge deploy
   ```

7. **Install in your Jira instance:**
   ```bash
   forge install
   ```

8. **Tunnel for local development:**
   ```bash
   forge tunnel
   ```
   This allows you to test locally while connected to your Jira instance.

## Configuration

### Environment Variables

Set these using `forge variables set` command:

- `DAM_API_BASE_URL` - Your DAM backend API base URL
  - **Development:** `https://inerasable-lucienne-gratuitously.ngrok-free.dev`
  - **Production:** `https://ami.hagrids.com`
- `DAM_API_TOKEN` - API token for authenticating with DAM backend

**Switching between environments:**
- To switch to development: `forge variables set DAM_API_BASE_URL https://inerasable-lucienne-gratuitously.ngrok-free.dev`
- To switch to production: `forge variables set DAM_API_BASE_URL https://ami.hagrids.com`
- View current variables: `forge variables list`

### Custom Issue Type Setup

1. In Jira, create a custom issue type: **"Database Access Request"**
2. Add custom fields:
   - `Asset ID` (Text field)
   - `Tables` (Text field)
   - `Access Level` (Select field: READ_ONLY, READ_WRITE, FULL_ACCESS)
   - `Duration Days` (Number field)
   - `Business Justification` (Textarea)
   - `DAM Request ID` (Text field, hidden)

3. Configure workflow:
   - Draft → Configured → Pending Approval → Approved → Provisioned
   - Rejected → Rejected
   - Expired → Expired

## How It Works

1. **User creates a Jira issue** (Database Access Request type)
2. **App panel appears** in the issue view
3. **User clicks "Configure Access"** button
4. **Modal opens** with form:
   - Select database asset
   - Enter tables (comma-separated)
   - Select access level
   - Set duration
   - Provide business justification
5. **Configuration is saved** to DAM backend via API
6. **Issue transitions** to "Pending Approval"
7. **Admin approves** in Jira
8. **Webhook triggers** → DAM backend provisions access
9. **Issue updates** to "Provisioned" status

## Webhook Setup

The app listens for `jira:issue_updated` events. When an issue transitions to "Approved":

1. Webhook handler (`webhook.js`) is triggered
2. Calls DAM backend `/api/jira/provision` endpoint
3. DAM backend grants access
4. Updates Jira issue with DAM Request ID

## API Integration

The app calls your DAM backend API endpoints:

- `GET /api/jira/assets` - Get available assets
- `POST /api/jira/config` - Save access configuration
- `POST /api/jira/provision` - Provision access (via webhook)
- `GET /api/jira/config/{issueKey}` - Get current configuration

All requests include `Authorization: Bearer <token>` header.

## Publishing to Marketplace

1. **Build for production:**
   ```bash
   npm run build
   ```

2. **Validate:**
   ```bash
   forge lint
   ```

3. **Submit to marketplace:**
   - Go to https://developer.atlassian.com/console/myapps/
   - Select your app
   - Click "Submit for review"
   - Follow the submission process


## Troubleshooting

### App not appearing in Jira
- Check that the app is installed: `forge install`
- Verify manifest.yml is correct
- Check browser console for errors

### API calls failing
- Verify `DAM_API_BASE_URL` is set correctly
- Check `DAM_API_TOKEN` is valid
- Ensure CORS is enabled on your backend

### Webhook not triggering
- Verify trigger is configured in manifest.yml
- Check Forge logs: `forge logs`
- Ensure workflow transition names match

## Support

For issues or questions:
- Check Forge documentation: https://developer.atlassian.com/platform/forge/
- Review DAM API documentation
- Contact your development team
