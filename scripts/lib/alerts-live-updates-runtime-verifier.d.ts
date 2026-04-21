export function readAlertsLiveUpdatesVerificationConfig(
  env?: Record<string, string | undefined>
): {
  webBaseUrl: string;
  backendBaseUrl: string;
  bearerToken?: string;
  alertId: string;
  timeoutMs: number;
  expectEnabled: boolean;
  webSocketUrl?: string;
  mutationPath: string;
  mutationBody: Record<string, unknown>;
};

export function deriveAlertsLiveUpdatesWebSocketUrl(options: {
  backendBaseUrl: string;
  gatewayPath: string;
  explicitWebSocketUrl?: string;
  bearerToken?: string;
}): string;
