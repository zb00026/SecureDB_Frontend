# Jira Forge App Setup Guide

## Overview

This guide explains how to set up and deploy the Jira Forge app for Hagrids DAM integration.

## Quick Start

### 1. Install Forge CLI

```bash
npm install -g @forge/cli
```

### 2. Login to Forge

```bash
forge login
```

This will open a browser window for Atlassian authentication.

### 3. Create New App

```bash
cd jira-forge-app
forge register
```

This creates a new app in your Atlassian account and updates `manifest.yml` with your app ID.

### 4. Configure Environment Variables

Create `.env` file:

```env
DAM_API_BASE_URL=https://your-dam-backend.com/api/jira
DAM_API_TOKEN=your-backend-api-token
```

### 5. Build and Deploy

```bash
npm install
npm run build
forge deploy
```

### 6. Install in Jira

```bash
forge install
```

This will prompt you to select a Jira site to install the app.

## Development Workflow

### Local Development with Tunnel

```bash
# Start tunnel (keeps connection to Jira)
forge tunnel

# In another terminal, deploy changes
forge deploy
```

The tunnel allows you to test locally while connected to your Jira instance.

### View Logs

```bash
forge logs
```

## App Structure

### manifest.yml
Defines:
- App modules (issue panel, functions, triggers)
- Permissions
- App ID

### src/index.jsx
Main UI component that:
- Shows configuration status
- Opens configuration modal
- Displays current settings

### src/resolvers/webhook.js
Backend functions that:
- Call DAM API endpoints
- Handle webhook events
- Process approval/rejection

## Integration with Frontend

The Forge app can also embed your React frontend page:

### Option 1: Iframe Embedding

Modify `src/index.jsx` to use iframe:

```jsx
import { render, Text, Fragment } from '@forge/ui';

const App = () => {
  const context = useProductContext();
  const issueKey = context.platformContext.issueKey;
  const userEmail = context.accountId;
  
  const iframeUrl = `https://your-dam-frontend.com/jira?issueKey=${issueKey}&userEmail=${userEmail}`;
  
  return (
    <Fragment>
      <Text>Database Access Configuration</Text>
      <iframe 
        src={iframeUrl}
        width="100%"
        height="600px"
        style={{ border: 'none' }}
      />
    </Fragment>
  );
};

export const run = render(<App />);
```

### Option 2: Native Forge UI

Use Forge UI components (current implementation) for a more integrated experience.

## Custom Issue Type Setup

### 1. Create Issue Type

In Jira Admin → Issues → Issue Types:
- Name: "Database Access Request"
- Description: "Request database access through DAM"

### 2. Add Custom Fields

Go to Jira Admin → Issues → Custom Fields:

1. **Asset ID** (Text Field)
   - Field ID: `customfield_10001`
   - Name: "Asset ID"

2. **Tables** (Text Field)
   - Field ID: `customfield_10002`
   - Name: "Tables"

3. **Access Level** (Select Field)
   - Field ID: `customfield_10003`
   - Options: READ_ONLY, READ_WRITE, FULL_ACCESS

4. **Duration Days** (Number Field)
   - Field ID: `customfield_10004`
   - Name: "Duration (days)"

5. **Business Justification** (Textarea)
   - Field ID: `customfield_10005`
   - Name: "Business Justification"

6. **DAM Request ID** (Text Field, Hidden)
   - Field ID: `customfield_10006`
   - Name: "DAM Request ID"

### 3. Configure Workflow

Create workflow: "Database Access Request Workflow"

**Statuses:**
- Draft
- Configured
- Pending Approval
- Approved
- Provisioned
- Rejected
- Expired

**Transitions:**
- Draft → Configured (Configure)
- Configured → Pending Approval (Submit for Approval)
- Pending Approval → Approved (Approve)
- Pending Approval → Rejected (Reject)
- Approved → Provisioned (Auto via webhook)
- Any → Expired (Auto via automation)

## Webhook Configuration

### In Jira Automation

Create automation rule:

**Trigger:** Issue transitioned to "Approved"

**Action:** Send webhook
- URL: Your Forge app webhook endpoint
- Method: POST
- Body:
```json
{
  "issueKey": "{{issue.key}}",
  "issueId": "{{issue.id}}",
  "approverEmail": "{{user.emailAddress}}",
  "timestamp": "{{now.timestamp}}"
}
```

## Testing

### Test Configuration Flow

1. Create a "Database Access Request" issue
2. Open the issue
3. Click "Configure Access" in the app panel
4. Fill out the form
5. Save configuration
6. Verify issue fields are updated

### Test Approval Flow

1. Transition issue to "Pending Approval"
2. Approve the issue
3. Verify webhook is triggered
4. Check DAM backend logs
5. Verify access is provisioned
6. Check issue status updates to "Provisioned"

## Troubleshooting

### App not appearing
- Verify app is installed: `forge install`
- Check app is enabled in Jira settings
- Verify issue type matches

### API calls failing
- Check `.env` file has correct values
- Verify backend API is accessible
- Check CORS settings on backend
- Review logs: `forge logs`

### Webhook not working
- Verify automation rule is active
- Check webhook URL is correct
- Review Forge function logs
- Ensure trigger is configured in manifest.yml

## Production Deployment

1. **Build:**
   ```bash
   npm run build
   ```

2. **Deploy:**
   ```bash
   forge deploy --environment production
   ```

3. **Submit to Marketplace:**
   - Go to https://developer.atlassian.com/console/myapps/
   - Select your app
   - Click "Submit for review"
   - Complete submission form
   - Wait for review

## Security Considerations

1. **API Token:** Store securely, never commit to git
2. **Webhook Secret:** Use HMAC verification
3. **CORS:** Configure backend to allow Forge domain
4. **Authentication:** Verify user identity in webhooks
5. **Rate Limiting:** Implement on backend API

## Support Resources

- Forge Documentation: https://developer.atlassian.com/platform/forge/
- Forge Community: https://community.developer.atlassian.com/
- DAM API Documentation: See `JIRA_INTEGRATION.md`
