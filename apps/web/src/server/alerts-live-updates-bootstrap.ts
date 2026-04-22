import type {
  AlertsLiveUpdatesBootstrapPayload,
  ApiSuccessEnvelope,
  RuntimeWarning
} from "@aquapulse/types";
import {
  getAuthRuntimeDiagnostics,
  parseClientRuntimeConfig,
  type AquaPulseClientRuntimeEnv
} from "../clients/runtime-config";
import {
  readAlertsLocalProxyConfig,
  type AlertsLocalProxyEnv
} from "./alerts-local-proxy";
import {
  readLocalApiAuthForwardingConfig,
  resolveForwardedAuthorizationHeader,
  resolveLocalApiForwardingState,
  type LocalApiAuthForwardingEnv
} from "./auth-forwarding";

export interface AlertsLiveUpdatesBootstrapEnvSource
  extends AquaPulseClientRuntimeEnv,
    AlertsLocalProxyEnv,
    LocalApiAuthForwardingEnv {}

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

function appendAccessToken(targetUrl: string, authorizationHeader?: string): string {
  const bearerToken = authorizationHeader?.startsWith("Bearer ")
    ? authorizationHeader.slice("Bearer ".length).trim()
    : undefined;

  if (!bearerToken) {
    return targetUrl;
  }

  const url = new URL(targetUrl);
  url.searchParams.set("access_token", bearerToken);
  return url.toString();
}

function deriveAlertsLiveUpdatesWebSocketTarget(
  env: AlertsLiveUpdatesBootstrapEnvSource,
  runtimeConfig = parseClientRuntimeConfig(env)
): string | undefined {
  if (runtimeConfig.alertsLiveUpdatesBaseUrl) {
    return coerceHttpUrlToWebSocketBaseUrl(runtimeConfig.alertsLiveUpdatesBaseUrl);
  }

  const localProxyConfig = readAlertsLocalProxyConfig(env);
  const backendBaseUrl =
    runtimeConfig.alertsHttpBaseUrl && !runtimeConfig.alertsHttpBaseUrl.startsWith("/")
      ? runtimeConfig.alertsHttpBaseUrl
      : localProxyConfig.backendBaseUrl;

  return `${coerceHttpUrlToWebSocketBaseUrl(backendBaseUrl)}/ws/alerts`;
}

export function createAlertsLiveUpdatesBootstrapEnvelope(
  request: Request,
  env: AlertsLiveUpdatesBootstrapEnvSource = process.env
): ApiSuccessEnvelope<AlertsLiveUpdatesBootstrapPayload> {
  const runtimeConfig = parseClientRuntimeConfig(env);
  const authForwardingConfig = readLocalApiAuthForwardingConfig(env);
  const forwardingState = resolveLocalApiForwardingState(request, authForwardingConfig);
  const forwardedAuthorization = resolveForwardedAuthorizationHeader(request, authForwardingConfig);
  const authDiagnostics = getAuthRuntimeDiagnostics(runtimeConfig, {
    forwardedAuthPresent: Boolean(forwardedAuthorization),
    forwardingSource: forwardingState.source
  });
  const warnings: RuntimeWarning[] = [...(runtimeConfig.warnings ?? [])];
  const requested = Boolean(runtimeConfig.alertsLiveUpdatesEnabled);
  const alertsHttpEnabled =
    runtimeConfig.alertsMode === "http" &&
    Boolean(runtimeConfig.enableFetchHttp || runtimeConfig.enablePlaceholderHttp);
  const transport = runtimeConfig.alertsLiveUpdatesSubscriptionTransport ?? "direct";
  const targetLabel =
    transport === "local_proxy_bootstrap"
      ? runtimeConfig.alertsLiveUpdatesBootstrapPath ?? "/api/alerts/live-updates/session"
      : deriveAlertsLiveUpdatesWebSocketTarget(env, runtimeConfig) ?? "target not configured";
  const webSocketTarget = deriveAlertsLiveUpdatesWebSocketTarget(env, runtimeConfig);
  const enabled = requested && alertsHttpEnabled && Boolean(webSocketTarget);

  let subscriptionAuthState: AlertsLiveUpdatesBootstrapPayload["subscriptionAuthState"];
  if (!requested) {
    subscriptionAuthState = "disabled";
  } else if (!enabled) {
    subscriptionAuthState = "unavailable";
  } else if (authDiagnostics.requestedMode === "keycloak" && authDiagnostics.effectiveMode === "disabled") {
    subscriptionAuthState = "degraded";
  } else if (authDiagnostics.effectiveMode === "keycloak" && !forwardedAuthorization) {
    subscriptionAuthState = "degraded";
    warnings.push({
      code: "ALERTS_LIVE_UPDATES_PROXY_FORWARDING_UNAVAILABLE",
      message:
        "Alerts live updates local bootstrap could not derive a forwardable bearer token. Current-session and protected alerts actions may be authenticated, but the websocket subscription still needs bounded forwarding."
    });
  } else if (authDiagnostics.effectiveMode === "keycloak") {
    subscriptionAuthState = "authenticated";
  } else {
    subscriptionAuthState = "bypassed_local";
  }

  return {
    ok: true,
    data: {
      requested,
      enabled,
      subscriptionTransport: transport,
      targetLabel,
      webSocketUrl:
        enabled && webSocketTarget && subscriptionAuthState !== "degraded"
          ? appendAccessToken(webSocketTarget, forwardedAuthorization)
          : undefined,
      subscriptionAuthState,
      authMode: authDiagnostics.effectiveMode,
      forwardedAuthPresent: Boolean(forwardedAuthorization),
      forwardingSource: forwardingState.source,
      warnings
    }
  };
}
