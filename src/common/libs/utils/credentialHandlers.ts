import { request, stateActions } from "@common/index";
import { IntlShape } from "react-intl";

// Helper function to check if asset is database type
const isDatabaseAsset = (assetType: string | undefined): boolean => {
  return assetType === 'DATABASE';
};

// Helper function to check if asset is Unix server type
const isUnixServerAsset = (assetType: string | undefined): boolean => {
  return assetType === 'UNIX_SERVER';
};

export interface CredentialCallbacks {
  readonly intl?: IntlShape;
  readonly showSuccess?: (options: { description: string }) => void;
  readonly showError?: (options: { description: string }) => void;
  readonly onSuccess?: () => void;
}

export interface DatabaseCredentialRequestOptions {
  readonly endpoint: string;
  readonly method: string;
  readonly data?: { readonly username: string; readonly password?: string; readonly awsSecretsManagerKey?: string };
  readonly callbacks?: CredentialCallbacks;
}

export interface SSHCredentialRequestOptions {
  readonly endpoint: string;
  readonly method: string;
  readonly data?: { readonly username: string; readonly sshKeyFile?: string; readonly awsSecretsManagerKey?: string };
  readonly callbacks?: CredentialCallbacks;
  readonly useDetailsForError?: boolean;
}

export interface SetCredentialOptions {
  readonly credentialId: number;
  readonly assetType: string | undefined;
  readonly username: string;
  readonly password: string;
  readonly awsSecretsManagerKey?: string;
  readonly callbacks?: CredentialCallbacks;
}

export interface SetSSHCredentialOptions {
  readonly credentialId: number;
  readonly assetType: string | undefined;
  readonly username: string;
  readonly sshPrivateKey: string;
  readonly awsSecretsManagerKey?: string;
  readonly callbacks?: CredentialCallbacks;
  readonly useDetailsForError?: boolean;
}

/**
 * Helper function to handle database credential request
 * @param options - Request options including endpoint, method, data, and callbacks
 */
export const handleDatabaseCredentialRequest = (options: DatabaseCredentialRequestOptions) => {
  const { endpoint, method, data, callbacks } = options;
  const { intl, showSuccess, showError, onSuccess } = callbacks || {};
  
  return request(endpoint, { method, data })
    .then(() => {
      if (showSuccess && intl) {
        showSuccess({
          description: intl.formatMessage({ id: 'text.credentials_set_success' }),
        });
      }
      if (onSuccess) {
        onSuccess();
      }
    })
    .catch((e) => {
      if (showError && intl) {
        showError({
          description: e.data?.error ?? intl.formatMessage({ id: 'text.error_occurred_setting_credentials' }),
        });
      }
    })
    .finally(() => {
      stateActions.subLoading();
    });
};

/**
 * Helper function to handle SSH credential request
 * @param options - Request options including endpoint, method, data, callbacks, and error handling preference
 */
export const handleSSHCredentialRequest = (options: SSHCredentialRequestOptions) => {
  const { endpoint, method, data, callbacks, useDetailsForError = false } = options;
  const { intl, showSuccess, showError, onSuccess } = callbacks || {};
  
  return request(endpoint, { method, data })
    .then(() => {
      if (showSuccess && intl) {
        showSuccess({
          description: intl.formatMessage({ id: 'text.ssh_credentials_set_success' }),
        });
      }
      if (onSuccess) {
        onSuccess();
      }
    })
    .catch((e) => {
      if (showError && intl) {
        const errorMessage = useDetailsForError && e.data?.error
          ? e.data.details
          : e.data?.error ?? intl.formatMessage({ id: 'text.error_occurred_setting_ssh_credentials' });
        showError({
          description: errorMessage,
        });
      }
    })
    .finally(() => {
      stateActions.subLoading();
    });
};

/**
 * Helper function to set database credentials
 * @param options - Credential options including credential ID, asset type, credentials, and callbacks
 */
export const handleSetCredential = (options: SetCredentialOptions) => {
  const { credentialId, assetType, username, password, awsSecretsManagerKey, callbacks } = options;
  
  if (!isDatabaseAsset(assetType)) return;
  stateActions.addLoading();
  const requestData = awsSecretsManagerKey 
    ? { username, awsSecretsManagerKey }
    : { username, password };
  return handleDatabaseCredentialRequest({
    endpoint: `/api/asset_owner/assets/credentials/${credentialId}`,
    method: 'POST',
    data: requestData,
    callbacks,
  });
};

/**
 * Helper function to set SSH credentials
 * @param options - SSH credential options including credential ID, asset type, credentials, callbacks, and error handling preference
 */
export const handleSetSSHCredential = (options: SetSSHCredentialOptions) => {
  const { credentialId, assetType, username, sshPrivateKey, awsSecretsManagerKey, callbacks, useDetailsForError = false } = options;
  
  if (!isUnixServerAsset(assetType)) return;
  stateActions.addLoading();
  const requestData = awsSecretsManagerKey
    ? { username, awsSecretsManagerKey }
    : { username, sshKeyFile: sshPrivateKey };
  return handleSSHCredentialRequest({
    endpoint: `/api/asset_owner/assets/ssh-credentials/${credentialId}`,
    method: 'PUT',
    data: requestData,
    callbacks,
    useDetailsForError,
  });
};
