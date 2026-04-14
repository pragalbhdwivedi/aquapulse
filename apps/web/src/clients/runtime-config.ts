export type AquaPulseClientRuntimeMode = "mock" | "http";

export interface AquaPulseClientRuntimeConfig {
  readonly mode: AquaPulseClientRuntimeMode;
  readonly enablePlaceholderHttp: boolean;
}

export interface AquaPulseClientRuntimeEnv {
  readonly AQUAPULSE_WEB_CLIENT_MODE?: string;
  readonly AQUAPULSE_WEB_ENABLE_PLACEHOLDER_HTTP?: string;
}

function parseBooleanFlag(value: string | undefined): boolean {
  return value === "1" || value === "true";
}

export function parseClientRuntimeMode(value: string | undefined): AquaPulseClientRuntimeMode {
  return value === "http" ? "http" : "mock";
}

export function parseClientRuntimeConfig(
  env: AquaPulseClientRuntimeEnv = {}
): AquaPulseClientRuntimeConfig {
  const mode = parseClientRuntimeMode(env.AQUAPULSE_WEB_CLIENT_MODE);
  const enablePlaceholderHttp = parseBooleanFlag(env.AQUAPULSE_WEB_ENABLE_PLACEHOLDER_HTTP);

  return {
    mode: mode === "http" && enablePlaceholderHttp ? "http" : "mock",
    enablePlaceholderHttp
  };
}

export function getDefaultClientRuntimeConfig(): AquaPulseClientRuntimeConfig {
  return parseClientRuntimeConfig();
}
