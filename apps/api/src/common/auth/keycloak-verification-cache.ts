export interface KeycloakVerificationCacheState {
  readonly status: "not_attempted" | "ready" | "verified" | "degraded";
  readonly checkedAt?: string;
  readonly message?: string;
}

let cachedKeycloakVerificationState: KeycloakVerificationCacheState | undefined;

export function getCachedKeycloakVerificationState(): KeycloakVerificationCacheState | undefined {
  return cachedKeycloakVerificationState;
}

export function setCachedKeycloakVerificationState(
  value: KeycloakVerificationCacheState | undefined
): void {
  cachedKeycloakVerificationState = value;
}
