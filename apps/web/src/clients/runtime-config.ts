import type {
  AlertsRuntimeDiagnostics,
  AlertsLiveUpdatesSubscriptionTransport,
  AlertsLiveUpdatesBootstrapPayload,
  AlertsLiveUpdatesRuntimeDiagnostics,
  AquaPulseAuthMode,
  CurrentSessionPayload,
  FrontendAuthRuntimeDiagnostics,
  FrontendSessionBootstrapStatus,
  FeedRuntimeDiagnostics,
  FrontendRuntimeDiagnostics,
  PondsRuntimeDiagnostics,
  TasksRuntimeDiagnostics,
  WaterQualityRuntimeDiagnostics,
  LocalBridgeDiagnostics,
  RuntimeModeSummary,
  RuntimeWarning
} from "@aquapulse/types";
import { deriveFrontendSessionBootstrap } from "../features/auth-session";

export type AquaPulseClientRuntimeMode = "mock" | "http";
export type AquaPulseScopedRuntimeMode = AquaPulseClientRuntimeMode | "inherit";
export type AquaPulseHttpTransportMode = "proxy" | "direct";

export interface AquaPulseClientRuntimeConfig {
  readonly mode: AquaPulseClientRuntimeMode;
  readonly enablePlaceholderHttp?: boolean;
  readonly enableFetchHttp?: boolean;
  readonly httpBaseUrl?: string;
  readonly alertsMode?: AquaPulseScopedRuntimeMode;
  readonly alertsHttpBaseUrl?: string;
  readonly alertsHttpTransport?: AquaPulseHttpTransportMode;
  readonly alertsLiveUpdatesEnabled?: boolean;
  readonly alertsLiveUpdatesBaseUrl?: string;
  readonly alertsLiveUpdatesAuthToken?: string;
  readonly alertsLiveUpdatesSubscriptionTransport?: AlertsLiveUpdatesSubscriptionTransport;
  readonly alertsLiveUpdatesBootstrapPath?: string;
  readonly pondsMode?: AquaPulseScopedRuntimeMode;
  readonly pondsHttpBaseUrl?: string;
  readonly pondsHttpTransport?: AquaPulseHttpTransportMode;
  readonly feedMode?: AquaPulseScopedRuntimeMode;
  readonly feedHttpBaseUrl?: string;
  readonly feedHttpTransport?: AquaPulseHttpTransportMode;
  readonly tasksMode?: AquaPulseScopedRuntimeMode;
  readonly tasksHttpBaseUrl?: string;
  readonly tasksHttpTransport?: AquaPulseHttpTransportMode;
  readonly waterQualityMode?: AquaPulseScopedRuntimeMode;
  readonly waterQualityHttpBaseUrl?: string;
  readonly waterQualityHttpTransport?: AquaPulseHttpTransportMode;
  readonly localApiBackendUrl?: string;
  readonly authMode?: AquaPulseAuthMode;
  readonly keycloakIssuerUrl?: string;
  readonly keycloakRealm?: string;
  readonly keycloakClientId?: string;
  readonly localAuthUserLabel?: string;
  readonly warnings?: readonly RuntimeWarning[];
}

export interface AquaPulseClientRuntimeEnv {
  readonly AQUAPULSE_WEB_CLIENT_MODE?: string;
  readonly AQUAPULSE_WEB_ENABLE_PLACEHOLDER_HTTP?: string;
  readonly AQUAPULSE_WEB_ENABLE_FETCH_HTTP?: string;
  readonly AQUAPULSE_WEB_HTTP_BASE_URL?: string;
  readonly AQUAPULSE_WEB_ALERTS_MODE?: string;
  readonly AQUAPULSE_WEB_ALERTS_HTTP_BASE_URL?: string;
  readonly AQUAPULSE_WEB_ALERTS_HTTP_TRANSPORT?: string;
  readonly AQUAPULSE_WEB_ALERTS_LIVE_UPDATES?: string;
  readonly AQUAPULSE_WEB_ALERTS_WS_BASE_URL?: string;
  readonly AQUAPULSE_WEB_ALERTS_WS_AUTH_TOKEN?: string;
  readonly AQUAPULSE_WEB_ALERTS_WS_SUBSCRIPTION_MODE?: string;
  readonly AQUAPULSE_WEB_PONDS_MODE?: string;
  readonly AQUAPULSE_WEB_PONDS_HTTP_BASE_URL?: string;
  readonly AQUAPULSE_WEB_PONDS_HTTP_TRANSPORT?: string;
  readonly AQUAPULSE_WEB_FEED_MODE?: string;
  readonly AQUAPULSE_WEB_FEED_HTTP_BASE_URL?: string;
  readonly AQUAPULSE_WEB_FEED_HTTP_TRANSPORT?: string;
  readonly AQUAPULSE_WEB_TASKS_MODE?: string;
  readonly AQUAPULSE_WEB_TASKS_HTTP_BASE_URL?: string;
  readonly AQUAPULSE_WEB_TASKS_HTTP_TRANSPORT?: string;
  readonly AQUAPULSE_WEB_LOCAL_API_BACKEND_URL?: string;
  readonly AQUAPULSE_WEB_AUTH_MODE?: string;
  readonly AQUAPULSE_WEB_KEYCLOAK_ISSUER_URL?: string;
  readonly AQUAPULSE_WEB_KEYCLOAK_REALM?: string;
  readonly AQUAPULSE_WEB_KEYCLOAK_CLIENT_ID?: string;
  readonly AQUAPULSE_WEB_LOCAL_AUTH_USER_LABEL?: string;
  readonly NEXT_PUBLIC_AQUAPULSE_WEB_CLIENT_MODE?: string;
  readonly NEXT_PUBLIC_AQUAPULSE_WEB_ENABLE_PLACEHOLDER_HTTP?: string;
  readonly NEXT_PUBLIC_AQUAPULSE_WEB_ENABLE_FETCH_HTTP?: string;
  readonly NEXT_PUBLIC_AQUAPULSE_WEB_HTTP_BASE_URL?: string;
  readonly NEXT_PUBLIC_AQUAPULSE_WEB_ALERTS_MODE?: string;
  readonly NEXT_PUBLIC_AQUAPULSE_WEB_ALERTS_HTTP_BASE_URL?: string;
  readonly NEXT_PUBLIC_AQUAPULSE_WEB_ALERTS_HTTP_TRANSPORT?: string;
  readonly NEXT_PUBLIC_AQUAPULSE_WEB_ALERTS_LIVE_UPDATES?: string;
  readonly NEXT_PUBLIC_AQUAPULSE_WEB_ALERTS_WS_BASE_URL?: string;
  readonly NEXT_PUBLIC_AQUAPULSE_WEB_ALERTS_WS_AUTH_TOKEN?: string;
  readonly NEXT_PUBLIC_AQUAPULSE_WEB_ALERTS_WS_SUBSCRIPTION_MODE?: string;
  readonly NEXT_PUBLIC_AQUAPULSE_WEB_PONDS_MODE?: string;
  readonly NEXT_PUBLIC_AQUAPULSE_WEB_PONDS_HTTP_BASE_URL?: string;
  readonly NEXT_PUBLIC_AQUAPULSE_WEB_PONDS_HTTP_TRANSPORT?: string;
  readonly NEXT_PUBLIC_AQUAPULSE_WEB_FEED_MODE?: string;
  readonly NEXT_PUBLIC_AQUAPULSE_WEB_FEED_HTTP_BASE_URL?: string;
  readonly NEXT_PUBLIC_AQUAPULSE_WEB_FEED_HTTP_TRANSPORT?: string;
  readonly NEXT_PUBLIC_AQUAPULSE_WEB_TASKS_MODE?: string;
  readonly NEXT_PUBLIC_AQUAPULSE_WEB_TASKS_HTTP_BASE_URL?: string;
  readonly NEXT_PUBLIC_AQUAPULSE_WEB_TASKS_HTTP_TRANSPORT?: string;
  readonly NEXT_PUBLIC_AQUAPULSE_WEB_AUTH_MODE?: string;
  readonly NEXT_PUBLIC_AQUAPULSE_WEB_KEYCLOAK_ISSUER_URL?: string;
  readonly NEXT_PUBLIC_AQUAPULSE_WEB_KEYCLOAK_REALM?: string;
  readonly NEXT_PUBLIC_AQUAPULSE_WEB_KEYCLOAK_CLIENT_ID?: string;
  readonly NEXT_PUBLIC_AQUAPULSE_WEB_LOCAL_AUTH_USER_LABEL?: string;
  readonly AQUAPULSE_WEB_WATER_QUALITY_MODE?: string;
  readonly AQUAPULSE_WEB_WATER_QUALITY_HTTP_BASE_URL?: string;
  readonly AQUAPULSE_WEB_WATER_QUALITY_HTTP_TRANSPORT?: string;
  readonly NEXT_PUBLIC_AQUAPULSE_WEB_WATER_QUALITY_MODE?: string;
  readonly NEXT_PUBLIC_AQUAPULSE_WEB_WATER_QUALITY_HTTP_BASE_URL?: string;
  readonly NEXT_PUBLIC_AQUAPULSE_WEB_WATER_QUALITY_HTTP_TRANSPORT?: string;
}

function parseBooleanFlag(value: string | undefined): boolean {
  const normalizedValue = value?.trim().toLowerCase();
  return normalizedValue === "1" || normalizedValue === "true" || normalizedValue === "yes" || normalizedValue === "on";
}

function normalizeEnvValue(value: string | undefined): string | undefined {
  const trimmedValue = value?.trim();
  return trimmedValue ? trimmedValue : undefined;
}

export function parseClientRuntimeMode(value: string | undefined): AquaPulseClientRuntimeMode {
  return normalizeEnvValue(value)?.toLowerCase() === "http" ? "http" : "mock";
}

export function parseScopedClientRuntimeMode(value: string | undefined): AquaPulseScopedRuntimeMode {
  const normalizedValue = normalizeEnvValue(value)?.toLowerCase();
  return normalizedValue === "http" || normalizedValue === "mock" ? normalizedValue : "inherit";
}

export function parseHttpTransportMode(value: string | undefined): AquaPulseHttpTransportMode {
  return normalizeEnvValue(value)?.toLowerCase() === "direct" ? "direct" : "proxy";
}

export function parseAuthMode(value: string | undefined): AquaPulseAuthMode {
  const normalizedValue = normalizeEnvValue(value)?.toLowerCase();
  if (normalizedValue === "local" || normalizedValue === "keycloak") {
    return normalizedValue;
  }

  return "disabled";
}

export function parseAlertsLiveUpdatesSubscriptionTransport(
  value: string | undefined,
  alertsHttpTransport?: AquaPulseHttpTransportMode
): AlertsLiveUpdatesSubscriptionTransport {
  const normalizedValue = normalizeEnvValue(value)?.toLowerCase();
  if (normalizedValue === "direct") {
    return "direct";
  }

  if (
    normalizedValue === "proxy" ||
    normalizedValue === "proxy_bootstrap" ||
    normalizedValue === "local_proxy_bootstrap"
  ) {
    return "local_proxy_bootstrap";
  }

  return alertsHttpTransport === "proxy" ? "local_proxy_bootstrap" : "direct";
}

function tryParseAbsoluteHttpUrl(value: string): string | undefined {
  try {
    const parsedUrl = new URL(value);
    if (parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:") {
      return parsedUrl.toString().replace(/\/+$/, "");
    }
  } catch {
    return undefined;
  }

  return undefined;
}

function normalizeHttpBaseUrl(
  value: string | undefined,
  warnings: RuntimeWarning[],
  label: string
): string | undefined {
  const normalizedValue = normalizeEnvValue(value);

  if (!normalizedValue) {
    return undefined;
  }

  if (normalizedValue.startsWith("/")) {
    return normalizedValue.replace(/\/+$/, "");
  }

  const parsedUrl = tryParseAbsoluteHttpUrl(normalizedValue);
  if (parsedUrl) {
    return parsedUrl;
  }

  warnings.push({
    code: "INVALID_HTTP_URL",
    message: `${label} was ignored because it is not a valid http/https URL.`
  });
  return undefined;
}

function normalizeSocketBaseUrl(
  value: string | undefined,
  warnings: RuntimeWarning[],
  label: string
): string | undefined {
  const normalizedValue = normalizeEnvValue(value);

  if (!normalizedValue) {
    return undefined;
  }

  try {
    const parsedUrl = new URL(normalizedValue);
    if (
      parsedUrl.protocol === "ws:" ||
      parsedUrl.protocol === "wss:" ||
      parsedUrl.protocol === "http:" ||
      parsedUrl.protocol === "https:"
    ) {
      return parsedUrl.toString().replace(/\/+$/, "");
    }
  } catch {
    warnings.push({
      code: "INVALID_SOCKET_URL",
      message: `${label} was ignored because it is not a valid ws/wss/http/https URL.`
    });
    return undefined;
  }

  warnings.push({
    code: "INVALID_SOCKET_URL",
    message: `${label} was ignored because it is not a valid ws/wss/http/https URL.`
  });
  return undefined;
}

function coalesceEnvValue(
  ...values: Array<string | undefined>
): string | undefined {
  return values.find((value) => typeof value === "string" && value.length > 0);
}

export function parseClientRuntimeConfig(
  env: AquaPulseClientRuntimeEnv = {}
): AquaPulseClientRuntimeConfig {
  const warnings: RuntimeWarning[] = [];
  const mode = parseClientRuntimeMode(
    coalesceEnvValue(env.AQUAPULSE_WEB_CLIENT_MODE, env.NEXT_PUBLIC_AQUAPULSE_WEB_CLIENT_MODE)
  );
  const enablePlaceholderHttp = parseBooleanFlag(
    coalesceEnvValue(
      env.AQUAPULSE_WEB_ENABLE_PLACEHOLDER_HTTP,
      env.NEXT_PUBLIC_AQUAPULSE_WEB_ENABLE_PLACEHOLDER_HTTP
    )
  );
  const enableFetchHttp = parseBooleanFlag(
    coalesceEnvValue(
      env.AQUAPULSE_WEB_ENABLE_FETCH_HTTP,
      env.NEXT_PUBLIC_AQUAPULSE_WEB_ENABLE_FETCH_HTTP
    )
  );
  const httpBaseUrl = normalizeHttpBaseUrl(
    env.AQUAPULSE_WEB_HTTP_BASE_URL,
    warnings,
    "AQUAPULSE_WEB_HTTP_BASE_URL"
  ) ?? normalizeHttpBaseUrl(
    env.NEXT_PUBLIC_AQUAPULSE_WEB_HTTP_BASE_URL,
    warnings,
    "NEXT_PUBLIC_AQUAPULSE_WEB_HTTP_BASE_URL"
  );
  const alertsMode = parseScopedClientRuntimeMode(
    coalesceEnvValue(env.AQUAPULSE_WEB_ALERTS_MODE, env.NEXT_PUBLIC_AQUAPULSE_WEB_ALERTS_MODE)
  );
  const alertsHttpBaseUrl = normalizeHttpBaseUrl(
    env.AQUAPULSE_WEB_ALERTS_HTTP_BASE_URL,
    warnings,
    "AQUAPULSE_WEB_ALERTS_HTTP_BASE_URL"
  ) ?? normalizeHttpBaseUrl(
    env.NEXT_PUBLIC_AQUAPULSE_WEB_ALERTS_HTTP_BASE_URL,
    warnings,
    "NEXT_PUBLIC_AQUAPULSE_WEB_ALERTS_HTTP_BASE_URL"
  );
  const alertsHttpTransport = parseHttpTransportMode(
    coalesceEnvValue(
      env.AQUAPULSE_WEB_ALERTS_HTTP_TRANSPORT,
      env.NEXT_PUBLIC_AQUAPULSE_WEB_ALERTS_HTTP_TRANSPORT
    )
  );
  const alertsLiveUpdatesEnabled = parseBooleanFlag(
    coalesceEnvValue(
      env.AQUAPULSE_WEB_ALERTS_LIVE_UPDATES,
      env.NEXT_PUBLIC_AQUAPULSE_WEB_ALERTS_LIVE_UPDATES
    )
  );
  const alertsLiveUpdatesBaseUrl = normalizeSocketBaseUrl(
    env.AQUAPULSE_WEB_ALERTS_WS_BASE_URL,
    warnings,
    "AQUAPULSE_WEB_ALERTS_WS_BASE_URL"
  ) ?? normalizeSocketBaseUrl(
    env.NEXT_PUBLIC_AQUAPULSE_WEB_ALERTS_WS_BASE_URL,
    warnings,
    "NEXT_PUBLIC_AQUAPULSE_WEB_ALERTS_WS_BASE_URL"
  );
  const alertsLiveUpdatesAuthToken = normalizeEnvValue(
    coalesceEnvValue(
      env.AQUAPULSE_WEB_ALERTS_WS_AUTH_TOKEN,
      env.NEXT_PUBLIC_AQUAPULSE_WEB_ALERTS_WS_AUTH_TOKEN
    )
  );
  const alertsLiveUpdatesSubscriptionTransport = parseAlertsLiveUpdatesSubscriptionTransport(
    coalesceEnvValue(
      env.AQUAPULSE_WEB_ALERTS_WS_SUBSCRIPTION_MODE,
      env.NEXT_PUBLIC_AQUAPULSE_WEB_ALERTS_WS_SUBSCRIPTION_MODE
    ),
    alertsHttpTransport
  );
  const feedMode = parseScopedClientRuntimeMode(
    coalesceEnvValue(env.AQUAPULSE_WEB_FEED_MODE, env.NEXT_PUBLIC_AQUAPULSE_WEB_FEED_MODE)
  );
  const pondsMode = parseScopedClientRuntimeMode(
    coalesceEnvValue(env.AQUAPULSE_WEB_PONDS_MODE, env.NEXT_PUBLIC_AQUAPULSE_WEB_PONDS_MODE)
  );
  const pondsHttpBaseUrl = normalizeHttpBaseUrl(
    env.AQUAPULSE_WEB_PONDS_HTTP_BASE_URL,
    warnings,
    "AQUAPULSE_WEB_PONDS_HTTP_BASE_URL"
  ) ?? normalizeHttpBaseUrl(
    env.NEXT_PUBLIC_AQUAPULSE_WEB_PONDS_HTTP_BASE_URL,
    warnings,
    "NEXT_PUBLIC_AQUAPULSE_WEB_PONDS_HTTP_BASE_URL"
  );
  const pondsHttpTransport = parseHttpTransportMode(
    coalesceEnvValue(
      env.AQUAPULSE_WEB_PONDS_HTTP_TRANSPORT,
      env.NEXT_PUBLIC_AQUAPULSE_WEB_PONDS_HTTP_TRANSPORT
    )
  );
  const feedHttpBaseUrl = normalizeHttpBaseUrl(
    env.AQUAPULSE_WEB_FEED_HTTP_BASE_URL,
    warnings,
    "AQUAPULSE_WEB_FEED_HTTP_BASE_URL"
  ) ?? normalizeHttpBaseUrl(
    env.NEXT_PUBLIC_AQUAPULSE_WEB_FEED_HTTP_BASE_URL,
    warnings,
    "NEXT_PUBLIC_AQUAPULSE_WEB_FEED_HTTP_BASE_URL"
  );
  const feedHttpTransport = parseHttpTransportMode(
    coalesceEnvValue(
      env.AQUAPULSE_WEB_FEED_HTTP_TRANSPORT,
      env.NEXT_PUBLIC_AQUAPULSE_WEB_FEED_HTTP_TRANSPORT
    )
  );
  const tasksMode = parseScopedClientRuntimeMode(
    coalesceEnvValue(env.AQUAPULSE_WEB_TASKS_MODE, env.NEXT_PUBLIC_AQUAPULSE_WEB_TASKS_MODE)
  );
  const tasksHttpBaseUrl = normalizeHttpBaseUrl(
    env.AQUAPULSE_WEB_TASKS_HTTP_BASE_URL,
    warnings,
    "AQUAPULSE_WEB_TASKS_HTTP_BASE_URL"
  ) ?? normalizeHttpBaseUrl(
    env.NEXT_PUBLIC_AQUAPULSE_WEB_TASKS_HTTP_BASE_URL,
    warnings,
    "NEXT_PUBLIC_AQUAPULSE_WEB_TASKS_HTTP_BASE_URL"
  );
  const tasksHttpTransport = parseHttpTransportMode(
    coalesceEnvValue(
      env.AQUAPULSE_WEB_TASKS_HTTP_TRANSPORT,
      env.NEXT_PUBLIC_AQUAPULSE_WEB_TASKS_HTTP_TRANSPORT
    )
  );
  const waterQualityMode = parseScopedClientRuntimeMode(
    coalesceEnvValue(
      env.AQUAPULSE_WEB_WATER_QUALITY_MODE,
      env.NEXT_PUBLIC_AQUAPULSE_WEB_WATER_QUALITY_MODE
    )
  );
  const waterQualityHttpBaseUrl = normalizeHttpBaseUrl(
    env.AQUAPULSE_WEB_WATER_QUALITY_HTTP_BASE_URL,
    warnings,
    "AQUAPULSE_WEB_WATER_QUALITY_HTTP_BASE_URL"
  ) ?? normalizeHttpBaseUrl(
    env.NEXT_PUBLIC_AQUAPULSE_WEB_WATER_QUALITY_HTTP_BASE_URL,
    warnings,
    "NEXT_PUBLIC_AQUAPULSE_WEB_WATER_QUALITY_HTTP_BASE_URL"
  );
  const waterQualityHttpTransport = parseHttpTransportMode(
    coalesceEnvValue(
      env.AQUAPULSE_WEB_WATER_QUALITY_HTTP_TRANSPORT,
      env.NEXT_PUBLIC_AQUAPULSE_WEB_WATER_QUALITY_HTTP_TRANSPORT
    )
  );
  const authMode = parseAuthMode(
    coalesceEnvValue(env.AQUAPULSE_WEB_AUTH_MODE, env.NEXT_PUBLIC_AQUAPULSE_WEB_AUTH_MODE)
  );
  const keycloakIssuerUrl = normalizeHttpBaseUrl(
    env.AQUAPULSE_WEB_KEYCLOAK_ISSUER_URL,
    warnings,
    "AQUAPULSE_WEB_KEYCLOAK_ISSUER_URL"
  ) ?? normalizeHttpBaseUrl(
    env.NEXT_PUBLIC_AQUAPULSE_WEB_KEYCLOAK_ISSUER_URL,
    warnings,
    "NEXT_PUBLIC_AQUAPULSE_WEB_KEYCLOAK_ISSUER_URL"
  );
  const keycloakRealm = normalizeEnvValue(
    coalesceEnvValue(env.AQUAPULSE_WEB_KEYCLOAK_REALM, env.NEXT_PUBLIC_AQUAPULSE_WEB_KEYCLOAK_REALM)
  );
  const keycloakClientId = normalizeEnvValue(
    coalesceEnvValue(
      env.AQUAPULSE_WEB_KEYCLOAK_CLIENT_ID,
      env.NEXT_PUBLIC_AQUAPULSE_WEB_KEYCLOAK_CLIENT_ID
    )
  );
  const localAuthUserLabel =
    normalizeEnvValue(
      coalesceEnvValue(
        env.AQUAPULSE_WEB_LOCAL_AUTH_USER_LABEL,
        env.NEXT_PUBLIC_AQUAPULSE_WEB_LOCAL_AUTH_USER_LABEL
      )
    ) ?? "Local Operator";

  if (authMode === "keycloak" && (!keycloakIssuerUrl || !keycloakRealm || !keycloakClientId)) {
    warnings.push({
      code: "AUTH_KEYCLOAK_CONFIG_INCOMPLETE",
      message:
        "Keycloak auth mode was requested in web runtime config, but issuer URL, realm, or client ID is missing. The frontend remains on the safe auth-disabled posture."
    });
  }

  if (alertsMode === "http" && !enableFetchHttp && !enablePlaceholderHttp) {
    warnings.push({
      code: "ALERTS_HTTP_DISABLED",
      message:
        "Alerts HTTP mode was requested, but no HTTP executor is enabled. Alerts will remain mock-backed."
    });
  }

  if (pondsMode === "http" && !enableFetchHttp && !enablePlaceholderHttp) {
    warnings.push({
      code: "PONDS_HTTP_DISABLED",
      message:
        "Ponds HTTP mode was requested, but no HTTP executor is enabled. Ponds will remain mock-backed."
    });
  }

  if (feedMode === "http" && !enableFetchHttp && !enablePlaceholderHttp) {
    warnings.push({
      code: "FEED_HTTP_DISABLED",
      message:
        "Feed HTTP mode was requested, but no HTTP executor is enabled. Feed will remain mock-backed."
    });
  }

  if (tasksMode === "http" && !enableFetchHttp && !enablePlaceholderHttp) {
    warnings.push({
      code: "TASKS_HTTP_DISABLED",
      message:
        "Tasks HTTP mode was requested, but no HTTP executor is enabled. Tasks will remain mock-backed."
    });
  }

  if (waterQualityMode === "http" && !enableFetchHttp && !enablePlaceholderHttp) {
    warnings.push({
      code: "WATER_QUALITY_HTTP_DISABLED",
      message:
        "Water-quality HTTP mode was requested, but no HTTP executor is enabled. Water-quality will remain mock-backed."
    });
  }

  return {
    mode: mode === "http" && enablePlaceholderHttp ? "http" : "mock",
    enablePlaceholderHttp,
    enableFetchHttp,
    httpBaseUrl,
    alertsMode,
    alertsHttpBaseUrl: alertsHttpBaseUrl ?? httpBaseUrl,
    alertsHttpTransport,
    alertsLiveUpdatesEnabled,
    alertsLiveUpdatesBaseUrl,
    alertsLiveUpdatesAuthToken,
    alertsLiveUpdatesSubscriptionTransport,
    alertsLiveUpdatesBootstrapPath: "/api/alerts/live-updates/session",
    pondsMode,
    pondsHttpBaseUrl: pondsHttpBaseUrl ?? httpBaseUrl,
    pondsHttpTransport,
    feedMode,
    feedHttpBaseUrl: feedHttpBaseUrl ?? httpBaseUrl,
    feedHttpTransport,
    tasksMode,
    tasksHttpBaseUrl: tasksHttpBaseUrl ?? httpBaseUrl,
    tasksHttpTransport,
    waterQualityMode,
    waterQualityHttpBaseUrl: waterQualityHttpBaseUrl ?? httpBaseUrl,
    waterQualityHttpTransport,
    localApiBackendUrl: normalizeHttpBaseUrl(
      env.AQUAPULSE_WEB_LOCAL_API_BACKEND_URL,
      warnings,
      "AQUAPULSE_WEB_LOCAL_API_BACKEND_URL"
    ),
    authMode,
    keycloakIssuerUrl,
    keycloakRealm,
    keycloakClientId,
    localAuthUserLabel,
    warnings
  };
}

export function resolveAlertsHttpBaseUrl(
  config: AquaPulseClientRuntimeConfig
): string | undefined {
  if (config.alertsMode === "http" && (config.alertsHttpTransport ?? "proxy") === "proxy") {
    return "";
  }

  if (config.alertsHttpBaseUrl) {
    return config.alertsHttpBaseUrl;
  }

  if (config.alertsMode === "http" && config.enableFetchHttp) {
    return "";
  }

  return config.httpBaseUrl;
}

function coerceHttpUrlToWebSocketBaseUrl(value: string): string {
  if (value.startsWith("ws://") || value.startsWith("wss://")) {
    return value.replace(/\/+$/, "");
  }

  if (value.startsWith("https://")) {
    return `wss://${value.slice("https://".length).replace(/\/+$/, "")}`;
  }

  if (value.startsWith("http://")) {
    return `ws://${value.slice("http://".length).replace(/\/+$/, "")}`;
  }

  return value.replace(/\/+$/, "");
}

export function resolveAlertsLiveUpdatesBaseUrl(
  config: AquaPulseClientRuntimeConfig
): string | undefined {
  if (config.alertsLiveUpdatesSubscriptionTransport === "local_proxy_bootstrap") {
    return undefined;
  }

  if (config.alertsLiveUpdatesBaseUrl) {
    return coerceHttpUrlToWebSocketBaseUrl(config.alertsLiveUpdatesBaseUrl);
  }

  const alertsHttpBaseUrl = resolveAlertsHttpBaseUrl(config);
  if (
    config.alertsLiveUpdatesEnabled &&
    config.alertsMode === "http" &&
    alertsHttpBaseUrl &&
    !alertsHttpBaseUrl.startsWith("/")
  ) {
    return `${coerceHttpUrlToWebSocketBaseUrl(alertsHttpBaseUrl)}/ws/alerts`;
  }

  return undefined;
}

export function resolveFeedHttpBaseUrl(
  config: AquaPulseClientRuntimeConfig
): string | undefined {
  if (config.feedMode === "http" && (config.feedHttpTransport ?? "proxy") === "proxy") {
    return "";
  }

  if (config.feedHttpBaseUrl) {
    return config.feedHttpBaseUrl;
  }

  if (config.feedMode === "http" && config.enableFetchHttp) {
    return "";
  }

  return config.httpBaseUrl;
}

export function resolvePondsHttpBaseUrl(
  config: AquaPulseClientRuntimeConfig
): string | undefined {
  if (config.pondsMode === "http" && (config.pondsHttpTransport ?? "proxy") === "proxy") {
    return "";
  }

  if (config.pondsHttpBaseUrl) {
    return config.pondsHttpBaseUrl;
  }

  if (config.pondsMode === "http" && config.enableFetchHttp) {
    return "";
  }

  return config.httpBaseUrl;
}

export function resolveWaterQualityHttpBaseUrl(
  config: AquaPulseClientRuntimeConfig
): string | undefined {
  if (
    config.waterQualityMode === "http" &&
    (config.waterQualityHttpTransport ?? "proxy") === "proxy"
  ) {
    return "";
  }

  if (config.waterQualityHttpBaseUrl) {
    return config.waterQualityHttpBaseUrl;
  }

  if (config.waterQualityMode === "http" && config.enableFetchHttp) {
    return "";
  }

  return config.httpBaseUrl;
}

export function resolveTasksHttpBaseUrl(
  config: AquaPulseClientRuntimeConfig
): string | undefined {
  if (config.tasksMode === "http" && (config.tasksHttpTransport ?? "proxy") === "proxy") {
    return "";
  }

  if (config.tasksHttpBaseUrl) {
    return config.tasksHttpBaseUrl;
  }

  if (config.tasksMode === "http" && config.enableFetchHttp) {
    return "";
  }

  return config.httpBaseUrl;
}

export function getAlertsRuntimeDiagnostics(
  config: AquaPulseClientRuntimeConfig
): AlertsRuntimeDiagnostics {
  const alertsHttpRequested = config.alertsMode === "http";
  const alertsHttpEnabled =
    alertsHttpRequested && Boolean(config.enableFetchHttp || config.enablePlaceholderHttp);
  const effectiveMode: AquaPulseClientRuntimeMode =
    alertsHttpEnabled || config.mode === "http" ? "http" : "mock";
  const resolvedBaseUrl = resolveAlertsHttpBaseUrl(config);
  const usesLocalProxy = effectiveMode === "http" && (!resolvedBaseUrl || resolvedBaseUrl.startsWith("/"));
  const targetLabel =
    effectiveMode === "mock"
      ? "mock adapters"
      : usesLocalProxy
        ? "/api/alerts local bridge"
        : `${resolvedBaseUrl}/api/alerts`;

  return {
    requestedMode: config.alertsMode ?? "inherit",
    effectiveMode,
    usesLocalProxy,
    transport: effectiveMode === "mock" ? "mock" : usesLocalProxy ? "proxy" : "direct",
    targetLabel,
    scopeLabel: alertsHttpRequested ? "alerts-only opt-in" : config.mode === "http" ? "global runtime" : "default mock runtime",
    warnings: [...(config.warnings ?? [])]
  };
}

export function getPondsRuntimeDiagnostics(
  config: AquaPulseClientRuntimeConfig
): PondsRuntimeDiagnostics {
  const pondsHttpRequested = config.pondsMode === "http";
  const pondsHttpEnabled =
    pondsHttpRequested && Boolean(config.enableFetchHttp || config.enablePlaceholderHttp);
  const effectiveMode: AquaPulseClientRuntimeMode =
    pondsHttpEnabled || config.mode === "http" ? "http" : "mock";
  const resolvedBaseUrl = resolvePondsHttpBaseUrl(config);
  const usesLocalProxy = effectiveMode === "http" && (!resolvedBaseUrl || resolvedBaseUrl.startsWith("/"));
  const targetLabel =
    effectiveMode === "mock"
      ? "mock adapters"
      : usesLocalProxy
        ? "/api/ponds local bridge"
        : `${resolvedBaseUrl}/api/ponds`;

  return {
    requestedMode: config.pondsMode ?? "inherit",
    effectiveMode,
    usesLocalProxy,
    transport: effectiveMode === "mock" ? "mock" : usesLocalProxy ? "proxy" : "direct",
    targetLabel,
    scopeLabel:
      pondsHttpRequested
        ? "ponds-only opt-in"
        : config.mode === "http"
          ? "global runtime"
          : "default mock runtime",
    warnings: [...(config.warnings ?? [])]
  };
}

export function getAlertsLiveUpdatesRuntimeDiagnostics(
  config: AquaPulseClientRuntimeConfig,
  options: {
    readonly auth?: FrontendAuthRuntimeDiagnostics;
    readonly session?: FrontendSessionBootstrapStatus;
  } = {}
): AlertsLiveUpdatesRuntimeDiagnostics {
  const requested = Boolean(config.alertsLiveUpdatesEnabled);
  const alertsRuntime = getAlertsRuntimeDiagnostics(config);
  const resolvedBaseUrl = resolveAlertsLiveUpdatesBaseUrl(config);
  const auth =
    options.auth ??
    getAuthRuntimeDiagnostics(config, {
      forwardedAuthPresent: false,
      forwardingSource: "none"
    });
  const session = options.session ?? deriveFrontendSessionBootstrap(auth);
  const warnings: RuntimeWarning[] = [...(config.warnings ?? [])];
  const subscriptionTransport = config.alertsLiveUpdatesSubscriptionTransport ?? "direct";

  if (requested && alertsRuntime.effectiveMode !== "http") {
    warnings.push({
      code: "ALERTS_LIVE_UPDATES_HTTP_REQUIRED",
      message:
        "Alerts live updates are opt-in on top of alerts HTTP mode. Enable alerts HTTP mode before expecting websocket refresh events."
    });
  }

  if (requested && subscriptionTransport !== "local_proxy_bootstrap" && !resolvedBaseUrl) {
    warnings.push({
      code: "ALERTS_LIVE_UPDATES_TARGET_MISSING",
      message:
        "Alerts live updates were enabled, but no websocket target could be derived. Set NEXT_PUBLIC_AQUAPULSE_WEB_ALERTS_WS_BASE_URL or use direct alerts HTTP mode with a backend base URL."
    });
  }

  const enabled =
    requested &&
    alertsRuntime.effectiveMode === "http" &&
    (config.alertsLiveUpdatesSubscriptionTransport === "local_proxy_bootstrap" ||
      Boolean(resolvedBaseUrl));
  const proxyBootstrapPathLabel =
    subscriptionTransport === "local_proxy_bootstrap"
      ? config.alertsLiveUpdatesBootstrapPath ?? "/api/alerts/live-updates/session"
      : undefined;
  const websocketAuthConfigured =
    auth.effectiveMode === "keycloak"
      ? subscriptionTransport === "local_proxy_bootstrap"
        ? auth.forwardedAuthPresent
        : Boolean(config.alertsLiveUpdatesAuthToken)
      : Boolean(config.alertsLiveUpdatesAuthToken);
  const currentSessionSufficient =
    auth.effectiveMode !== "keycloak" || session.availabilityState === "authenticated_user";

  let subscriptionAuthState: AlertsLiveUpdatesRuntimeDiagnostics["subscriptionAuthState"];
  if (!requested) {
    subscriptionAuthState = "disabled";
  } else if (!enabled) {
    subscriptionAuthState = "unavailable";
  } else if (auth.requestedMode === "keycloak" && auth.effectiveMode === "disabled") {
    subscriptionAuthState = "degraded";
  } else if (auth.effectiveMode === "keycloak" && !websocketAuthConfigured) {
    subscriptionAuthState = "degraded";
    warnings.push({
      code:
        subscriptionTransport === "local_proxy_bootstrap"
          ? "ALERTS_LIVE_UPDATES_PROXY_FORWARDING_UNAVAILABLE"
          : "ALERTS_LIVE_UPDATES_WS_AUTH_TOKEN_MISSING",
      message:
        subscriptionTransport === "local_proxy_bootstrap"
          ? "Alerts live updates are protected in Keycloak mode, but the local websocket bootstrap route does not have forwardable auth yet. Provide a bounded forwarded token or cookie for the local web bridge."
          : "Alerts live updates are protected in Keycloak mode, but no local websocket auth token is configured. Set NEXT_PUBLIC_AQUAPULSE_WEB_ALERTS_WS_AUTH_TOKEN only for bounded local verification."
    });
  } else if (auth.effectiveMode === "keycloak" && !currentSessionSufficient) {
    subscriptionAuthState = "degraded";
    warnings.push({
      code: "ALERTS_LIVE_UPDATES_SESSION_MISMATCH",
      message:
        "Alerts live updates have websocket auth configured, but the current frontend session is not authenticated yet. HTTP auth/session and websocket auth are mismatched."
    });
  } else if (auth.effectiveMode === "keycloak") {
    subscriptionAuthState = "authenticated";
  } else {
    subscriptionAuthState = "bypassed_local";
  }

  return {
    requested,
    enabled,
    targetLabel: requested
      ? subscriptionTransport === "local_proxy_bootstrap"
        ? proxyBootstrapPathLabel ?? "target not configured"
        : resolvedBaseUrl
          ? resolvedBaseUrl
          : "target not configured"
      : "disabled",
    connectionState:
      !requested
        ? "disabled"
        : subscriptionAuthState === "degraded"
          ? "degraded"
          : enabled
            ? "inactive"
            : "unavailable",
    subscriptionAuthState,
    subscriptionTransport,
    credentialMode:
      !requested || !enabled
        ? "none"
        : subscriptionTransport === "local_proxy_bootstrap"
          ? "ephemeral_ticket"
          : auth.effectiveMode === "keycloak" && Boolean(config.alertsLiveUpdatesAuthToken)
            ? "direct_bearer"
            : "none",
    proxyBootstrapPathLabel,
    proxyBootstrapAvailable:
      subscriptionTransport === "local_proxy_bootstrap" &&
      alertsRuntime.effectiveMode === "http" &&
      Boolean(proxyBootstrapPathLabel),
    authMode: auth.effectiveMode,
    websocketAuthConfigured,
    currentSessionSufficient,
    fallbackMode: "manual_refresh",
    warnings
  };
}

function isAlertsLiveUpdatesBootstrapPayload(
  value: unknown
): value is AlertsLiveUpdatesBootstrapPayload {
  return Boolean(
    value &&
      typeof value === "object" &&
      "requested" in value &&
      "enabled" in value &&
      "subscriptionTransport" in value &&
      "credentialMode" in value &&
      "subscriptionAuthState" in value &&
      "authMode" in value &&
      "forwardedAuthPresent" in value
  );
}

export function isAlertsLiveUpdatesBootstrapEnvelope(
  value: unknown
): value is { readonly ok: true; readonly data: AlertsLiveUpdatesBootstrapPayload } {
  return Boolean(
    value &&
      typeof value === "object" &&
      "ok" in value &&
      (value as { readonly ok?: unknown }).ok === true &&
      "data" in value &&
      isAlertsLiveUpdatesBootstrapPayload(
        (value as { readonly data?: unknown }).data
      )
  );
}

export function getFeedRuntimeDiagnostics(
  config: AquaPulseClientRuntimeConfig
): FeedRuntimeDiagnostics {
  const feedHttpRequested = config.feedMode === "http";
  const feedHttpEnabled =
    feedHttpRequested && Boolean(config.enableFetchHttp || config.enablePlaceholderHttp);
  const effectiveMode: AquaPulseClientRuntimeMode =
    feedHttpEnabled || config.mode === "http" ? "http" : "mock";
  const resolvedBaseUrl = resolveFeedHttpBaseUrl(config);
  const usesLocalProxy = effectiveMode === "http" && (!resolvedBaseUrl || resolvedBaseUrl.startsWith("/"));
  const targetLabel =
    effectiveMode === "mock"
      ? "mock adapters"
      : usesLocalProxy
        ? "/api/feed local bridge"
        : `${resolvedBaseUrl}/api/feed`;

  return {
    requestedMode: config.feedMode ?? "inherit",
    effectiveMode,
    usesLocalProxy,
    transport: effectiveMode === "mock" ? "mock" : usesLocalProxy ? "proxy" : "direct",
    targetLabel,
    scopeLabel:
      feedHttpRequested
        ? "feed-only opt-in"
        : config.mode === "http"
          ? "global runtime"
          : "default mock runtime",
    warnings: [...(config.warnings ?? [])]
  };
}

export function getTasksRuntimeDiagnostics(
  config: AquaPulseClientRuntimeConfig
): TasksRuntimeDiagnostics {
  const tasksHttpRequested = config.tasksMode === "http";
  const tasksHttpEnabled =
    tasksHttpRequested && Boolean(config.enableFetchHttp || config.enablePlaceholderHttp);
  const effectiveMode: AquaPulseClientRuntimeMode =
    tasksHttpEnabled || config.mode === "http" ? "http" : "mock";
  const resolvedBaseUrl = resolveTasksHttpBaseUrl(config);
  const usesLocalProxy = effectiveMode === "http" && (!resolvedBaseUrl || resolvedBaseUrl.startsWith("/"));
  const targetLabel =
    effectiveMode === "mock"
      ? "mock adapters"
      : usesLocalProxy
        ? "/api/tasks local bridge"
        : `${resolvedBaseUrl}/api/tasks`;

  return {
    requestedMode: config.tasksMode ?? "inherit",
    effectiveMode,
    usesLocalProxy,
    transport: effectiveMode === "mock" ? "mock" : usesLocalProxy ? "proxy" : "direct",
    targetLabel,
    scopeLabel:
      tasksHttpRequested
        ? "tasks-only opt-in"
        : config.mode === "http"
          ? "global runtime"
          : "default mock runtime",
    warnings: [...(config.warnings ?? [])]
  };
}

export function getWaterQualityRuntimeDiagnostics(
  config: AquaPulseClientRuntimeConfig
): WaterQualityRuntimeDiagnostics {
  const waterQualityHttpRequested = config.waterQualityMode === "http";
  const waterQualityHttpEnabled =
    waterQualityHttpRequested && Boolean(config.enableFetchHttp || config.enablePlaceholderHttp);
  const effectiveMode: AquaPulseClientRuntimeMode =
    waterQualityHttpEnabled || config.mode === "http" ? "http" : "mock";
  const resolvedBaseUrl = resolveWaterQualityHttpBaseUrl(config);
  const usesLocalProxy =
    effectiveMode === "http" && (!resolvedBaseUrl || resolvedBaseUrl.startsWith("/"));
  const targetLabel =
    effectiveMode === "mock"
      ? "mock adapters"
      : usesLocalProxy
        ? "/api/water-quality local bridge"
        : `${resolvedBaseUrl}/api/water-quality`;

  return {
    requestedMode: config.waterQualityMode ?? "inherit",
    effectiveMode,
    usesLocalProxy,
    transport: effectiveMode === "mock" ? "mock" : usesLocalProxy ? "proxy" : "direct",
    targetLabel,
    scopeLabel:
      waterQualityHttpRequested
        ? "water-quality-only opt-in"
        : config.mode === "http"
          ? "global runtime"
          : "default mock runtime",
    warnings: [...(config.warnings ?? [])]
  };
}

export function getAuthRuntimeDiagnostics(
  config: AquaPulseClientRuntimeConfig,
  options: {
    readonly forwardedAuthPresent?: boolean;
    readonly forwardingSource?: "env_token" | "cookie_token" | "authorization_header" | "none";
  } = {}
): FrontendAuthRuntimeDiagnostics {
  const requestedMode = config.authMode ?? "disabled";
  const keycloakConfigured = Boolean(
    config.keycloakIssuerUrl && config.keycloakRealm && config.keycloakClientId
  );
  const effectiveMode =
    requestedMode === "keycloak" && !keycloakConfigured ? "disabled" : requestedMode;
  const forwardingSource = options.forwardingSource ?? "none";
  const forwardedAuthPresent = options.forwardedAuthPresent ?? false;
  const forwardingMode =
    effectiveMode !== "keycloak"
      ? "bypassed"
      : forwardingSource === "env_token"
        ? "proxy_env_token"
        : forwardingSource === "cookie_token"
          ? "proxy_cookie"
          : forwardingSource === "authorization_header"
            ? "proxy_header_passthrough"
            : "unavailable";
  const warnings = [...(config.warnings ?? [])];

  if (effectiveMode === "keycloak" && !forwardedAuthPresent) {
    warnings.push({
      code: "AUTH_FORWARDING_UNAVAILABLE",
      message:
        "Keycloak auth mode is active in the frontend runtime, but no forwardable bearer token is currently available for the local web-to-API bridge."
    });
  }

  return {
    requestedMode,
    effectiveMode,
    active: effectiveMode === "keycloak",
    bypassActive: effectiveMode !== "keycloak",
    keycloakConfigured,
    verificationAvailable: keycloakConfigured,
    verificationState:
      effectiveMode === "disabled"
        ? "disabled"
        : effectiveMode === "local"
          ? "local_bypass"
          : keycloakConfigured
            ? "jwks_ready"
            : "keycloak_incomplete",
    issuerLabel: config.keycloakIssuerUrl ?? "not configured",
    jwksLabel: config.keycloakIssuerUrl
      ? `${config.keycloakIssuerUrl}/protocol/openid-connect/certs`
      : "not configured",
    realm: config.keycloakRealm,
    clientId: config.keycloakClientId,
    firstProtectedSliceLabel: "runtime_diagnostics_api",
    firstProtectedSliceEnforced: effectiveMode === "keycloak",
    protectedReadSliceLabel: "alerts_list_read",
    protectedReadSliceEnforced: effectiveMode === "keycloak",
    secondaryProtectedReadSliceLabel: "alerts_detail_read",
    secondaryProtectedReadSliceEnforced: effectiveMode === "keycloak",
    tertiaryProtectedReadSliceLabel: "alerts_summary_read",
    tertiaryProtectedReadSliceEnforced: effectiveMode === "keycloak",
    protectedOperatorSliceLabel: "alerts_lifecycle_actions",
    protectedOperatorSliceEnforced: effectiveMode === "keycloak",
    secondaryProtectedSliceLabel: "alerts_triage_actions",
    secondaryProtectedSliceEnforced: effectiveMode === "keycloak",
    tertiaryProtectedSliceLabel: "alerts_bulk_actions",
    tertiaryProtectedSliceEnforced: effectiveMode === "keycloak",
    quaternaryProtectedSliceLabel: "alerts_saved_view_mutations",
    quaternaryProtectedSliceEnforced: effectiveMode === "keycloak",
    nonAlertsOperatorAccessSummaryLabel: "non_alert_operator_access",
    nonAlertsOperatorAccessSummaryEnforced: effectiveMode === "keycloak",
    nonAlertsProtectedSliceLabel: "tasks_update",
    nonAlertsProtectedSliceEnforced: effectiveMode === "keycloak",
    secondaryNonAlertsProtectedSliceLabel: "feed_update",
    secondaryNonAlertsProtectedSliceEnforced: effectiveMode === "keycloak",
    forwardingMode,
    forwardingActive: effectiveMode === "keycloak" && forwardedAuthPresent,
    forwardedAuthPresent,
    localDevUserLabel: config.localAuthUserLabel ?? "Local Operator",
    warnings
  };
}

export function getFrontendRuntimeDiagnostics(
  config: AquaPulseClientRuntimeConfig,
  localBridgeConfig?: { readonly backendBaseUrl?: string },
  authForwarding?: {
    readonly forwardedAuthPresent?: boolean;
    readonly forwardingSource?: "env_token" | "cookie_token" | "authorization_header" | "none";
  },
  currentSession?: {
    readonly payload?: CurrentSessionPayload;
    readonly endpointStatus?: FrontendSessionBootstrapStatus["currentSessionEndpointStatus"];
  }
): FrontendRuntimeDiagnostics {
  const auth = getAuthRuntimeDiagnostics(config, authForwarding);
  const session: FrontendSessionBootstrapStatus = deriveFrontendSessionBootstrap(auth, {
    currentSession: currentSession?.payload,
    currentSessionEndpointStatus: currentSession?.endpointStatus
  });
  const alerts = getAlertsRuntimeDiagnostics(config);
  const alertsLiveUpdates = getAlertsLiveUpdatesRuntimeDiagnostics(config, {
    auth,
    session
  });
  const feed = getFeedRuntimeDiagnostics(config);
  const ponds = getPondsRuntimeDiagnostics(config);
  const tasks = getTasksRuntimeDiagnostics(config);
  const waterQuality = getWaterQualityRuntimeDiagnostics(config);
  const mode: RuntimeModeSummary = {
    defaultMode: "mock",
    requestedMode: config.mode,
    effectiveMode: config.mode,
    safeFallbackActive:
      config.mode === "mock" &&
      alerts.effectiveMode === "mock" &&
      ponds.effectiveMode === "mock" &&
      feed.effectiveMode === "mock" &&
      tasks.effectiveMode === "mock" &&
      waterQuality.effectiveMode === "mock"
  };
  const localBridgeWarnings: RuntimeWarning[] = [];
  const backendTargetLabel = localBridgeConfig?.backendBaseUrl ?? "http://localhost:4000";

  if (alerts.effectiveMode === "http" && alerts.usesLocalProxy && !localBridgeConfig?.backendBaseUrl) {
    localBridgeWarnings.push({
      code: "LOCAL_BRIDGE_DEFAULT_TARGET",
      message:
        "Alerts HTTP proxy mode is using the default local backend target. Set AQUAPULSE_WEB_LOCAL_API_BACKEND_URL if your API is running elsewhere."
    });
  }

  if (feed.effectiveMode === "http" && feed.usesLocalProxy && !localBridgeConfig?.backendBaseUrl) {
    localBridgeWarnings.push({
      code: "LOCAL_BRIDGE_DEFAULT_TARGET",
      message:
        "Feed HTTP proxy mode is using the default local backend target. Set AQUAPULSE_WEB_LOCAL_API_BACKEND_URL if your API is running elsewhere."
    });
  }

  if (ponds.effectiveMode === "http" && ponds.usesLocalProxy && !localBridgeConfig?.backendBaseUrl) {
    localBridgeWarnings.push({
      code: "LOCAL_BRIDGE_DEFAULT_TARGET",
      message:
        "Ponds HTTP proxy mode is using the default local backend target. Set AQUAPULSE_WEB_LOCAL_API_BACKEND_URL if your API is running elsewhere."
    });
  }

  if (tasks.effectiveMode === "http" && tasks.usesLocalProxy && !localBridgeConfig?.backendBaseUrl) {
    localBridgeWarnings.push({
      code: "LOCAL_BRIDGE_DEFAULT_TARGET",
      message:
        "Tasks HTTP proxy mode is using the default local backend target. Set AQUAPULSE_WEB_LOCAL_API_BACKEND_URL if your API is running elsewhere."
    });
  }

  if (
    waterQuality.effectiveMode === "http" &&
    waterQuality.usesLocalProxy &&
    !localBridgeConfig?.backendBaseUrl
  ) {
    localBridgeWarnings.push({
      code: "LOCAL_BRIDGE_DEFAULT_TARGET",
      message:
        "Water-quality HTTP proxy mode is using the default local backend target. Set AQUAPULSE_WEB_LOCAL_API_BACKEND_URL if your API is running elsewhere."
    });
  }

  const localBridge: LocalBridgeDiagnostics = {
    routePrefix: "/api/alerts",
    transport: "proxy",
    backendTargetLabel,
    configured: Boolean(localBridgeConfig?.backendBaseUrl),
    warnings: localBridgeWarnings
  };

  return {
    service: "web",
    mode,
    auth,
    session,
    alerts,
    alertsLiveUpdates,
    ponds,
    feed,
    tasks,
    waterQuality,
    localBridge,
    warnings: [
      ...session.warnings,
      ...auth.warnings,
      ...alerts.warnings,
      ...alertsLiveUpdates.warnings,
      ...ponds.warnings,
      ...feed.warnings,
      ...tasks.warnings,
      ...waterQuality.warnings,
      ...localBridgeWarnings
    ]
  };
}

export function getDefaultClientRuntimeConfig(): AquaPulseClientRuntimeConfig {
  return parseClientRuntimeConfig();
}
