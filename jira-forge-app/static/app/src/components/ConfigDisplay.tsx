import React, { useState } from 'react';

function formatDuration(hours: number): string {
  if (hours < 24) {
    const suffix = hours === 1 ? '' : 's';
    return `${hours} hr${suffix}`;
  }
  const days = hours / 24;
  const suffix = days === 1 ? '' : 's';
  return `${days} day${suffix}`;
}
import { router } from '@forge/bridge';
import { AccessConfig, approveAccessRequest, rejectAccessRequest } from '../hooks/useResolver';
import styles from './ConfigDisplay.module.css';

interface ConfigDisplayProps {
  readonly config: AccessConfig;
  readonly showApproveReject?: boolean;
  readonly accessRequestId?: string | number;
  readonly accountId: string;
  readonly userEmail?: string;
  readonly issueKey?: string;
  readonly issueId?: string;
  readonly onApproveRejectSuccess?: () => void;
}

export function ConfigDisplay({
  config,
  showApproveReject,
  accessRequestId,
  accountId,
  userEmail,
  issueKey,
  issueId,
  onApproveRejectSuccess,
}: ConfigDisplayProps) {
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [actionLoading, setActionLoading] = useState<'approve' | 'reject' | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'APPROVED':
        return '#36b37e';
      case 'REJECTED':
        return '#ff5630';
      case 'EXPIRED':
        return '#ffab00';
      default:
        return '#0052cc';
    }
  };

  const getAccessLevelLabel = (level: string) => {
    switch (level) {
      case 'READ_ONLY':
        return 'Read Only';
      case 'READ_WRITE':
        return 'Read/Write';
      case 'FULL_ACCESS':
        return 'Full Access';
      default:
        return level;
    }
  };

  const jiraRequesterId = config.jiraRequesterId;

  const handleApprove = async () => {
    if (!accessRequestId) return;
    setActionError(null);
    setActionLoading('approve');
    try {
      await approveAccessRequest(accessRequestId, accountId, userEmail, {}, issueKey, issueId, jiraRequesterId);
      onApproveRejectSuccess?.();
      router.reload();
    } catch (err: any) {
      setActionError(err.message || 'Approve failed');
      setActionLoading(null);
    }
  };

  const handleRejectConfirm = async () => {
    if (!accessRequestId) return;
    setActionError(null);
    setActionLoading('reject');
    try {
      await rejectAccessRequest(accessRequestId, accountId, userEmail, { rejectReason: rejectReason || undefined }, issueKey, issueId, jiraRequesterId);
      setShowRejectInput(false);
      setRejectReason('');
      onApproveRejectSuccess?.();
      router.reload();
    } catch (err: any) {
      setActionError(err.message || 'Reject failed');
      setActionLoading(null);
    }
  };

  const canShowApproveReject = showApproveReject && config.status === 'REQUESTED' && accessRequestId;

  return (
    <div className={styles.config}>
      <div className={styles.info}>
        {config.status && (
          <div className={styles.row}>
            <span className={styles.label}>Status:</span>
            <span
              className={styles.value}
              style={{ color: getStatusColor(config.status) }}
            >
              {config.status}
            </span>
          </div>
        )}

        <div className={styles.row}>
          <span className={styles.label}>Asset:</span>
          <span className={styles.value}>
            {config.assetName || config.assetId}
          </span>
        </div>

        <div className={styles.row}>
          <span className={styles.label}>Tables:</span>
          <span className={styles.value}>{config.tables}</span>
        </div>

        <div className={styles.row}>
          <span className={styles.label}>Access Level:</span>
          <span className={styles.value}>
            {getAccessLevelLabel(config.accessLevel)}
          </span>
        </div>

        <div className={styles.row}>
          <span className={styles.label}>Duration:</span>
          <span className={styles.value}>
            {formatDuration(config.durationHours ?? (config.durationDays == null ? 2160 : Math.round(config.durationDays * 24)))}
          </span>
        </div>

        {config.businessJustification && (
          <div className={styles.row}>
            <span className={styles.label}>Business Justification:</span>
            <span className={styles.value}>{config.businessJustification}</span>
          </div>
        )}

        {config.expiryDate && (
          <div className={styles.row}>
            <span className={styles.label}>Expires:</span>
            <span className={styles.value}>
              {new Date(config.expiryDate).toLocaleDateString()}
            </span>
          </div>
        )}

        {config.damRequestId && (
          <div className={styles.row}>
            <span className={styles.label}>DAM Request ID:</span>
            <span className={styles.value}>{config.damRequestId}</span>
          </div>
        )}

        {canShowApproveReject && (
          <div className={styles.approveReject}>
            {actionError && <div className={styles.actionError}>{actionError}</div>}
            {showRejectInput ? (
              <div className={styles.rejectInput}>
                <label htmlFor="rejectReason" className={styles.rejectLabel}>
                  Reject reason (optional):
                </label>
                <textarea
                  id="rejectReason"
                  className={styles.rejectTextarea}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={2}
                  placeholder="Reason for rejection..."
                />
                <div className={styles.approveRejectActions}>
                  <button
                    type="button"
                    className={styles.buttonReject}
                    onClick={handleRejectConfirm}
                    disabled={!!actionLoading}
                  >
                    {actionLoading === 'reject' ? 'Rejecting...' : 'Confirm Reject'}
                  </button>
                  <button
                    type="button"
                    className={styles.buttonSecondary}
                    onClick={() => { setShowRejectInput(false); setRejectReason(''); setActionError(null); }}
                    disabled={!!actionLoading}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className={styles.approveRejectActions}>
                <button
                  type="button"
                  className={styles.buttonApprove}
                  onClick={handleApprove}
                  disabled={!!actionLoading}
                >
                  {actionLoading === 'approve' ? 'Approving...' : 'Approve'}
                </button>
                <button
                  type="button"
                  className={styles.buttonReject}
                  onClick={() => setShowRejectInput(true)}
                  disabled={!!actionLoading}
                >
                  Reject
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
