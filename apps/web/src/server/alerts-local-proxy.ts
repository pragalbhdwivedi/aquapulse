const defaultLocalApiBackendUrl = "http://localhost:4000";

export interface AlertsLocalProxyConfig {
  readonly backendBaseUrl: string;
}

export interface AlertsLocalProxyEnv {
  readonly AQUAPULSE_WEB_LOCAL_API_BACKEND_URL?: string;
  readonly [key: string]: string | undefined;
}

function normalizeBackendBaseUrl(value: string | undefined): string | undefined {
  const trimmedValue = value?.trim();
  if (!trimmedValue) {
    return undefined;
  }

  try {
    const parsedUrl = new URL(trimmedValue);
    if (parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:") {
      return parsedUrl.toString().replace(/\/+$/, "");
    }
  } catch {
    return undefined;
  }

  return undefined;
}

export function readAlertsLocalProxyConfig(
  env: AlertsLocalProxyEnv = process.env
): AlertsLocalProxyConfig {
  return {
    backendBaseUrl:
      normalizeBackendBaseUrl(env.AQUAPULSE_WEB_LOCAL_API_BACKEND_URL) ??
      defaultLocalApiBackendUrl
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
  try {
    const response = await fetch(targetUrl, {
      method: request.method,
      headers: createForwardHeaders(request),
      body: shouldForwardBody(request.method) ? await request.clone().arrayBuffer() : undefined,
      redirect: "manual"
    });

    return new Response(await response.arrayBuffer(), {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers
    });
  } catch {
    return Response.json(
      {
        ok: false,
        error: {
          code: "ALERTS_LOCAL_PROXY_UNAVAILABLE",
          message: `Alerts local proxy could not reach ${config.backendBaseUrl}. Start the API server or update AQUAPULSE_WEB_LOCAL_API_BACKEND_URL.`
        }
      },
      {
        status: 502,
        headers: {
          "x-aquapulse-alerts-proxy": "local"
        }
      }
    );
  }
}
