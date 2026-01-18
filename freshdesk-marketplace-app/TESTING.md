# Testing with FDK Run

## Prerequisites

1. **Node.js 18.x** (required by FDK)
   ```powershell
   nvm use 18.19.1
   ```

2. **FDK Installed**
   ```powershell
   npm install -g https://cdn.freshdev.io/fdk/latest.tgz
   ```

3. **App Built**
   ```powershell
   npm run build
   ```

## Step-by-Step Testing Guide

### 1. Navigate to App Directory

```powershell
cd freshdesk-marketplace-app
```

### 2. Ensure App is Built

```powershell
npm run build
```

This should create/update files in the `app/` directory:
- `app/index.html`
- `app/app.js`
- `app/icon.svg`
- `app/manifest.json`

### 3. Verify Manifest Exists

The `manifest.json` file should be in the **root** directory (`freshdesk-marketplace-app/manifest.json`), not just in `app/`.

### 4. Run FDK

**Option A: Using npm script (Recommended - works around PowerShell execution policy)**
```powershell
npm run fdk:run
```

**Option B: Using npx directly**
```powershell
npx -p https://cdn.freshdev.io/fdk/latest.tgz fdk run
```

**Option C: Using fdk directly (requires execution policy change)**
```powershell
fdk run
```

If you get a PowerShell execution policy error, you can either:
- Use Option A or B (recommended)
- Or change execution policy: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`
- Or use Command Prompt (cmd) instead of PowerShell

This will:
- Start a local development server (usually on port 10001)
- Open your Freshdesk test instance in a browser
- Load the app in the ticket sidebar

### 5. Configure FDK (First Time)

On first run, FDK will prompt you to:
1. **Enter your Freshdesk domain**: e.g., `yourcompany.freshdesk.com`
2. **Enter your Freshdesk API key**: Get this from Admin > API settings

### 6. Test the App

1. Open a ticket in your Freshdesk test instance
2. The app should appear in the right sidebar
3. The app will:
   - Get the logged-in user's email from Freshdesk
   - Call `/api/freshdesk/auth` with the email
   - Display the query interface

## Troubleshooting

### Error: "Could not find the app manifest file"

**Solution:**
1. Make sure you're in the `freshdesk-marketplace-app` directory
2. Verify `manifest.json` exists in the root:
   ```powershell
   Test-Path manifest.json
   ```
3. If missing, copy from `app/manifest.json`:
   ```powershell
   Copy-Item app/manifest.json manifest.json
   ```

### Error: "Node.js version of 18.x.x is required"

**Solution:**
```powershell
nvm use 18.19.1
```

### Error: "fdk is not recognized" or PowerShell execution policy error

**Solution 1 (Recommended):** Use npm script instead:
```powershell
npm run fdk:run
```

**Solution 2:** Use npx:
```powershell
npx -p https://cdn.freshdev.io/fdk/latest.tgz fdk run
```

**Solution 3:** Install FDK globally:
```powershell
npm install -g https://cdn.freshdev.io/fdk/latest.tgz
```

**Solution 4:** If you get execution policy error, change PowerShell policy:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**Solution 5:** Use Command Prompt (cmd) instead of PowerShell

### App doesn't load in Freshdesk

**Check:**
1. Make sure the app is built: `npm run build`
2. Check browser console for errors
3. Verify the Hagrids API URL is configured in `config/iparams.json`
4. Check that CORS is enabled on your backend for Freshdesk domains

### Port Already in Use

If port 10001 is in use, FDK will try the next available port. Check the terminal output for the actual port number.

## Development Workflow

1. **Make code changes** in `src/`
2. **Build the app**: `npm run build`
3. **Test with FDK**: `fdk run`
4. **Refresh the browser** to see changes

## FDK Commands

**Using npm scripts (recommended):**
- `npm run fdk:run` - Start local development server
- `npm run fdk:validate` - Validate app structure and manifest
- `npm run fdk:pack` - Create .zip file for marketplace submission

**Using npx:**
- `npx -p https://cdn.freshdev.io/fdk/latest.tgz fdk run`
- `npx -p https://cdn.freshdev.io/fdk/latest.tgz fdk validate`
- `npx -p https://cdn.freshdev.io/fdk/latest.tgz fdk pack`

**Using fdk directly (if installed globally):**
- `fdk run` - Start local development server
- `fdk validate` - Validate app structure and manifest
- `fdk pack` - Create .zip file for marketplace submission
- `fdk version` - Check FDK version

## Next Steps

Once `fdk run` works:
1. Test all features in the Freshdesk ticket sidebar
2. Verify authentication works
3. Test query execution
4. Check error handling
5. When ready, run `fdk pack` to create the marketplace package

