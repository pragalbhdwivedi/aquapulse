import {
  buildLocalApiProxyTargetUrl,
  proxyLocalApiRequest,
  readLocalApiProxyConfig,
  type LocalApiProxyConfig,
  type LocalApiProxyEnv
} from "./local-api-proxy";

export interface AlertsLocalProxyConfig extends LocalApiProxyConfig {}

export interface AlertsLocalProxyEnv extends LocalApiProxyEnv {}

export function readAlertsLocalProxyConfig(env: AlertsLocalProxyEnv = process.env): AlertsLocalProxyConfig {
  return readLocalApiProxyConfig(env);
}

export function buildAlertsProxyTargetUrl(
  request: Request,
  config: AlertsLocalProxyConfig = readAlertsLocalProxyConfig()
): string {
  return buildLocalApiProxyTargetUrl(request, config);
}

export async function proxyAlertsApiRequest(
  request: Request,
  config: AlertsLocalProxyConfig = readAlertsLocalProxyConfig()
): Promise<Response> {
  return proxyLocalApiRequest(request, config, {
    unavailableCode: "ALERTS_LOCAL_PROXY_UNAVAILABLE",
    unavailableMessage: (backendBaseUrl) =>
      `Alerts local proxy could not reach ${backendBaseUrl}. Start the API server or update AQUAPULSE_WEB_LOCAL_API_BACKEND_URL.`,
    routePrefixHeaderValue: "local"
  });
}

export async function proxyAiAlertsApiRequest(
  request: Request,
  config: AlertsLocalProxyConfig = readAlertsLocalProxyConfig()
): Promise<Response> {
  return proxyLocalApiRequest(request, config, {
    unavailableCode: "AI_ALERTS_LOCAL_PROXY_UNAVAILABLE",
    unavailableMessage: (backendBaseUrl) =>
      `AI alerts local proxy could not reach ${backendBaseUrl}. Start the API server or update AQUAPULSE_WEB_LOCAL_API_BACKEND_URL.`,
    routePrefixHeaderValue: "local-ai"
  });
}
