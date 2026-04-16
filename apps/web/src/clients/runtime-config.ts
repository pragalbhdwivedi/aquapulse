export type AquaPulseClientRuntimeMode = "mock" | "http";
export type AquaPulseScopedRuntimeMode = AquaPulseClientRuntimeMode | "inherit";

export interface AquaPulseClientRuntimeConfig {
  readonly mode: AquaPulseClientRuntimeMode;
  readonly enablePlaceholderHttp?: boolean;
  readonly enableFetchHttp?: boolean;
  readonly httpBaseUrl?: string;
  readonly alertsMode?: AquaPulseScopedRuntimeMode;
  readonly alertsHttpBaseUrl?: string;
}

export interface AquaPulseClientRuntimeEnv {
  readonly AQUAPULSE_WEB_CLIENT_MODE?: string;
  readonly AQUAPULSE_WEB_ENABLE_PLACEHOLDER_HTTP?: string;
  readonly AQUAPULSE_WEB_ENABLE_FETCH_HTTP?: string;
  readonly AQUAPULSE_WEB_HTTP_BASE_URL?: string;
  readonly AQUAPULSE_WEB_ALERTS_MODE?: string;
  readonly AQUAPULSE_WEB_ALERTS_HTTP_BASE_URL?: string;
  readonly NEXT_PUBLIC_AQUAPULSE_WEB_CLIENT_MODE?: string;
  readonly NEXT_PUBLIC_AQUAPULSE_WEB_ENABLE_PLACEHOLDER_HTTP?: string;
  readonly NEXT_PUBLIC_AQUAPULSE_WEB_ENABLE_FETCH_HTTP?: string;
  readonly NEXT_PUBLIC_AQUAPULSE_WEB_HTTP_BASE_URL?: string;
  readonly NEXT_PUBLIC_AQUAPULSE_WEB_ALERTS_MODE?: string;
  readonly NEXT_PUBLIC_AQUAPULSE_WEB_ALERTS_HTTP_BASE_URL?: string;
}

function parseBooleanFlag(value: string | undefined): boolean {
  return value === "1" || value === "true";
}

export function parseClientRuntimeMode(value: string | undefined): AquaPulseClientRuntimeMode {
  return value === "http" ? "http" : "mock";
}

export function parseScopedClientRuntimeMode(
  value: string | undefined
): AquaPulseScopedRuntimeMode {
  return value === "http" || value === "mock" ? value : "inherit";
}

function coalesceEnvValue(
  ...values: Array<string | undefined>
): string | undefined {
  return values.find((value) => typeof value === "string" && value.length > 0);
}

export function parseClientRuntimeConfig(
  env: AquaPulseClientRuntimeEnv = {}
): AquaPulseClientRuntimeConfig {
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
  const httpBaseUrl = coalesceEnvValue(
    env.AQUAPULSE_WEB_HTTP_BASE_URL,
    env.NEXT_PUBLIC_AQUAPULSE_WEB_HTTP_BASE_URL
  );
  const alertsMode = parseScopedClientRuntimeMode(
    coalesceEnvValue(env.AQUAPULSE_WEB_ALERTS_MODE, env.NEXT_PUBLIC_AQUAPULSE_WEB_ALERTS_MODE)
  );
  const alertsHttpBaseUrl = coalesceEnvValue(
    env.AQUAPULSE_WEB_ALERTS_HTTP_BASE_URL,
    env.NEXT_PUBLIC_AQUAPULSE_WEB_ALERTS_HTTP_BASE_URL,
    httpBaseUrl
  );

  return {
    mode: mode === "http" && enablePlaceholderHttp ? "http" : "mock",
    enablePlaceholderHttp,
    enableFetchHttp,
    httpBaseUrl,
    alertsMode,
    alertsHttpBaseUrl
  };
}

export function resolveAlertsHttpBaseUrl(
  config: AquaPulseClientRuntimeConfig
): string | undefined {
  if (config.alertsHttpBaseUrl) {
    return config.alertsHttpBaseUrl;
  }

  if (config.alertsMode === "http" && config.enableFetchHttp) {
    return "";
  }

  return config.httpBaseUrl;
}

export function getDefaultClientRuntimeConfig(): AquaPulseClientRuntimeConfig {
  return parseClientRuntimeConfig();
}
