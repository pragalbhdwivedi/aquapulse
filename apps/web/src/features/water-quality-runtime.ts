import {
  getWaterQualityRuntimeDiagnostics,
  type AquaPulseClientRuntimeConfig
} from "../clients/runtime-config";
import type { RuntimeWarning } from "@aquapulse/types";

export interface WaterQualityRuntimeIndicator {
  readonly modeLabel: string;
  readonly targetLabel: string;
  readonly helperText: string;
  readonly warnings: readonly RuntimeWarning[];
}

export function deriveWaterQualityRuntimeIndicator(
  config: AquaPulseClientRuntimeConfig
): WaterQualityRuntimeIndicator {
  const diagnostics = getWaterQualityRuntimeDiagnostics(config);
  const modeLabel =
    diagnostics.effectiveMode === "http"
      ? diagnostics.usesLocalProxy
        ? "HTTP via local proxy"
        : "HTTP direct"
      : "Mock";
  const helperText =
    diagnostics.effectiveMode === "http"
      ? diagnostics.usesLocalProxy
        ? "Water-quality HTTP is opt-in. Requests go through /api/water-quality and the backend target is configured on the web server."
        : "Water-quality HTTP is opt-in. Requests go straight to the configured water-quality backend base URL."
      : "Water-quality stays mock-backed by default unless the water-quality-only HTTP mode is explicitly enabled.";

  return {
    modeLabel,
    targetLabel: diagnostics.targetLabel,
    helperText:
      diagnostics.effectiveMode === "http" && diagnostics.usesLocalProxy
        ? `${helperText} Use /runtime to confirm whether the backend water-quality adapter is still in-memory or has switched to Postgres.`
        : helperText,
    warnings: diagnostics.warnings
  };
}

export function formatWaterQualityRuntimeError(
  error: unknown,
  config: AquaPulseClientRuntimeConfig
): string {
  const diagnostics = getWaterQualityRuntimeDiagnostics(config);
  const baseMessage =
    error instanceof Error && error.message
      ? error.message
      : "Water-quality request failed.";

  if (diagnostics.effectiveMode !== "http") {
    return baseMessage;
  }

  if (diagnostics.usesLocalProxy) {
    return `${baseMessage} Water-quality HTTP mode is using the local /api/water-quality bridge, so make sure the web app can reach the local backend target.`;
  }

  return `${baseMessage} Water-quality HTTP mode is using a direct backend target, so check the configured water-quality HTTP base URL.`;
}
