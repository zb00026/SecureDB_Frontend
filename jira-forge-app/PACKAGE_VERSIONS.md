# Forge Package Versions - Fixed

## Issue
The initial `package.json` had incorrect version numbers that don't exist in npm.

## Correct Versions (Updated - Verified)

```json
{
  "dependencies": {
    "@forge/api": "^7.0.2",
    "@forge/ui": "^1.11.3",
    "@forge/resolver": "^1.7.1",
    "@forge/bridge": "^5.13.0"
  },
  "devDependencies": {
    "@forge/cli": "^12.0.0"
  }
}
```

**Note:** These versions were verified by checking npm registry (February 2026).

## Package Details

- **@forge/api** (v7.0.0+) - For making API calls and fetch requests
- **@forge/ui** (v1.15.0+) - For UI Kit components (legacy, but still works)
- **@forge/resolver** (v1.7.0+) - For backend resolver functions
- **@forge/bridge** (v5.0.0+) - For invoking resolver functions from UI
- **@forge/cli** (v12.0.0+) - Forge command line interface

## Note on @forge/ui

The code uses `@forge/ui` which is the older UI Kit. If you want to use the latest UI Kit, you would need to:
1. Replace `@forge/ui` with `@forge/react` (v10+)
2. Update component imports and syntax
3. Update manifest.yml structure

For now, `@forge/ui` v1.15.0 works fine and is simpler to use.

## Installation

After updating package.json, run:

```bash
npm install
```

This should now work without errors.
