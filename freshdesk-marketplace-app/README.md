# Hagrids Freshdesk Marketplace App

This is a standalone Freshdesk app that can be published to the Freshdesk marketplace. It provides database query functionality for support agents directly within Freshdesk tickets.

## Architecture

This app is a **minimal standalone app** that:
- Uses the same Hagrids backend API (`/api/freshdesk/*` endpoints)
- Can be installed in any Freshdesk instance
- Requires configuration of the Hagrids API URL during installation
- Authenticates Freshdesk users as accessors in Hagrids

## Structure

```
freshdesk-marketplace-app/
├── app/                    # Built app files
│   ├── index.html
│   ├── app.js
│   └── manifest.json
├── config/
│   └── iparams.json       # Installation parameters
├── src/
│   ├── app.js             # Main app entry point
│   └── components/
│       └── QueryApp.jsx   # Main query component
├── package.json
└── README.md
```

## Prerequisites

1. **Node.js** (v18.19.1 or compatible)
2. **Freshworks FDK** (Freshworks Development Kit)

### Installing Freshworks FDK

Install FDK globally using npm:

```bash
npm install -g https://cdn.freshdev.io/fdk/latest.tgz
```

Or using npx (no global installation needed):
```bash
npx -p https://cdn.freshdev.io/fdk/latest.tgz fdk
```

**Verify installation:**
```bash
fdk version
```

## Development

1. Install dependencies:
```bash
npm install
```

2. Build the app:
```bash
npm run build
```

3. Test locally with FDK:
```bash
fdk run
```

**Note:** If `fdk` is not recognized, make sure you've installed it globally (see Prerequisites above).

## Publishing to Marketplace

1. Build for production:
```bash
npm run build
```

2. Validate the app:
```bash
fdk validate
```

3. Pack the app:
```bash
fdk pack
```

4. Submit to marketplace at https://www.freshworks.com/apps/freshdesk/

## Configuration

During installation, users will be prompted to enter:
- **Hagrids API URL**: The base URL of the Hagrids backend API (e.g., `https://api.hagrids.com`)
- **Hagrids Secret Key**: Secret key for authenticating with Hagrids backend API. Get this from your backend team (FRESHDESK_APP_SECRET_KEY from backend .env file).

## How It Works

1. User opens a ticket in Freshdesk
2. App appears in the right sidebar
3. App gets the logged-in user's email from Freshdesk
4. App calls `/api/freshdesk/auth` with the email
5. Backend authenticates and returns a token
6. App uses the token for all subsequent API calls
7. User can query databases directly from the ticket



