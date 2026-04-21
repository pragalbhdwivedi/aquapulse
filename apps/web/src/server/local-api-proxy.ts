const defaultLocalApiBackendUrl = "http://localhost:4000";

export interface LocalApiProxyConfig {
  readonly backendBaseUrl: string;
}

export interface LocalApiProxyEnv {
  readonly AQUAPULSE_WEB_LOCAL_API_BACKEND_URL?: string;
  readonly [key: string]: string | undefined;
}

export interface LocalApiProxyOptions {
  readonly unavailableCode: string;
  readonly unavailableMessage: (backendBaseUrl: string) => string;
  readonly routePrefixHeaderValue?: string;
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

export function readLocalApiProxyConfig(
  env: LocalApiProxyEnv = process.env
): LocalApiProxyConfig {
  return {
    backendBaseUrl:
      normalizeBackendBaseUrl(env.AQUAPULSE_WEB_LOCAL_API_BACKEND_URL) ??
      defaultLocalApiBackendUrl
  };
}

export function buildLocalApiProxyTargetUrl(
  request: Request,
  config: LocalApiProxyConfig = readLocalApiProxyConfig()
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

export async function proxyLocalApiRequest(
  request: Request,
  config: LocalApiProxyConfig,
  options: LocalApiProxyOptions
): Promise<Response> {
  const targetUrl = buildLocalApiProxyTargetUrl(request, config);
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
          code: options.unavailableCode,
          message: options.unavailableMessage(config.backendBaseUrl)
        }
      },
      {
        status: 502,
        headers: {
          "x-aquapulse-local-proxy": options.routePrefixHeaderValue ?? "local"
        }
      }
    );
  }
}
