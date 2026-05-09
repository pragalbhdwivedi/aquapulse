import {
  proxyLocalApiRequest,
  readLocalApiProxyConfig,
  type LocalApiProxyConfig,
  type LocalApiProxyEnv
} from "./local-api-proxy";

export interface AuthLocalProxyConfig extends LocalApiProxyConfig {}

export interface AuthLocalProxyEnv extends LocalApiProxyEnv {}

export function readAuthLocalProxyConfig(env: AuthLocalProxyEnv = process.env): AuthLocalProxyConfig {
  return readLocalApiProxyConfig(env);
}

export async function proxyAuthApiRequest(
  request: Request,
  config: AuthLocalProxyConfig = readAuthLocalProxyConfig()
): Promise<Response> {
  return proxyLocalApiRequest(request, config, {
    unavailableCode: "AUTH_LOCAL_PROXY_UNAVAILABLE",
    unavailableMessage: (backendBaseUrl) =>
      `Auth local proxy could not reach ${backendBaseUrl}. Start the API server or update AQUAPULSE_WEB_LOCAL_API_BACKEND_URL.`,
    routePrefixHeaderValue: "local-auth"
  });
}
