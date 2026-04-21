import type { RuntimeWarning } from "@aquapulse/types";

export interface AlertsLiveUpdatesRuntimeConfig {
  readonly enabled: boolean;
  readonly path: string;
  readonly warnings: readonly RuntimeWarning[];
}

export interface AlertsLiveUpdatesRuntimeEnvSource {
  readonly AQUAPULSE_ENABLE_ALERTS_LIVE_UPDATES?: string;
  readonly AQUAPULSE_ALERTS_LIVE_UPDATES_PATH?: string;
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

export function readAlertsLiveUpdatesRuntimeConfig(
  env: AlertsLiveUpdatesRuntimeEnvSource = process.env
): AlertsLiveUpdatesRuntimeConfig {
  const warnings: RuntimeWarning[] = [];
  const enabled = parseBooleanFlag(env.AQUAPULSE_ENABLE_ALERTS_LIVE_UPDATES);
  const path = normalizePath(env.AQUAPULSE_ALERTS_LIVE_UPDATES_PATH) ?? "/ws/alerts";

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
    warnings
  };
}
