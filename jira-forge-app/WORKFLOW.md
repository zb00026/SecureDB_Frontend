# Database Access Request Workflow

## Workflow States (Jira Automation)

```
Open → Requested → Pending for approval → Approved
Open → Requested → Pending for approval → Rejected
```

- **Open**: Assignee = Current user. User configures and submits.
- **Requested**: Ticket assigned to Asset Owner (`hagrids.assetowner` project role).
- **Pending for approval**: Asset Owner reviews.
- **Approved / Rejected**: Final states (like Done).

State transitions are managed by Jira automation rules, not manually.

---

## App Behavior

### Open State – Asset Selection

- **Approved assets**: DBs the user already has access to.
- **Unapproved assets**: DBs the user does not have access to.

**Approved assets** (user has access):
- User may request access to additional tables.
- Tables they already have access to are pre-checked.
- User can add or remove table selections.

**Unapproved assets** (user has no access):
- All tables shown.
- User selects tables to request access.

### On Submit

1. Saves access configuration to the DAM backend.
2. Assigns the issue to the first user in the `hagrids.assetowner` project role.

---

## Backend API Contract

### GET /api/jira/assets

The backend should return assets split by user access. Supported formats:

**Option A – Split arrays**
```json
{
  "approvedAssets": [
    {
      "id": "asset-1",
      "name": "Production DB",
      "type": "database",
      "tables": ["users", "orders", "logs"],
      "userHasAccess": true,
      "existingTables": ["users", "orders"]
    }
  ],
  "unapprovedAssets": [
    {
      "id": "asset-2",
      "name": "Analytics DB",
      "type": "database",
      "tables": ["events", "metrics"]
    }
  ]
}
```

**Option B – Flat list with flags**
```json
[
  {
    "id": "asset-1",
    "name": "Production DB",
    "type": "database",
    "tables": ["users", "orders", "logs"],
    "userHasAccess": true,
    "existingTables": ["users", "orders"]
  },
  {
    "id": "asset-2",
    "name": "Analytics DB",
    "type": "database",
    "tables": ["events", "metrics"],
    "userHasAccess": false
  }
]
```

- `userHasAccess`: `true` if the current user has access to this asset.
- `existingTables`: For approved assets, tables the user already has access to (pre-checked in the UI).

---

## Jira Setup

### Project role

1. Create or use project role **`hagrids.assetowner`**.
2. Add Asset Owner users to this role for the project.

### Jira automation (example)

1. **Trigger**: Issue transitioned to “Requested”.
2. **Action**: Assign to project role `hagrids.assetowner` (if not already configured).

The app also assigns the issue after saving the configuration. If both run, the last assignment wins.

---

## Asset Owner Approval

- Users with the **Asset Owner** DAM role see Approve/Reject in the panel.
- Approval/Rejection is done in the app; Jira automation should move the issue to Approved or Rejected.
