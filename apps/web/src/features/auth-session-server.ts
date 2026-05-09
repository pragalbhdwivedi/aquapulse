import type {
  CurrentSessionPayload,
  RuntimeWarning
} from "@aquapulse/types";
import {
  getFrontendRuntimeDiagnostics,
  parseClientRuntimeConfig,
  type AquaPulseClientRuntimeEnv
} from "../clients/runtime-config";
import {
  readAlertsLocalProxyConfig,
  type AlertsLocalProxyEnv
} from "../server/alerts-local-proxy";
import {
  readLocalApiAuthForwardingConfig,
  resolveForwardedAuthorizationHeader,
  type LocalApiAuthForwardingEnv
} from "../server/auth-forwarding";

export interface CurrentSessionBootstrapEnvSource
  extends AquaPulseClientRuntimeEnv,
    AlertsLocalProxyEnv,
    LocalApiAuthForwardingEnv {
  readonly AQUAPULSE_WEB_ENABLE_BACKEND_CURRENT_SESSION?: string;
  readonly AQUAPULSE_WEB_CURRENT_SESSION_TIMEOUT_MS?: string;
}

function parseBooleanFlag(value: string | undefined): boolean {
  const normalizedValue = value?.trim().toLowerCase();
  return normalizedValue === "1" || normalizedValue === "true" || normalizedValue === "yes" || normalizedValue === "on";
}

function parseTimeoutMs(value: string | undefined): number {
  const parsedValue = Number(value);
  if (!Number.isFinite(parsedValue) || parsedValue < 100 || parsedValue > 10000) {
    return 1200;
  }

  return parsedValue;
}

function isCurrentSessionPayload(value: unknown): value is CurrentSessionPayload {
  return Boolean(
    value &&
      typeof value === "object" &&
      "requestedMode" in value &&
      "effectiveMode" in value &&
      "availabilityState" in value &&
      "authSource" in value &&
      "sessionPresent" in value
  );
}

async function fetchWithTimeout(
  input: string,
  init: RequestInit,
  timeoutMs: number,
  fetchImpl: typeof fetch
): Promise<Response> {
  const controller = typeof AbortController === "function" ? new AbortController() : undefined;
  const timeoutId = controller ? setTimeout(() => controller.abort(), timeoutMs) : undefined;

  try {
    return await fetchImpl(input, {
      ...init,
      signal: controller?.signal
    });
  } finally {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
  }
}

export async function readResolvedFrontendRuntimeDiagnostics(
  env: CurrentSessionBootstrapEnvSource = process.env,
  fetchImpl: typeof fetch = fetch
) {
  const runtimeConfig = parseClientRuntimeConfig(env);
  const localBridgeConfig = readAlertsLocalProxyConfig(env);
  const authForwardingConfig = readLocalApiAuthForwardingConfig(env);
  const authForwardingState = {
    forwardedAuthPresent: Boolean(authForwardingConfig.bearerToken),
    forwardingSource: authForwardingConfig.bearerToken ? "env_token" : "none"
  } as const;
  const enabled = parseBooleanFlag(env.AQUAPULSE_WEB_ENABLE_BACKEND_CURRENT_SESSION);
  const timeoutMs = parseTimeoutMs(env.AQUAPULSE_WEB_CURRENT_SESSION_TIMEOUT_MS);
  const sessionWarnings: RuntimeWarning[] = [];

  if (!enabled) {
    return getFrontendRuntimeDiagnostics(
      runtimeConfig,
      localBridgeConfig,
      authForwardingState,
      {
        endpointStatus: "not_requested"
      }
    );
  }

  const authorizationHeader = resolveForwardedAuthorizationHeader(
    new Request("http://localhost/internal-current-session", {
      headers: authForwardingConfig.bearerToken
        ? {
            authorization: `Bearer ${authForwardingConfig.bearerToken}`
          }
        : undefined
    }),
    authForwardingConfig
  );

  try {
    const response = await fetchWithTimeout(
      `${localBridgeConfig.backendBaseUrl}/api/auth/session`,
      {
        method: "GET",
        headers: authorizationHeader
          ? {
              accept: "application/json",
              authorization: authorizationHeader
            }
          : {
              accept: "application/json"
            }
      },
      timeoutMs,
      fetchImpl
    );
    const payload = (await response.json()) as unknown;

    if (!response.ok || !payload || typeof payload !== "object" || !("data" in payload)) {
      sessionWarnings.push({
        code: "CURRENT_SESSION_ENDPOINT_DEGRADED",
        message:
          "The backend current-session endpoint responded, but the payload was incomplete or unsuccessful. The frontend stayed on runtime-derived auth state."
      });

      return getFrontendRuntimeDiagnostics(
        runtimeConfig,
        localBridgeConfig,
        authForwardingState,
        {
          endpointStatus: "degraded"
        }
      );
    }

    const envelope = payload as { readonly data?: unknown };
    if (!isCurrentSessionPayload(envelope.data)) {
      sessionWarnings.push({
        code: "CURRENT_SESSION_PAYLOAD_INVALID",
        message:
          "The backend current-session endpoint returned an unexpected payload shape. The frontend stayed on runtime-derived auth state."
      });

      return getFrontendRuntimeDiagnostics(
        runtimeConfig,
        localBridgeConfig,
        authForwardingState,
        {
          endpointStatus: "degraded"
        }
      );
    }

    return getFrontendRuntimeDiagnostics(
      runtimeConfig,
      localBridgeConfig,
      authForwardingState,
      {
        payload: {
          ...envelope.data,
          warnings: [...envelope.data.warnings, ...sessionWarnings]
        },
        endpointStatus: "available"
      }
    );
  } catch {
    sessionWarnings.push({
      code: "CURRENT_SESSION_ENDPOINT_UNREACHABLE",
      message:
        "The frontend could not reach the backend current-session endpoint. The web app stayed on runtime-derived auth state."
    });

    return getFrontendRuntimeDiagnostics(
      runtimeConfig,
      localBridgeConfig,
      authForwardingState,
      {
        endpointStatus: "unreachable"
      }
    );
  }
}
