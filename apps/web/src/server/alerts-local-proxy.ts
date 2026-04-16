const defaultLocalApiBackendUrl = "http://localhost:4000";

export interface AlertsLocalProxyConfig {
  readonly backendBaseUrl: string;
}

export interface AlertsLocalProxyEnv {
  readonly AQUAPULSE_WEB_LOCAL_API_BACKEND_URL?: string;
}

export function readAlertsLocalProxyConfig(
  env: AlertsLocalProxyEnv = process.env
): AlertsLocalProxyConfig {
  return {
    backendBaseUrl:
      env.AQUAPULSE_WEB_LOCAL_API_BACKEND_URL?.trim() || defaultLocalApiBackendUrl
  };
}

export function buildAlertsProxyTargetUrl(
  request: Request,
  config: AlertsLocalProxyConfig = readAlertsLocalProxyConfig()
): string {
  const requestUrl = new URL(request.url);
  const backendBaseUrl = config.backendBaseUrl.replace(/\/+$/, "");
  return `${backendBaseUrl}${requestUrl.pathname}${requestUrl.search}`;
}

function shouldForwardBody(method: string): boolean {
  return method !== "GET" && method !== "HEAD";
}

function createForwardHeaders(request: Request): Headers {
  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("connection");
  headers.delete("content-length");
  return headers;
}

export async function proxyAlertsApiRequest(
  request: Request,
  config: AlertsLocalProxyConfig = readAlertsLocalProxyConfig()
): Promise<Response> {
  const targetUrl = buildAlertsProxyTargetUrl(request, config);
  const response = await fetch(targetUrl, {
    method: request.method,
    headers: createForwardHeaders(request),
    body: shouldForwardBody(request.method) ? await request.clone().arrayBuffer() : undefined,
    redirect: "manual"
  });

  return new Response(await response.arrayBuffer(), {
    status: response.status,
    headers: response.headers
  });
}
