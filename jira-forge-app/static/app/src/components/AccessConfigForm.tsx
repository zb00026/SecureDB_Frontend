import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { router } from '@forge/bridge';
import {
  getAssetsSplit,
  saveAccessConfig,
  assignAndTransitionIssue,
  Asset,
  AccessConfigRequest,
  AccessConfig,
  AccessLevel,
} from '../hooks/useResolver';
import { TablesSelector } from './TablesSelector';
import styles from './AccessConfigForm.module.css';

interface AccessConfigFormProps {
  readonly issueKey: string;
  readonly issueId: string;
  readonly userEmail: string;
  readonly accountId: string;
  readonly initialConfig?: AccessConfig | null;
  readonly onSuccess: (config: any) => void;
  readonly onCancel: () => void;
}

const defaultFormData = {
  assetId: '',
  tables: '',
  accessLevel: 'READ_ONLY' as AccessLevel,
  durationHours: 2160,
  businessJustification: '',
};

export function AccessConfigForm({
  issueKey,
  issueId,
  userEmail,
  accountId,
  initialConfig,
  onSuccess,
  onCancel,
}: AccessConfigFormProps) {
  const [approvedAssets, setApprovedAssets] = useState<Asset[]>([]);
  const [unapprovedAssets, setUnapprovedAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const configToFormData = useCallback((config: AccessConfig) => ({
    assetId: config.assetId ?? '',
    tables: Array.isArray(config.tables) ? config.tables.join(', ') : (config.tables ?? ''),
    accessLevel: config.accessLevel ?? 'READ_ONLY',
    durationHours: config.durationHours ?? (config.durationDays == null ? 2160: Math.round(config.durationDays * 24)),
    businessJustification: config.businessJustification ?? '',
  }), []);

  const [formData, setFormData] = useState(() =>
    initialConfig ? configToFormData(initialConfig) : defaultFormData
  );

  useEffect(() => {
    if (initialConfig) {
      setFormData(configToFormData(initialConfig));
    } else {
      setFormData(defaultFormData);
    }
  }, [initialConfig, configToFormData]);

  const loadAssets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { approved, unapproved } = await getAssetsSplit(accountId, userEmail);
      setApprovedAssets(approved);
      setUnapprovedAssets(unapproved);
    } catch (err: any) {
      setError(err.message || 'Failed to load assets');
    } finally {
      setLoading(false);
    }
  }, [accountId, userEmail]);

  useEffect(() => {
    loadAssets();
  }, [loadAssets]);

  const allAssets = useMemo(
    () => [...approvedAssets, ...unapprovedAssets],
    [approvedAssets, unapprovedAssets]
  );
  const selectedAsset = useMemo(
    () => allAssets.find((a) => String(a.id) === String(formData.assetId)),
    [allAssets, formData.assetId]
  );
  const assetTables = selectedAsset?.tables ?? [];
  const existingTables = selectedAsset?.existingTables ?? [];
  const isApprovedAsset = selectedAsset?.userHasAccess === true;

  const handleAssetChange = (assetId: string) => {
    const asset = allAssets.find((a) => String(a.id) === String(assetId));
    const initialTables = asset?.userHasAccess && asset?.existingTables?.length
      ? asset.existingTables.join(', ')
      : '';
    setFormData({ ...formData, assetId, tables: initialTables });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.assetId || !formData.tables || !formData.businessJustification) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const config: AccessConfigRequest = {
        issueKey,
        issueId,
        userEmail,
        jiraAccountId: accountId,
        assetId: formData.assetId,
        tables: formData.tables,
        accessLevel: formData.accessLevel,
        durationHours: formData.durationHours,
        businessJustification: formData.businessJustification,
      };

      const result = await saveAccessConfig(config, accountId);

      try {
        const assignResult = await assignAndTransitionIssue(issueKey, formData.assetId, accountId);
        if (assignResult.warning) {
          console.warn('[AccessConfigForm] Assign/transition warning:', assignResult.warning);
        }
      } catch (assignErr: any) {
        console.warn('[AccessConfigForm] Could not assign/transition:', assignErr?.message);
        // Config saved successfully; assignment failure is non-blocking
      }

      onSuccess(result);
      // Reload the host Jira page so the board reflects the new status column
      router.reload();
    } catch (err: any) {
      setError(err.message || 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.form}>
        <p>Loading assets...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.form}>
        <div className={styles.error}>{error}</div>
        <button type="button" onClick={onCancel} className={styles.button}>
          Back
        </button>
      </div>
    );
  }

  if (allAssets.length === 0) {
    return (
      <div className={styles.form}>
        <p>No assets available. Please contact your administrator to configure database assets.</p>
        <button type="button" onClick={onCancel} className={styles.button}>
          Back
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.field}>
        <label htmlFor="assetId">Database Asset *</label>
        <div className={styles.assetSelectWrapper}>
          {approvedAssets.length > 0 && (
            <span className={styles.assetGroupLabel}>Approved assets (you have access) / Unapproved assets</span>
          )}
          <select
            id="assetId"
            value={formData.assetId}
            onChange={(e) => handleAssetChange(e.target.value)}
            required
          >
            <option value="">Select an asset</option>
            {approvedAssets.length > 0 && (
              <optgroup label="Approved assets (you have access)">
                {approvedAssets.map((asset) => (
                  <option key={asset.id} value={asset.id}>
                    {asset.name} ({asset.type})
                  </option>
                ))}
              </optgroup>
            )}
            {unapprovedAssets.length > 0 && (
              <optgroup label="Unapproved assets">
                {unapprovedAssets.map((asset) => (
                  <option key={asset.id} value={asset.id}>
                    {asset.name} ({asset.type})
                  </option>
                ))}
              </optgroup>
            )}
          </select>
        </div>
      </div>

      <div className={styles.field}>
        <label htmlFor="tables">
          Tables * {isApprovedAsset && existingTables.length > 0 && (
            <span className={styles.hint}>(checkboxes ticked for tables you already have access to)</span>
          )}
        </label>
        <TablesSelector
          key={formData.assetId}
          tables={assetTables}
          value={formData.tables}
          onChange={(tables) => setFormData({ ...formData, tables })}
          disabled={!formData.assetId}
          defaultChecked={isApprovedAsset ? existingTables : undefined}
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="accessLevel">Access Level *</label>
        <select
          id="accessLevel"
          value={formData.accessLevel}
          onChange={(e) =>
            setFormData({
              ...formData,
              accessLevel: e.target.value as AccessLevel,
            })
          }
          required
        >
          <option value="READ_ONLY">Read Only</option>
          <option value="READ_WRITE">Read/Write</option>
          <option value="FULL_ACCESS">Full Access</option>
        </select>
      </div>

      <div className={styles.field}>
        <label htmlFor="durationHours">Duration *</label>
        <select
          id="durationHours"
          value={formData.durationHours}
          onChange={(e) =>
            setFormData({ ...formData, durationHours: Number.parseInt(e.target.value, 10) })
          }
          required
        >
          <option value={1}>1 hr</option>
          <option value={3}>3 hrs</option>
          <option value={7}>7 hrs</option>
          <option value={24}>1 day</option>
          <option value={72}>3 days</option>
          <option value={168}>7 days</option>
          <option value={720}>30 days</option>
          <option value={2160}>90 days</option>
          <option value={4320}>180 days</option>
          <option value={8760}>365 days</option>
        </select>
      </div>

      <div className={styles.field}>
        <label htmlFor="businessJustification">Business Justification *</label>
        <textarea
          id="businessJustification"
          value={formData.businessJustification ?? ''}
          style={{ width: 'calc(100% - 16px)' }}
          onChange={(e) =>
            setFormData({ ...formData, businessJustification: e.target.value })
          }
          rows={4}
          placeholder="Explain why you need this access..."
          required
        />
      </div>

      <div className={styles.actions}>
        <button type="button" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
        <button type="submit" disabled={saving}>
          {saving ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>
    </form>
  );
}
