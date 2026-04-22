import {
  buildLocalApiProxyTargetUrl,
  proxyLocalApiRequest,
  readLocalApiProxyConfig,
  type LocalApiProxyConfig,
  type LocalApiProxyEnv
} from "./local-api-proxy";

export interface PondsLocalProxyConfig extends LocalApiProxyConfig {}
export interface PondsLocalProxyEnv extends LocalApiProxyEnv {}

export function readPondsLocalProxyConfig(
  env: PondsLocalProxyEnv = process.env
): PondsLocalProxyConfig {
  return readLocalApiProxyConfig(env);
}

export function buildPondsProxyTargetUrl(
  request: Request,
  config: PondsLocalProxyConfig = readPondsLocalProxyConfig()
): string {
  return buildLocalApiProxyTargetUrl(request, config);
}

export async function proxyPondsApiRequest(
  request: Request,
  config: PondsLocalProxyConfig = readPondsLocalProxyConfig()
): Promise<Response> {
  return proxyLocalApiRequest(request, config, {
    unavailableCode: "PONDS_LOCAL_PROXY_UNAVAILABLE",
    unavailableMessage: (backendBaseUrl) =>
      `Ponds local proxy could not reach ${backendBaseUrl}. Start the API server or update AQUAPULSE_WEB_LOCAL_API_BACKEND_URL.`,
    routePrefixHeaderValue: "ponds"
  });
}
