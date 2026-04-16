import {
  getAlertsRuntimeDiagnostics,
  type AquaPulseClientRuntimeConfig
} from "../clients/runtime-config";
import type { RuntimeWarning } from "@aquapulse/types";

export interface AlertsRuntimeIndicator {
  readonly modeLabel: string;
  readonly targetLabel: string;
  readonly helperText: string;
  readonly warnings: readonly RuntimeWarning[];
}

export function deriveAlertsRuntimeIndicator(
  config: AquaPulseClientRuntimeConfig
): AlertsRuntimeIndicator {
  const diagnostics = getAlertsRuntimeDiagnostics(config);
  const modeLabel =
    diagnostics.effectiveMode === "http"
      ? diagnostics.usesLocalProxy
        ? "HTTP via local proxy"
        : "HTTP direct"
      : "Mock";
  const helperText =
    diagnostics.effectiveMode === "http"
      ? diagnostics.usesLocalProxy
        ? "Alerts-only HTTP is opt-in. Requests go through /api/alerts and the backend target is configured on the web server."
        : "Alerts-only HTTP is opt-in. Requests go straight to the configured alerts backend base URL."
      : "Alerts stays mock-backed by default. The rest of the app also remains mock/in-memory unless explicitly switched later.";

  return {
    modeLabel,
    targetLabel: diagnostics.targetLabel,
    helperText,
    warnings: diagnostics.warnings
  };
}

export function formatAlertsRuntimeError(
  error: unknown,
  config: AquaPulseClientRuntimeConfig
): string {
  const diagnostics = getAlertsRuntimeDiagnostics(config);
  const baseMessage =
    error instanceof Error && error.message
      ? error.message
      : "Alerts workbench request failed.";

  if (diagnostics.effectiveMode !== "http") {
    return baseMessage;
  }

  if (diagnostics.usesLocalProxy) {
    return `${baseMessage} Alerts HTTP mode is using the local /api/alerts bridge, so make sure the web app can reach the local backend target.`;
  }

  return `${baseMessage} Alerts HTTP mode is using a direct backend target, so check the configured alerts HTTP base URL.`;
}
