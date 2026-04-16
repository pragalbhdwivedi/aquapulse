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
  readonly warnings?: readonly string[];
}

export interface AquaPulseClientRuntimeEnv {
  readonly AQUAPULSE_WEB_CLIENT_MODE?: string;
  readonly AQUAPULSE_WEB_ENABLE_PLACEHOLDER_HTTP?: string;
  readonly AQUAPULSE_WEB_ENABLE_FETCH_HTTP?: string;
  readonly AQUAPULSE_WEB_HTTP_BASE_URL?: string;
  readonly AQUAPULSE_WEB_ALERTS_MODE?: string;
  readonly AQUAPULSE_WEB_ALERTS_HTTP_BASE_URL?: string;
  readonly AQUAPULSE_WEB_ALERTS_HTTP_TRANSPORT?: string;
  readonly NEXT_PUBLIC_AQUAPULSE_WEB_CLIENT_MODE?: string;
  readonly NEXT_PUBLIC_AQUAPULSE_WEB_ENABLE_PLACEHOLDER_HTTP?: string;
  readonly NEXT_PUBLIC_AQUAPULSE_WEB_ENABLE_FETCH_HTTP?: string;
  readonly NEXT_PUBLIC_AQUAPULSE_WEB_HTTP_BASE_URL?: string;
  readonly NEXT_PUBLIC_AQUAPULSE_WEB_ALERTS_MODE?: string;
  readonly NEXT_PUBLIC_AQUAPULSE_WEB_ALERTS_HTTP_BASE_URL?: string;
  readonly NEXT_PUBLIC_AQUAPULSE_WEB_ALERTS_HTTP_TRANSPORT?: string;
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
  warnings: string[],
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

  warnings.push(`${label} was ignored because it is not a valid http/https URL.`);
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
  const warnings: string[] = [];
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

  if (alertsMode === "http" && !enableFetchHttp && !enablePlaceholderHttp) {
    warnings.push(
      "Alerts HTTP mode was requested, but no HTTP executor is enabled. Alerts will remain mock-backed."
    );
  }

  return {
    mode: mode === "http" && enablePlaceholderHttp ? "http" : "mock",
    enablePlaceholderHttp,
    enableFetchHttp,
    httpBaseUrl,
    alertsMode,
    alertsHttpBaseUrl: alertsHttpBaseUrl ?? httpBaseUrl,
    alertsHttpTransport,
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

export interface AlertsRuntimeDiagnostics {
  readonly requestedMode: AquaPulseScopedRuntimeMode;
  readonly effectiveMode: AquaPulseClientRuntimeMode;
  readonly usesLocalProxy: boolean;
  readonly transport: "mock" | AquaPulseHttpTransportMode;
  readonly targetLabel: string;
  readonly scopeLabel: string;
  readonly warnings: readonly string[];
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
    warnings: config.warnings ?? []
  };
}

export function getDefaultClientRuntimeConfig(): AquaPulseClientRuntimeConfig {
  return parseClientRuntimeConfig();
}
