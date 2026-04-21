import {
  buildLocalApiProxyTargetUrl,
  proxyLocalApiRequest,
  readLocalApiProxyConfig,
  type LocalApiProxyConfig,
  type LocalApiProxyEnv
} from "./local-api-proxy";

export interface TasksLocalProxyConfig extends LocalApiProxyConfig {}
export interface TasksLocalProxyEnv extends LocalApiProxyEnv {}

export function readTasksLocalProxyConfig(
  env: TasksLocalProxyEnv = process.env
): TasksLocalProxyConfig {
  return readLocalApiProxyConfig(env);
}

export function buildTasksProxyTargetUrl(
  request: Request,
  config: TasksLocalProxyConfig = readTasksLocalProxyConfig()
): string {
  return buildLocalApiProxyTargetUrl(request, config);
}

export async function proxyTasksApiRequest(
  request: Request,
  config: TasksLocalProxyConfig = readTasksLocalProxyConfig()
): Promise<Response> {
  return proxyLocalApiRequest(request, config, {
    unavailableCode: "TASKS_LOCAL_PROXY_UNAVAILABLE",
    unavailableMessage: (backendBaseUrl) =>
      `Tasks local proxy could not reach ${backendBaseUrl}. Start the API server or update AQUAPULSE_WEB_LOCAL_API_BACKEND_URL.`,
    routePrefixHeaderValue: "tasks"
  });
}
