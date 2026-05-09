import type { RuntimeWarning } from "@aquapulse/types";
import {
  getPondsRuntimeDiagnostics,
  type AquaPulseClientRuntimeConfig
} from "../clients/runtime-config";

export interface PondsRuntimeIndicator {
  readonly modeLabel: string;
  readonly targetLabel: string;
  readonly helperText: string;
  readonly warnings: readonly RuntimeWarning[];
}

export function derivePondsRuntimeIndicator(
  config: AquaPulseClientRuntimeConfig
): PondsRuntimeIndicator {
  const diagnostics = getPondsRuntimeDiagnostics(config);
  const modeLabel =
    diagnostics.effectiveMode === "http"
      ? diagnostics.usesLocalProxy
        ? "HTTP via local proxy"
        : "HTTP direct"
      : "Mock";
  const helperText =
    diagnostics.effectiveMode === "http"
      ? diagnostics.usesLocalProxy
        ? "Ponds HTTP is opt-in. Requests go through /api/ponds and the backend target is configured on the web server."
        : "Ponds HTTP is opt-in. Requests go straight to the configured ponds backend base URL."
      : "Ponds stay mock-backed by default unless the ponds-only HTTP mode is explicitly enabled.";

  return {
    modeLabel,
    targetLabel: diagnostics.targetLabel,
    helperText:
      diagnostics.effectiveMode === "http" && diagnostics.usesLocalProxy
        ? `${helperText} Use /runtime to confirm whether the backend ponds adapter is still in-memory or has switched to Postgres.`
        : helperText,
    warnings: diagnostics.warnings
  };
}

export function formatPondsRuntimeError(
  error: unknown,
  config: AquaPulseClientRuntimeConfig
): string {
  const diagnostics = getPondsRuntimeDiagnostics(config);
  const baseMessage =
    error instanceof Error && error.message
      ? error.message
      : "Ponds request failed.";

  if (diagnostics.effectiveMode !== "http") {
    return baseMessage;
  }

  if (diagnostics.usesLocalProxy) {
    return `${baseMessage} Ponds HTTP mode is using the local /api/ponds bridge, so make sure the web app can reach the local backend target.`;
  }

  return `${baseMessage} Ponds HTTP mode is using a direct backend target, so check the configured ponds HTTP base URL.`;
}
