import {
  createVerifierRequestHeaders,
  normalizeBaseUrl,
  parseBoolean
} from "./auth-runtime-verifier.mjs";

function normalizeOptionalValue(value) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function normalizeSubscriptionMode(value) {
  const normalized = normalizeOptionalValue(value)?.toLowerCase();
  if (
    normalized === "direct" ||
    normalized === "proxy_bootstrap" ||
    normalized === "local_proxy_bootstrap"
  ) {
    return normalized === "direct" ? "direct" : "local_proxy_bootstrap";
  }

  return "auto";
}

function normalizeWebSocketUrl(value) {
  const parsed = new URL(value.trim());
  if (parsed.protocol !== "ws:" && parsed.protocol !== "wss:") {
    throw new Error(`Expected a websocket URL, received ${parsed.protocol}`);
  }

  return parsed.toString().replace(/\/+$/, "");
}

export function deriveAlertsLiveUpdatesWebSocketUrl({
  backendBaseUrl,
  gatewayPath,
  explicitWebSocketUrl,
  bearerToken
}) {
  const baseUrl = explicitWebSocketUrl
    ? normalizeWebSocketUrl(explicitWebSocketUrl)
    : (() => {
        const backendUrl = new URL(backendBaseUrl);
        const protocol = backendUrl.protocol === "https:" ? "wss:" : "ws:";
        const normalizedPath = gatewayPath.startsWith("/") ? gatewayPath : `/${gatewayPath}`;
        return `${protocol}//${backendUrl.host}${normalizedPath}`;
      })();

  const url = new URL(baseUrl);
  if (bearerToken) {
    url.searchParams.set("access_token", bearerToken);
  }

  return url.toString();
}

export function readAlertsLiveUpdatesVerificationConfig(env = process.env) {
  const webBaseUrl = normalizeBaseUrl(
    env.AQUAPULSE_ALERTS_VERIFY_WEB_BASE_URL ?? "http://localhost:3000"
  );
  const backendBaseUrl = normalizeBaseUrl(
    env.AQUAPULSE_ALERTS_VERIFY_API_BASE_URL ??
      env.AQUAPULSE_WEB_LOCAL_API_BACKEND_URL ??
      "http://localhost:4000"
  );

  return {
    webBaseUrl,
    backendBaseUrl,
    subscriptionMode: normalizeSubscriptionMode(
      env.AQUAPULSE_ALERTS_LIVE_VERIFY_WS_SUBSCRIPTION_MODE
    ),
    bootstrapEndpoint:
      normalizeOptionalValue(env.AQUAPULSE_ALERTS_LIVE_VERIFY_WS_BOOTSTRAP_URL) ??
      `${webBaseUrl}/api/alerts/live-updates/session`,
    bearerToken: normalizeOptionalValue(
      env.AQUAPULSE_ALERTS_LIVE_VERIFY_BEARER_TOKEN ??
        env.AQUAPULSE_AUTH_VERIFY_BEARER_TOKEN ??
        env.AQUAPULSE_WEB_AUTH_BEARER_TOKEN
    ),
    alertId: normalizeOptionalValue(env.AQUAPULSE_ALERTS_LIVE_VERIFY_ALERT_ID) ?? "alert-1",
    timeoutMs: Number(env.AQUAPULSE_ALERTS_LIVE_VERIFY_TIMEOUT_MS ?? 4000) || 4000,
    expectEnabled:
      env.AQUAPULSE_ALERTS_LIVE_VERIFY_EXPECT_ENABLED === undefined
        ? true
        : parseBoolean(env.AQUAPULSE_ALERTS_LIVE_VERIFY_EXPECT_ENABLED),
    webSocketUrl: normalizeOptionalValue(env.AQUAPULSE_ALERTS_LIVE_VERIFY_WS_URL),
    mutationPath:
      normalizeOptionalValue(env.AQUAPULSE_ALERTS_LIVE_VERIFY_MUTATION_PATH) ??
      "review-state",
    mutationBody: {
      reviewState: "under_review",
      reviewLabel: "live-updates-runtime-verifier",
      note: "Live updates runtime verification"
    }
  };
}

export function createAlertsLiveUpdatesVerifierHeaders(config, extraHeaders = {}) {
  return createVerifierRequestHeaders(config, extraHeaders);
}
