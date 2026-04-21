import { Injectable } from "@nestjs/common";
import { createPublicKey, createSign, createVerify, type JsonWebKey } from "node:crypto";
import type { AuthenticatedUserSession } from "@aquapulse/types";
import { readApiAuthRuntimeConfig, type ApiAuthRuntimeConfig } from "./auth-runtime.config";
import { setCachedKeycloakVerificationState } from "./keycloak-verification-cache";

interface RequestLike {
  readonly headers?: Record<string, string | string[] | undefined>;
  user?: AuthenticatedUserSession | null;
}

interface JwtHeader {
  readonly alg?: string;
  readonly kid?: string;
  readonly typ?: string;
}

interface JsonWebKeySetResponse {
  readonly keys?: JsonWebKey[];
}

interface ApiAuthServiceOptions {
  readonly runtime?: ApiAuthRuntimeConfig;
  readonly fetchImpl?: typeof fetch;
  readonly now?: () => number;
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

function decodeBase64UrlJson<TValue = Record<string, unknown>>(
  value: string
): TValue | null {
  try {
    const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
    const paddingLength = (4 - (normalized.length % 4)) % 4;
    const decoded = Buffer.from(`${normalized}${"=".repeat(paddingLength)}`, "base64").toString(
      "utf8"
    );
    return JSON.parse(decoded) as TValue;
  } catch {
    return null;
  }
}

function decodeBase64UrlBuffer(value: string): Buffer | null {
  try {
    const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
    const paddingLength = (4 - (normalized.length % 4)) % 4;
    return Buffer.from(`${normalized}${"=".repeat(paddingLength)}`, "base64");
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

function updateVerificationCache(
  status: "ready" | "verified" | "degraded",
  message: string,
  now: () => number
): void {
  setCachedKeycloakVerificationState({
    status,
    message,
    checkedAt: new Date(now()).toISOString()
  });
}

@Injectable()
export class ApiAuthService {
  private readonly runtime: ApiAuthRuntimeConfig;
  private readonly fetchImpl: typeof fetch;
  private readonly now: () => number;

  constructor(options: ApiAuthServiceOptions = {}) {
    this.runtime = options.runtime ?? readApiAuthRuntimeConfig();
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.now = options.now ?? (() => Date.now());
  }

  getRuntimeConfig(): ApiAuthRuntimeConfig {
    return this.runtime;
  }

  requiresAuthentication(): boolean {
    return this.runtime.effectiveMode === "keycloak";
  }

  async hydrateRequestUser(request: RequestLike): Promise<AuthenticatedUserSession | null> {
    const user = await this.resolveRequestUser(request);
    request.user = user;
    return user;
  }

  async resolveRequestUser(request: RequestLike): Promise<AuthenticatedUserSession | null> {
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

    return requiredRoles.some((role) => this.hasNamedRole(user, role));
  }

  deriveAlertsAccessLevel(
    user: AuthenticatedUserSession | null | undefined
  ): "none" | "viewer" | "operator" {
    if (!user) {
      return "none";
    }

    if (this.hasOperatorAccess(user)) {
      return "operator";
    }

    return "viewer";
  }

  hasOperatorAccess(
    user: AuthenticatedUserSession | null | undefined
  ): boolean {
    if (!user) {
      return false;
    }

    return user.roles.includes("operator") || user.permissions.includes("alerts:operate");
  }

  private hasNamedRole(user: AuthenticatedUserSession, role: string): boolean {
    if (role === "operator") {
      return this.hasOperatorAccess(user);
    }

    return user.roles.includes(role);
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

  private async resolveKeycloakUser(request: RequestLike): Promise<AuthenticatedUserSession | null> {
    const token = extractBearerToken(request.headers);
    if (!token) {
      return null;
    }

    const segments = token.split(".");
    if (segments.length < 3) {
      updateVerificationCache("degraded", "Bearer token format was invalid.", this.now);
      return null;
    }

    const header = decodeBase64UrlJson<JwtHeader>(segments[0]);
    const payload = decodeBase64UrlJson(segments[1]);
    const signature = decodeBase64UrlBuffer(segments[2]);
    if (!payload || !signature) {
      updateVerificationCache("degraded", "Bearer token could not be decoded.", this.now);
      return null;
    }

    const subject = typeof payload.sub === "string" ? payload.sub : undefined;
    if (!subject) {
      updateVerificationCache("degraded", "Bearer token did not include a subject.", this.now);
      return null;
    }

    const configuredIssuer = this.runtime.keycloak.issuerUrl;
    const issuer = typeof payload.iss === "string" ? payload.iss.replace(/\/+$/, "") : undefined;
    if (configuredIssuer && issuer && issuer !== configuredIssuer) {
      updateVerificationCache(
        "degraded",
        "Bearer token issuer did not match the configured Keycloak issuer.",
        this.now
      );
      return null;
    }

    const configuredAudience = this.runtime.keycloak.audience ?? this.runtime.keycloak.clientId;
    const audienceValues = Array.isArray(payload.aud)
      ? payload.aud.filter((item): item is string => typeof item === "string")
      : typeof payload.aud === "string"
        ? [payload.aud]
        : [];
    const azp = typeof payload.azp === "string" ? payload.azp : undefined;
    if (
      configuredAudience &&
      audienceValues.length > 0 &&
      !audienceValues.includes(configuredAudience) &&
      azp !== configuredAudience
    ) {
      updateVerificationCache(
        "degraded",
        "Bearer token audience did not match the configured Keycloak client or audience.",
        this.now
      );
      return null;
    }

    if (!(await this.verifyKeycloakToken(token, header, payload, signature))) {
      return null;
    }

    const configuredClientId = this.runtime.keycloak.clientId;
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
      ...new Set([...coerceStringArray(payload.scope), ...coerceStringArray(payload.permissions)])
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
        exp: typeof payload.exp === "number" ? payload.exp : undefined,
        preferred_username: username,
        email: typeof payload.email === "string" ? payload.email : undefined
      }
    };
  }

  private async verifyKeycloakToken(
    token: string,
    header: JwtHeader | null,
    payload: Record<string, unknown>,
    signature: Buffer
  ): Promise<boolean> {
    if (!this.runtime.keycloak.verificationAvailable || !this.runtime.keycloak.jwksUrl) {
      updateVerificationCache(
        "degraded",
        "Keycloak verification is not available because JWKS configuration is incomplete.",
        this.now
      );
      return false;
    }

    if (header?.alg !== "RS256") {
      updateVerificationCache(
        "degraded",
        "Only RS256 bearer tokens are supported by the bounded JWKS verifier in this stage.",
        this.now
      );
      return false;
    }

    const expiresAt = typeof payload.exp === "number" ? payload.exp * 1000 : undefined;
    if (expiresAt && expiresAt <= this.now()) {
      updateVerificationCache("degraded", "Bearer token has expired.", this.now);
      return false;
    }

    const notBefore = typeof payload.nbf === "number" ? payload.nbf * 1000 : undefined;
    if (notBefore && notBefore > this.now()) {
      updateVerificationCache("degraded", "Bearer token is not active yet.", this.now);
      return false;
    }

    try {
      const jwksResponse = await this.fetchImpl(this.runtime.keycloak.jwksUrl, {
        method: "GET",
        headers: {
          accept: "application/json"
        }
      });

      if (!jwksResponse.ok) {
        updateVerificationCache(
          "degraded",
          `JWKS endpoint returned ${jwksResponse.status} while verifying the bearer token.`,
          this.now
        );
        return false;
      }

      const jwks = (await jwksResponse.json()) as JsonWebKeySetResponse;
      const key = this.selectVerificationKey(jwks.keys ?? [], header?.kid);
      if (!key) {
        updateVerificationCache(
          "degraded",
          "No matching JWKS verification key was available for the bearer token.",
          this.now
        );
        return false;
      }

      const verifier = createVerify("RSA-SHA256");
      verifier.update(token.split(".").slice(0, 2).join("."));
      verifier.end();

      const verified = verifier.verify(createPublicKey({ key, format: "jwk" }), signature);
      updateVerificationCache(
        verified ? "verified" : "degraded",
        verified
          ? "Bearer token was verified against the configured JWKS."
          : "Bearer token signature verification failed.",
        this.now
      );
      return verified;
    } catch (error) {
      updateVerificationCache(
        "degraded",
        error instanceof Error ? error.message : "JWKS verification failed due to an unexpected error.",
        this.now
      );
      return false;
    }
  }

  private selectVerificationKey(keys: JsonWebKey[], kid: string | undefined): JsonWebKey | undefined {
    const signingKeys = keys.filter(
      (key) =>
        key.kty === "RSA" &&
        (key.use === undefined || key.use === "sig") &&
        typeof key.n === "string" &&
        typeof key.e === "string"
    );

    if (kid) {
      return signingKeys.find((key) => key.kid === kid);
    }

    return signingKeys[0];
  }
}

export function createSignedJwtForTest(
  payload: Record<string, unknown>,
  options: { readonly kid?: string; readonly privateKeyPem: string }
): string {
  const header = Buffer.from(
    JSON.stringify({ alg: "RS256", typ: "JWT", kid: options.kid ?? "test-kid" })
  ).toString("base64url");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signingInput = `${header}.${body}`;
  const signer = createSign("RSA-SHA256");
  signer.update(signingInput);
  signer.end();
  const signature = signer.sign(options.privateKeyPem).toString("base64url");
  return `${signingInput}.${signature}`;
}
