export type RuntimeConfig = {
  requestBaseUrl: string;
  websocketUrl: string;
  keycloakUrl: string;
  keycloakRealm: string;
  keycloakClientId: string;
  authProvider: string;
  googleClientId?: string;
  firebaseApiKey?: string;
  firebaseAuthDomain?: string;
  firebaseProjectId?: string;
  firebaseStorageBucket?: string;
  firebaseMessagingSenderId?: string;
  firebaseAppId?: string;
  firebaseMeasurementId?: string;
  firebaseVapidKey?: string;
};

let configPromise: Promise<RuntimeConfig> | null = null;

export function loadRuntimeConfig(): Promise<RuntimeConfig> {
  if (!configPromise) {
    configPromise = fetch('/public/config', { credentials: 'same-origin' })
      .then((r) => {
        if (!r.ok) throw new Error(`Config load failed: ${r.status}`);
        return r.json();
      });
  }
  return configPromise;
}

export function getRuntimeConfig(): Promise<RuntimeConfig> {
  if (!configPromise) throw new Error('Runtime config not loaded yet');
  return configPromise;
}



