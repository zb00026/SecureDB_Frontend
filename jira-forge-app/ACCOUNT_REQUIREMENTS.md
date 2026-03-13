# Account Requirements for Jira Forge App

## Overview

There are **two different accounts** needed for Forge app development:

1. **Atlassian Developer Account** - For `forge login` and app management
2. **Jira Site Admin Account** - For `forge install` and testing

## Account Types Explained

### 1. Atlassian Developer Account (`forge login`)

**Purpose:**
- Register and manage Forge apps
- Deploy apps to Forge infrastructure
- Access Forge developer console
- Submit apps to marketplace

**Requirements:**
- Any Atlassian account (personal or organization)
- Free to create at https://id.atlassian.com/signup
- No special permissions needed
- Used for: `forge login`, `forge register`, `forge deploy`

**Example:**
```bash
forge login
# Opens browser → Login with your Atlassian account
# This can be: your-email@gmail.com, company-email@company.com, etc.
```

### 2. Jira Site Admin Account (`forge install`)

**Purpose:**
- Install Forge apps into Jira instances
- Test apps in your Jira site
- Manage app permissions in Jira

**Requirements:**
- Must have **Site Admin** or **System Admin** role in the target Jira instance
- This is the account you use to log into Jira
- Used for: `forge install`, testing the app

**Example:**
```bash
forge install
# Prompts you to select Jira site
# Requires admin access to that site
# Uses the account you're logged into Jira with
```

## Common Scenarios

### Scenario 1: Personal Development
- **Developer Account:** Your personal Atlassian account
- **Jira Admin:** Your personal Jira Cloud site (free tier)
- **Setup:** Create free Jira site, you're automatically admin

### Scenario 2: Company Development
- **Developer Account:** Your work Atlassian account
- **Jira Admin:** Company Jira instance
- **Setup:** Ask IT/admin to grant you admin access, or use a test Jira site

### Scenario 3: Team Development
- **Developer Account:** Shared Atlassian account (or individual accounts)
- **Jira Admin:** Shared test Jira instance
- **Setup:** One person installs, others can develop using `forge tunnel`

## Step-by-Step Account Setup

### Step 1: Create Atlassian Developer Account (if needed)

1. Go to https://id.atlassian.com/signup
2. Sign up with your email
3. Verify email address
4. Complete profile

### Step 2: Get Jira Admin Access

**Option A: Use Free Jira Cloud Site**
1. Go to https://www.atlassian.com/try/cloud/free
2. Create a free Jira site
3. You're automatically the admin

**Option B: Use Existing Company Jira**
1. Ask your Jira administrator to grant you admin access
2. Or ask them to install the app for you
3. You can still develop using `forge tunnel` without admin access

### Step 3: Login to Forge CLI

```bash
forge login
# Use your Atlassian developer account
```

### Step 4: Install App (requires Jira admin)

```bash
forge install
# Select your Jira site
# Must be logged into Jira as admin
```

## Troubleshooting

### "You don't have permission to install apps"

**Problem:** Account used for `forge install` doesn't have admin access.

**Solution:**
1. Check if you're logged into Jira as admin
2. Go to Jira → Settings → Apps → Manage apps
3. Verify you can see "Upload app" option
4. If not, ask your Jira admin to install the app

### "Cannot find Jira site"

**Problem:** Your Atlassian account isn't associated with any Jira sites.

**Solution:**
1. Make sure you're logged into Jira at least once
2. Visit https://id.atlassian.com/manage-profile/security/api-tokens
3. Verify your account has access to Jira sites
4. Create a free Jira site if needed

### "App registration failed"

**Problem:** Atlassian developer account issue.

**Solution:**
1. Verify your Atlassian account is active
2. Check email verification status
3. Try logging out and back in: `forge logout` then `forge login`
4. Check Forge console: https://developer.atlassian.com/console/myapps/

## Best Practices

1. **Use separate accounts for production:**
   - Developer account for app management
   - Production Jira admin account for installation

2. **Use test Jira site for development:**
   - Create free Jira Cloud site for testing
   - Don't test on production Jira instance

3. **Team development:**
   - One person registers the app (`forge register`)
   - Multiple developers can use `forge tunnel` for local testing
   - Only one person needs admin access for `forge install`

4. **Keep accounts secure:**
   - Use strong passwords
   - Enable 2FA on Atlassian account
   - Don't share admin credentials

## Summary

| Action | Account Needed | Example |
|--------|---------------|---------|
| `forge login` | Atlassian Developer Account | your-email@example.com |
| `forge register` | Atlassian Developer Account | your-email@example.com |
| `forge deploy` | Atlassian Developer Account | your-email@example.com |
| `forge install` | Jira Site Admin Account | admin@company.com (in Jira) |
| `forge tunnel` | Jira Site Admin Account | admin@company.com (in Jira) |
| Testing app | Jira Site Admin Account | admin@company.com (in Jira) |

## Quick Reference

```bash
# Step 1: Login with Atlassian account (any account)
forge login

# Step 2: Register app (uses Atlassian account)
forge register

# Step 3: Install in Jira (requires Jira admin)
forge install
# → Select Jira site where you have admin access
```
