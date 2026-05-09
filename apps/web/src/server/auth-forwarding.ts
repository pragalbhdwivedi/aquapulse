export interface LocalApiAuthForwardingEnv {
  readonly AQUAPULSE_WEB_AUTH_BEARER_TOKEN?: string;
  readonly AQUAPULSE_WEB_AUTH_TOKEN_COOKIE_NAME?: string;
  readonly [key: string]: string | undefined;
}

export interface LocalApiAuthForwardingConfig {
  readonly bearerToken?: string;
  readonly tokenCookieName: string;
}

export interface LocalApiAuthForwardingState {
  readonly source: "env_token" | "cookie_token" | "authorization_header" | "none";
  readonly hasForwardableAuth: boolean;
}

const defaultAuthTokenCookieName = "aquapulse_auth_token";

function normalizeValue(value: string | undefined): string | undefined {
  const trimmedValue = value?.trim();
  return trimmedValue ? trimmedValue : undefined;
}

function parseCookieValue(cookieHeader: string | null, cookieName: string): string | undefined {
  if (!cookieHeader) {
    return undefined;
  }

  const cookies = cookieHeader.split(";");
  for (const cookie of cookies) {
    const [name, ...valueParts] = cookie.trim().split("=");
    if (name === cookieName) {
      const joinedValue = valueParts.join("=").trim();
      return joinedValue ? decodeURIComponent(joinedValue) : undefined;
    }
  }

  return undefined;
}

export function readLocalApiAuthForwardingConfig(
  env: LocalApiAuthForwardingEnv = process.env
): LocalApiAuthForwardingConfig {
  return {
    bearerToken: normalizeValue(env.AQUAPULSE_WEB_AUTH_BEARER_TOKEN),
    tokenCookieName:
      normalizeValue(env.AQUAPULSE_WEB_AUTH_TOKEN_COOKIE_NAME) ?? defaultAuthTokenCookieName
  };
}

export function resolveLocalApiForwardingState(
  request: Request,
  config: LocalApiAuthForwardingConfig = readLocalApiAuthForwardingConfig()
): LocalApiAuthForwardingState {
  const authorizationHeader = request.headers.get("authorization")?.trim();
  if (authorizationHeader?.startsWith("Bearer ")) {
    return {
      source: "authorization_header",
      hasForwardableAuth: true
    };
  }

  const cookieToken = parseCookieValue(request.headers.get("cookie"), config.tokenCookieName);
  if (cookieToken) {
    return {
      source: "cookie_token",
      hasForwardableAuth: true
    };
  }

  if (config.bearerToken) {
    return {
      source: "env_token",
      hasForwardableAuth: true
    };
  }

  return {
    source: "none",
    hasForwardableAuth: false
  };
}

export function resolveForwardedAuthorizationHeader(
  request: Request,
  config: LocalApiAuthForwardingConfig = readLocalApiAuthForwardingConfig()
): string | undefined {
  const authorizationHeader = request.headers.get("authorization")?.trim();
  if (authorizationHeader?.startsWith("Bearer ")) {
    return authorizationHeader;
  }

  const cookieToken = parseCookieValue(request.headers.get("cookie"), config.tokenCookieName);
  if (cookieToken) {
    return `Bearer ${cookieToken}`;
  }

  if (config.bearerToken) {
    return `Bearer ${config.bearerToken}`;
  }

  return undefined;
}
