import type { RuntimeWarning } from "@aquapulse/types";

export interface AlertsLiveUpdatesRuntimeConfig {
  readonly enabled: boolean;
  readonly path: string;
  readonly ticketBootstrapPath: string;
  readonly ticketTtlMs: number;
  readonly warnings: readonly RuntimeWarning[];
}

export interface AlertsLiveUpdatesRuntimeEnvSource {
  readonly AQUAPULSE_ENABLE_ALERTS_LIVE_UPDATES?: string;
  readonly AQUAPULSE_ALERTS_LIVE_UPDATES_PATH?: string;
  readonly AQUAPULSE_ALERTS_LIVE_UPDATES_TICKET_TTL_MS?: string;
}

function parseBooleanFlag(value: string | undefined): boolean {
  const normalized = value?.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}

function normalizePath(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) {
    return undefined;
  }

  return trimmed.startsWith("/") ? trimmed.replace(/\/+$/, "") : `/${trimmed.replace(/\/+$/, "")}`;
}

function parseTicketTtlMs(value: string | undefined): number {
  const parsedValue = Number(value);
  if (!Number.isFinite(parsedValue) || parsedValue < 5000 || parsedValue > 300000) {
    return 45000;
  }

  return parsedValue;
}

export function readAlertsLiveUpdatesRuntimeConfig(
  env: AlertsLiveUpdatesRuntimeEnvSource = process.env
): AlertsLiveUpdatesRuntimeConfig {
  const warnings: RuntimeWarning[] = [];
  const enabled = parseBooleanFlag(env.AQUAPULSE_ENABLE_ALERTS_LIVE_UPDATES);
  const path = normalizePath(env.AQUAPULSE_ALERTS_LIVE_UPDATES_PATH) ?? "/ws/alerts";
  const ticketTtlMs = parseTicketTtlMs(env.AQUAPULSE_ALERTS_LIVE_UPDATES_TICKET_TTL_MS);

  if (enabled && path !== "/ws/alerts") {
    warnings.push({
      code: "ALERTS_LIVE_UPDATES_CUSTOM_PATH",
      message:
        "Alerts live updates are using a custom websocket path. Make sure the web runtime is pointed at the same backend websocket path."
    });
  }

  return {
    enabled,
    path,
    ticketBootstrapPath: "/api/alerts/live-updates/session",
    ticketTtlMs,
    warnings
  };
}
