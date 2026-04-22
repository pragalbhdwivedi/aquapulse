import { Injectable } from "@nestjs/common";
import type {
  AuthenticatedUserSession,
  CurrentSessionAuthSource,
  CurrentSessionAvailabilityState,
  CurrentSessionPayload,
  RuntimeWarning
} from "@aquapulse/types";
import { ApiAuthService } from "./api-auth.service";

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

function hasLocalDevHeader(headers: RequestLike["headers"]): boolean {
  return Boolean(
    readHeader(headers, "x-aquapulse-dev-user") ||
      readHeader(headers, "x-aquapulse-dev-username") ||
      readHeader(headers, "x-aquapulse-dev-display-name") ||
      readHeader(headers, "x-aquapulse-dev-roles") ||
      readHeader(headers, "x-aquapulse-dev-permissions")
  );
}

@Injectable()
export class CurrentSessionService {
  constructor(private readonly authService: ApiAuthService) {}

  async getCurrentSession(request: RequestLike): Promise<CurrentSessionPayload> {
    const runtime = this.authService.getRuntimeConfig();
    const user = await this.authService.hydrateRequestUser(request);
    const alertsAccess = this.authService.summarizeAlertsAccess(user);
    const warnings: RuntimeWarning[] = [...runtime.warnings];
    let availabilityState: CurrentSessionAvailabilityState;
    let authSource: CurrentSessionAuthSource;

    if (runtime.requestedMode === "keycloak" && runtime.effectiveMode === "disabled") {
      availabilityState = "degraded";
      authSource = "none";
    } else if (runtime.effectiveMode === "disabled") {
      availabilityState = "disabled";
      authSource = "none";
    } else if (runtime.effectiveMode === "local") {
      availabilityState = "local_user";
      authSource = hasLocalDevHeader(request.headers) ? "local_dev_headers" : "local_default_user";
    } else if (user) {
      availabilityState = "authenticated_user";
      authSource = "keycloak_bearer";
    } else {
      availabilityState = "unauthenticated";
      authSource = "keycloak_missing_bearer";
      warnings.push({
        code: "AUTH_SESSION_UNAUTHENTICATED",
        message:
          "Keycloak auth mode is active, but the current request did not resolve to an authenticated user session."
      });
    }

    return {
      requestedMode: runtime.requestedMode,
      effectiveMode: runtime.effectiveMode,
      availabilityState,
      authSource,
      user: user
        ? {
            id: user.id,
            username: user.username,
            displayName: user.displayName,
            email: user.email,
            provider: user.provider,
            roles: [...user.roles],
            permissions: [...user.permissions],
            claimKeys: Object.keys(user.claims ?? {}).sort(),
            alertsAccessLevel: alertsAccess.level,
            operatorAccess: alertsAccess.operatorAccess,
            alertsAccessSource: alertsAccess.source
          }
        : undefined,
      sessionPresent: Boolean(user),
      protectedReadSliceLabel: "alerts_list_read",
      protectedReadSliceEnforced: runtime.effectiveMode === "keycloak",
      secondaryProtectedReadSliceLabel: "alerts_detail_read",
      secondaryProtectedReadSliceEnforced: runtime.effectiveMode === "keycloak",
      tertiaryProtectedReadSliceLabel: "alerts_summary_read",
      tertiaryProtectedReadSliceEnforced: runtime.effectiveMode === "keycloak",
      protectedOperatorSliceLabel: "alerts_lifecycle_actions",
      protectedOperatorSliceEnforced: runtime.effectiveMode === "keycloak",
      secondaryProtectedSliceLabel: "alerts_triage_actions",
      secondaryProtectedSliceEnforced: runtime.effectiveMode === "keycloak",
      tertiaryProtectedSliceLabel: "alerts_bulk_actions",
      tertiaryProtectedSliceEnforced: runtime.effectiveMode === "keycloak",
      quaternaryProtectedSliceLabel: "alerts_saved_view_mutations",
      quaternaryProtectedSliceEnforced: runtime.effectiveMode === "keycloak",
      nonAlertsProtectedSliceLabel: "tasks_update",
      nonAlertsProtectedSliceEnforced: runtime.effectiveMode === "keycloak",
      verificationState:
        runtime.effectiveMode === "disabled"
          ? "disabled"
          : runtime.effectiveMode === "local"
            ? "local_bypass"
            : !runtime.keycloak.verificationAvailable
              ? "not_configured"
              : "ready",
      warnings
    };
  }
}
