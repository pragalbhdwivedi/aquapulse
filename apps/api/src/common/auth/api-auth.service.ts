import { Injectable } from "@nestjs/common";
import type { AuthenticatedUserSession } from "@aquapulse/types";
import { readApiAuthRuntimeConfig, type ApiAuthRuntimeConfig } from "./auth-runtime.config";

interface RequestLike {
  readonly headers?: Record<string, string | string[] | undefined>;
  user?: AuthenticatedUserSession | null;
}

function readHeader(
  headers: RequestLike["headers"],
  key: string
): string | undefined {
  const value = headers?.[key] ?? headers?.[key.toLowerCase()];

  if (Array.isArray(value)) {
    return value[0];
  }

  return typeof value === "string" ? value : undefined;
}

function parseCsvHeader(value: string | undefined): string[] {
  if (!value?.trim()) {
    return [];
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function decodeBase64UrlJson(value: string): Record<string, unknown> | null {
  try {
    const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
    const paddingLength = (4 - (normalized.length % 4)) % 4;
    const decoded = Buffer.from(`${normalized}${"=".repeat(paddingLength)}`, "base64").toString(
      "utf8"
    );
    return JSON.parse(decoded) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function extractBearerToken(headers: RequestLike["headers"]): string | undefined {
  const authorization = readHeader(headers, "authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return undefined;
  }

  return authorization.slice("Bearer ".length).trim() || undefined;
}

function coerceStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
  }

  if (typeof value === "string" && value.trim()) {
    return value.trim().split(/\s+/);
  }

  return [];
}

@Injectable()
export class ApiAuthService {
  private readonly runtime: ApiAuthRuntimeConfig;

  constructor() {
    this.runtime = readApiAuthRuntimeConfig();
  }

  getRuntimeConfig(): ApiAuthRuntimeConfig {
    return this.runtime;
  }

  requiresAuthentication(): boolean {
    return this.runtime.effectiveMode === "keycloak";
  }

  hydrateRequestUser(request: RequestLike): AuthenticatedUserSession | null {
    const user = this.resolveRequestUser(request);
    request.user = user;
    return user;
  }

  resolveRequestUser(request: RequestLike): AuthenticatedUserSession | null {
    switch (this.runtime.effectiveMode) {
      case "local":
        return this.resolveLocalUser(request);
      case "keycloak":
        return this.resolveKeycloakUser(request);
      case "disabled":
      default:
        return null;
    }
  }

  hasRequiredRoles(
    user: AuthenticatedUserSession | null | undefined,
    requiredRoles: readonly string[]
  ): boolean {
    if (requiredRoles.length === 0) {
      return true;
    }

    if (!user) {
      return false;
    }

    return requiredRoles.some((role) => user.roles.includes(role));
  }

  private resolveLocalUser(request: RequestLike): AuthenticatedUserSession {
    const id = readHeader(request.headers, "x-aquapulse-dev-user") ?? this.runtime.localUser.id;
    const username =
      readHeader(request.headers, "x-aquapulse-dev-username") ?? this.runtime.localUser.username;
    const displayName =
      readHeader(request.headers, "x-aquapulse-dev-display-name") ??
      this.runtime.localUser.displayName;
    const roles = parseCsvHeader(readHeader(request.headers, "x-aquapulse-dev-roles"));
    const permissions = parseCsvHeader(readHeader(request.headers, "x-aquapulse-dev-permissions"));

    return {
      id,
      username,
      displayName,
      provider: "local",
      roles: roles.length > 0 ? roles : this.runtime.localUser.roles,
      permissions: permissions.length > 0 ? permissions : this.runtime.localUser.permissions,
      claims: {
        auth_mode: "local",
        preferred_username: username,
        display_name: displayName
      }
    };
  }

  private resolveKeycloakUser(request: RequestLike): AuthenticatedUserSession | null {
    const token = extractBearerToken(request.headers);
    if (!token) {
      return null;
    }

    const segments = token.split(".");
    if (segments.length < 2) {
      return null;
    }

    const payload = decodeBase64UrlJson(segments[1]);
    if (!payload) {
      return null;
    }

    const subject = typeof payload.sub === "string" ? payload.sub : undefined;
    if (!subject) {
      return null;
    }

    const configuredIssuer = this.runtime.keycloak.issuerUrl;
    const issuer = typeof payload.iss === "string" ? payload.iss.replace(/\/+$/, "") : undefined;
    if (configuredIssuer && issuer && issuer !== configuredIssuer) {
      return null;
    }

    const configuredClientId = this.runtime.keycloak.clientId;
    const audienceValues = Array.isArray(payload.aud)
      ? payload.aud.filter((item): item is string => typeof item === "string")
      : typeof payload.aud === "string"
        ? [payload.aud]
        : [];
    const azp = typeof payload.azp === "string" ? payload.azp : undefined;
    if (
      configuredClientId &&
      audienceValues.length > 0 &&
      !audienceValues.includes(configuredClientId) &&
      azp !== configuredClientId
    ) {
      return null;
    }

    const realmAccess =
      payload.realm_access && typeof payload.realm_access === "object"
        ? (payload.realm_access as { readonly roles?: unknown })
        : undefined;
    const resourceAccess =
      payload.resource_access && typeof payload.resource_access === "object"
        ? (payload.resource_access as Record<string, { readonly roles?: unknown }>)
        : undefined;
    const resourceRoles =
      configuredClientId && resourceAccess?.[configuredClientId]
        ? coerceStringArray(resourceAccess[configuredClientId]?.roles)
        : [];
    const roles = [...new Set([...coerceStringArray(realmAccess?.roles), ...resourceRoles])];
    const permissions = [
      ...new Set([
        ...coerceStringArray(payload.scope),
        ...coerceStringArray(payload.permissions)
      ])
    ];
    const username =
      typeof payload.preferred_username === "string"
        ? payload.preferred_username
        : typeof payload.username === "string"
          ? payload.username
          : undefined;
    const displayName =
      typeof payload.name === "string"
        ? payload.name
        : typeof payload.given_name === "string"
          ? payload.given_name
          : username;

    return {
      id: subject,
      subject,
      username,
      displayName,
      email: typeof payload.email === "string" ? payload.email : undefined,
      provider: "keycloak",
      roles,
      permissions,
      claims: {
        iss: issuer,
        aud: audienceValues,
        azp,
        preferred_username: username,
        email: typeof payload.email === "string" ? payload.email : undefined
      }
    };
  }
}
