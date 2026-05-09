export function parseBoolean(value) {
  if (!value) {
    return false;
  }

  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}

export function normalizeBaseUrl(value) {
  const trimmed = value.trim();
  const parsed = new URL(trimmed);
  return parsed.toString().replace(/\/+$/, "");
}

function normalizeOptionalValue(value) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function normalizeExpectedAuthMode(value) {
  const normalized = normalizeOptionalValue(value)?.toLowerCase();
  if (normalized === "disabled" || normalized === "local" || normalized === "keycloak") {
    return normalized;
  }

  return "auto";
}

export function readAuthRuntimeVerificationConfig(env = process.env) {
  return {
    webBaseUrl: normalizeBaseUrl(
      env.AQUAPULSE_AUTH_VERIFY_WEB_BASE_URL ?? "http://localhost:3000"
    ),
    backendBaseUrl: normalizeBaseUrl(
      env.AQUAPULSE_AUTH_VERIFY_API_BASE_URL ??
        env.AQUAPULSE_WEB_LOCAL_API_BACKEND_URL ??
        "http://localhost:4000"
    ),
    expectedAuthMode: normalizeExpectedAuthMode(env.AQUAPULSE_AUTH_VERIFY_EXPECT_AUTH_MODE),
    bearerToken: normalizeOptionalValue(
      env.AQUAPULSE_AUTH_VERIFY_BEARER_TOKEN ?? env.AQUAPULSE_WEB_AUTH_BEARER_TOKEN
    ),
    alertId: normalizeOptionalValue(env.AQUAPULSE_AUTH_VERIFY_ALERT_ID) ?? "alert-1",
    verificationOwner:
      normalizeOptionalValue(env.AQUAPULSE_AUTH_VERIFY_OWNER) ?? "operator-verification",
    enableMutations: parseBoolean(env.AQUAPULSE_AUTH_VERIFY_ENABLE_MUTATIONS)
  };
}

export function deriveProtectedExpectation({
  effectiveAuthMode,
  sessionAvailabilityState
}) {
  if (effectiveAuthMode === "disabled" || effectiveAuthMode === "local") {
    return "success";
  }

  return sessionAvailabilityState === "authenticated_user" ? "success" : "unauthorized";
}

export function createVerifierRequestHeaders(config, extraHeaders = {}) {
  const headers = {
    accept: "application/json",
    ...extraHeaders
  };

  if (config.bearerToken) {
    headers.authorization = `Bearer ${config.bearerToken}`;
  }

  return headers;
}
