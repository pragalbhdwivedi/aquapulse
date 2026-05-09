import {
  getFeedRuntimeDiagnostics,
  type AquaPulseClientRuntimeConfig
} from "../clients/runtime-config";
import type { RuntimeWarning } from "@aquapulse/types";

export interface FeedRuntimeIndicator {
  readonly modeLabel: string;
  readonly targetLabel: string;
  readonly helperText: string;
  readonly warnings: readonly RuntimeWarning[];
}

export function deriveFeedRuntimeIndicator(
  config: AquaPulseClientRuntimeConfig
): FeedRuntimeIndicator {
  const diagnostics = getFeedRuntimeDiagnostics(config);
  const modeLabel =
    diagnostics.effectiveMode === "http"
      ? diagnostics.usesLocalProxy
        ? "HTTP via local proxy"
        : "HTTP direct"
      : "Mock";
  const helperText =
    diagnostics.effectiveMode === "http"
      ? diagnostics.usesLocalProxy
        ? "Feed HTTP is opt-in. Requests go through /api/feed and the backend target is configured on the web server."
        : "Feed HTTP is opt-in. Requests go straight to the configured feed backend base URL."
      : "Feed stays mock-backed by default unless the feed-only HTTP mode is explicitly enabled.";

  return {
    modeLabel,
    targetLabel: diagnostics.targetLabel,
    helperText:
      diagnostics.effectiveMode === "http" && diagnostics.usesLocalProxy
        ? `${helperText} Use /runtime to confirm whether the backend feed adapter is still in-memory or has switched to Postgres.`
        : helperText,
    warnings: diagnostics.warnings
  };
}

export function formatFeedRuntimeError(
  error: unknown,
  config: AquaPulseClientRuntimeConfig
): string {
  const diagnostics = getFeedRuntimeDiagnostics(config);
  const baseMessage =
    error instanceof Error && error.message
      ? error.message
      : "Feed request failed.";

  if (diagnostics.effectiveMode !== "http") {
    return baseMessage;
  }

  if (diagnostics.usesLocalProxy) {
    return `${baseMessage} Feed HTTP mode is using the local /api/feed bridge, so make sure the web app can reach the local backend target.`;
  }

  return `${baseMessage} Feed HTTP mode is using a direct backend target, so check the configured feed HTTP base URL.`;
}
