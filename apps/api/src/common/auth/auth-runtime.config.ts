import type { AquaPulseAuthMode, RuntimeWarning } from "@aquapulse/types";

export interface ApiAuthRuntimeEnvSource {
  readonly AQUAPULSE_AUTH_MODE?: string;
  readonly AQUAPULSE_KEYCLOAK_ISSUER_URL?: string;
  readonly AQUAPULSE_KEYCLOAK_JWKS_URL?: string;
  readonly AQUAPULSE_KEYCLOAK_REALM?: string;
  readonly AQUAPULSE_KEYCLOAK_CLIENT_ID?: string;
  readonly AQUAPULSE_KEYCLOAK_AUDIENCE?: string;
  readonly AQUAPULSE_AUTH_LOCAL_USER_ID?: string;
  readonly AQUAPULSE_AUTH_LOCAL_USERNAME?: string;
  readonly AQUAPULSE_AUTH_LOCAL_DISPLAY_NAME?: string;
  readonly AQUAPULSE_AUTH_LOCAL_ROLES?: string;
  readonly AQUAPULSE_AUTH_LOCAL_PERMISSIONS?: string;
}

export interface ApiAuthRuntimeConfig {
  readonly requestedMode: AquaPulseAuthMode;
  readonly effectiveMode: AquaPulseAuthMode;
  readonly keycloak: {
    readonly issuerUrl?: string;
    readonly jwksUrl?: string;
    readonly realm?: string;
    readonly clientId?: string;
    readonly audience?: string;
    readonly configured: boolean;
    readonly verificationAvailable: boolean;
  };
  readonly localUser: {
    readonly id: string;
    readonly username: string;
    readonly displayName: string;
    readonly roles: string[];
    readonly permissions: string[];
  };
  readonly warnings: readonly RuntimeWarning[];
}

function normalizeValue(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function parseAuthMode(value: string | undefined): AquaPulseAuthMode {
  const normalized = normalizeValue(value)?.toLowerCase();
  if (normalized === "local" || normalized === "keycloak") {
    return normalized;
  }

  return "disabled";
}

function parseList(value: string | undefined, fallback: string[] = []): string[] {
  const normalized = normalizeValue(value);
  if (!normalized) {
    return fallback;
  }

  return normalized
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeIssuerUrl(value: string | undefined): string | undefined {
  const normalized = normalizeValue(value);
  if (!normalized) {
    return undefined;
  }

  try {
    const parsed = new URL(normalized);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.toString().replace(/\/+$/, "");
    }
  } catch {
    return undefined;
  }

  return undefined;
}

function deriveJwksUrl(issuerUrl: string | undefined): string | undefined {
  if (!issuerUrl) {
    return undefined;
  }

  return `${issuerUrl}/protocol/openid-connect/certs`;
}

export function readApiAuthRuntimeConfig(
  env: ApiAuthRuntimeEnvSource = process.env
): ApiAuthRuntimeConfig {
  const warnings: RuntimeWarning[] = [];
  const requestedMode = parseAuthMode(env.AQUAPULSE_AUTH_MODE);
  const issuerUrl = normalizeIssuerUrl(env.AQUAPULSE_KEYCLOAK_ISSUER_URL);
  const explicitJwksUrl = normalizeIssuerUrl(env.AQUAPULSE_KEYCLOAK_JWKS_URL);
  const jwksUrl = explicitJwksUrl ?? deriveJwksUrl(issuerUrl);
  const realm = normalizeValue(env.AQUAPULSE_KEYCLOAK_REALM);
  const clientId = normalizeValue(env.AQUAPULSE_KEYCLOAK_CLIENT_ID);
  const audience = normalizeValue(env.AQUAPULSE_KEYCLOAK_AUDIENCE);
  const keycloakConfigured = Boolean(issuerUrl && realm && clientId);
  const localUser = {
    id: normalizeValue(env.AQUAPULSE_AUTH_LOCAL_USER_ID) ?? "local-operator",
    username: normalizeValue(env.AQUAPULSE_AUTH_LOCAL_USERNAME) ?? "local.operator",
    displayName: normalizeValue(env.AQUAPULSE_AUTH_LOCAL_DISPLAY_NAME) ?? "Local Operator",
    roles: parseList(env.AQUAPULSE_AUTH_LOCAL_ROLES, ["operator"]),
    permissions: parseList(env.AQUAPULSE_AUTH_LOCAL_PERMISSIONS)
  };

  if (normalizeValue(env.AQUAPULSE_KEYCLOAK_ISSUER_URL) && !issuerUrl) {
    warnings.push({
      code: "AUTH_KEYCLOAK_ISSUER_INVALID",
      message:
        "AQUAPULSE_KEYCLOAK_ISSUER_URL was ignored because it is not a valid http/https URL."
    });
  }

  if (normalizeValue(env.AQUAPULSE_KEYCLOAK_JWKS_URL) && !explicitJwksUrl) {
    warnings.push({
      code: "AUTH_KEYCLOAK_JWKS_INVALID",
      message:
        "AQUAPULSE_KEYCLOAK_JWKS_URL was ignored because it is not a valid http/https URL."
    });
  }

  if (requestedMode === "keycloak" && !keycloakConfigured) {
    warnings.push({
      code: "AUTH_KEYCLOAK_CONFIG_INCOMPLETE",
      message:
        "Keycloak auth mode was requested, but issuer URL, realm, or client ID is missing. The API will stay on the safe auth-disabled fallback until config is complete."
    });
  }

  return {
    requestedMode,
    effectiveMode: requestedMode === "keycloak" && !keycloakConfigured ? "disabled" : requestedMode,
    keycloak: {
      issuerUrl,
      jwksUrl,
      realm,
      clientId,
      audience,
      configured: keycloakConfigured,
      verificationAvailable: Boolean(keycloakConfigured && jwksUrl)
    },
    localUser,
    warnings
  };
}
