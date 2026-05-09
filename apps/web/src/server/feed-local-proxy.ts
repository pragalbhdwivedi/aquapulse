import {
  buildLocalApiProxyTargetUrl,
  proxyLocalApiRequest,
  readLocalApiProxyConfig,
  type LocalApiProxyConfig,
  type LocalApiProxyEnv
} from "./local-api-proxy";

export interface FeedLocalProxyConfig extends LocalApiProxyConfig {}
export interface FeedLocalProxyEnv extends LocalApiProxyEnv {}

export function readFeedLocalProxyConfig(
  env: FeedLocalProxyEnv = process.env
): FeedLocalProxyConfig {
  return readLocalApiProxyConfig(env);
}

export function buildFeedProxyTargetUrl(
  request: Request,
  config: FeedLocalProxyConfig = readFeedLocalProxyConfig()
): string {
  return buildLocalApiProxyTargetUrl(request, config);
}

export async function proxyFeedApiRequest(
  request: Request,
  config: FeedLocalProxyConfig = readFeedLocalProxyConfig()
): Promise<Response> {
  return proxyLocalApiRequest(request, config, {
    unavailableCode: "FEED_LOCAL_PROXY_UNAVAILABLE",
    unavailableMessage: (backendBaseUrl) =>
      `Feed local proxy could not reach ${backendBaseUrl}. Start the API server or update AQUAPULSE_WEB_LOCAL_API_BACKEND_URL.`,
    routePrefixHeaderValue: "feed"
  });
}
