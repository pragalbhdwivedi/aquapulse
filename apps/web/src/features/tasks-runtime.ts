import type { RuntimeWarning } from "@aquapulse/types";
import {
  getTasksRuntimeDiagnostics,
  type AquaPulseClientRuntimeConfig
} from "../clients/runtime-config";

export interface TasksRuntimeIndicator {
  readonly modeLabel: string;
  readonly targetLabel: string;
  readonly helperText: string;
  readonly warnings: readonly RuntimeWarning[];
}

export function deriveTasksRuntimeIndicator(
  config: AquaPulseClientRuntimeConfig
): TasksRuntimeIndicator {
  const diagnostics = getTasksRuntimeDiagnostics(config);
  const modeLabel =
    diagnostics.effectiveMode === "http"
      ? diagnostics.usesLocalProxy
        ? "HTTP via local proxy"
        : "HTTP direct"
      : "Mock";
  const helperText =
    diagnostics.effectiveMode === "http"
      ? diagnostics.usesLocalProxy
        ? "Tasks HTTP is opt-in. Requests go through /api/tasks and the backend target is configured on the web server."
        : "Tasks HTTP is opt-in. Requests go straight to the configured tasks backend base URL."
      : "Tasks stay mock-backed by default unless the tasks-only HTTP mode is explicitly enabled.";

  return {
    modeLabel,
    targetLabel: diagnostics.targetLabel,
    helperText:
      diagnostics.effectiveMode === "http" && diagnostics.usesLocalProxy
        ? `${helperText} Use /runtime to confirm whether the backend tasks adapter is still in-memory or has switched to Postgres.`
        : helperText,
    warnings: diagnostics.warnings
  };
}

export function formatTasksRuntimeError(
  error: unknown,
  config: AquaPulseClientRuntimeConfig
): string {
  const diagnostics = getTasksRuntimeDiagnostics(config);
  const baseMessage =
    error instanceof Error && error.message
      ? error.message
      : "Tasks request failed.";

  if (diagnostics.effectiveMode !== "http") {
    return baseMessage;
  }

  if (diagnostics.usesLocalProxy) {
    return `${baseMessage} Tasks HTTP mode is using the local /api/tasks bridge, so make sure the web app can reach the local backend target.`;
  }

  return `${baseMessage} Tasks HTTP mode is using a direct backend target, so check the configured tasks HTTP base URL.`;
}
