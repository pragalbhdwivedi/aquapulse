import {
  buildLocalApiProxyTargetUrl,
  proxyLocalApiRequest,
  readLocalApiProxyConfig,
  type LocalApiProxyConfig,
  type LocalApiProxyEnv
} from "./local-api-proxy";

export interface WaterQualityLocalProxyConfig extends LocalApiProxyConfig {}
export interface WaterQualityLocalProxyEnv extends LocalApiProxyEnv {}

export function readWaterQualityLocalProxyConfig(
  env: WaterQualityLocalProxyEnv = process.env
): WaterQualityLocalProxyConfig {
  return readLocalApiProxyConfig(env);
}

export function buildWaterQualityProxyTargetUrl(
  request: Request,
  config: WaterQualityLocalProxyConfig = readWaterQualityLocalProxyConfig()
): string {
  return buildLocalApiProxyTargetUrl(request, config);
}

export async function proxyWaterQualityApiRequest(
  request: Request,
  config: WaterQualityLocalProxyConfig = readWaterQualityLocalProxyConfig()
): Promise<Response> {
  return proxyLocalApiRequest(request, config, {
    unavailableCode: "WATER_QUALITY_LOCAL_PROXY_UNAVAILABLE",
    unavailableMessage: (backendBaseUrl) =>
      `Water-quality local proxy could not reach ${backendBaseUrl}. Start the API server or update AQUAPULSE_WEB_LOCAL_API_BACKEND_URL.`,
    routePrefixHeaderValue: "water-quality"
  });
}
