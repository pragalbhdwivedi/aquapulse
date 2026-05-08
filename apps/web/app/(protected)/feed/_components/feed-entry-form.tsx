"use client";

import { useMemo, useState } from "react";
import type { FrontendSessionBootstrapStatus } from "@aquapulse/types";
import { type FeedEntrySubmissionResult, createFeedEntrySubmitter } from "@web/features/feed-entry";
import { toMutationPageState } from "@web/features/mutation-refresh";
import { parseClientRuntimeConfig } from "@web/clients/runtime-config";
import { createRepositoriesFromConfig } from "@web/repositories";
import {
  deriveNonAlertOperatorAccessSummary,
  deriveProtectedOperatorUiGuard
} from "@web/features/auth-session";
import {
  deriveFeedRuntimeIndicator,
  formatFeedRuntimeError
} from "@web/features/feed-runtime";

interface FeedEntryFormProps {
  readonly pondId?: string;
  readonly batchId?: string;
  readonly session: FrontendSessionBootstrapStatus;
}

export function FeedEntryForm({
  pondId = "pond-1",
  batchId = "batch-1",
  session
}: FeedEntryFormProps) {
  const [feedType, setFeedType] = useState("Starter Feed");
  const [quantityKg, setQuantityKg] = useState("18");
  const [fedAt, setFedAt] = useState("2026-04-14T06:00:00.000Z");
  const [result, setResult] = useState<FeedEntrySubmissionResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [runtimeError, setRuntimeError] = useState<string | null>(null);
  const runtimeConfig = useMemo(
    () =>
      parseClientRuntimeConfig({
        NEXT_PUBLIC_AQUAPULSE_WEB_CLIENT_MODE: process.env.NEXT_PUBLIC_AQUAPULSE_WEB_CLIENT_MODE,
        NEXT_PUBLIC_AQUAPULSE_WEB_ENABLE_PLACEHOLDER_HTTP:
          process.env.NEXT_PUBLIC_AQUAPULSE_WEB_ENABLE_PLACEHOLDER_HTTP,
        NEXT_PUBLIC_AQUAPULSE_WEB_ENABLE_FETCH_HTTP:
          process.env.NEXT_PUBLIC_AQUAPULSE_WEB_ENABLE_FETCH_HTTP,
        NEXT_PUBLIC_AQUAPULSE_WEB_HTTP_BASE_URL: process.env.NEXT_PUBLIC_AQUAPULSE_WEB_HTTP_BASE_URL,
        NEXT_PUBLIC_AQUAPULSE_WEB_FEED_MODE: process.env.NEXT_PUBLIC_AQUAPULSE_WEB_FEED_MODE,
        NEXT_PUBLIC_AQUAPULSE_WEB_FEED_HTTP_BASE_URL:
          process.env.NEXT_PUBLIC_AQUAPULSE_WEB_FEED_HTTP_BASE_URL,
        NEXT_PUBLIC_AQUAPULSE_WEB_FEED_HTTP_TRANSPORT:
          process.env.NEXT_PUBLIC_AQUAPULSE_WEB_FEED_HTTP_TRANSPORT
      }),
    []
  );
  const repositories = useMemo(() => createRepositoriesFromConfig(runtimeConfig), [runtimeConfig]);
  const submitEntry = useMemo(() => createFeedEntrySubmitter(repositories), [repositories]);
  const runtimeIndicator = useMemo(
    () => deriveFeedRuntimeIndicator(runtimeConfig),
    [runtimeConfig]
  );
  const createGuard = useMemo(
    () =>
      deriveProtectedOperatorUiGuard(session, {
        sliceLabel: session.senaryNonAlertsGuardedSliceLabel ?? "feed_create",
        enforcedByBackend: session.senaryNonAlertsGuardedSliceEnforced
      }),
    [session]
  );
  const operatorSummary = useMemo(() => deriveNonAlertOperatorAccessSummary(session), [session]);
  const pageState = toMutationPageState(result, isSubmitting);
  const createDisabled = !createGuard.enabled;
  const operatorStatusLabel =
    operatorSummary.accessState === "available"
      ? "action available"
      : operatorSummary.accessState === "bypassed_local"
        ? "allowed in disabled/local modes"
        : operatorSummary.accessState === "degraded"
          ? "protected with degraded forwarding/session"
          : "protected and waiting for forwarded auth/session";

  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault();
        if (createDisabled) {
          return;
        }
        setIsSubmitting(true);
        setRuntimeError(null);

        try {
          const submission = await submitEntry({
            pondId,
            batchId,
            feedType,
            quantityKg: quantityKg ? Number(quantityKg) : 0,
            fedAt
          });

          setResult(submission);
        } catch (error) {
          setRuntimeError(formatFeedRuntimeError(error, runtimeConfig));
        } finally {
          setIsSubmitting(false);
        }
      }}
      style={{
        display: "grid",
        gap: "0.75rem",
        maxWidth: "28rem",
        marginTop: "1rem",
        padding: "1rem",
        border: "1px solid rgba(148, 163, 184, 0.3)",
        borderRadius: "0.75rem"
      }}
    >
      <h2 style={{ margin: 0, fontSize: "1rem" }}>Record feed entry</h2>
      <div
        style={{
          display: "grid",
          gap: "0.25rem",
          padding: "0.65rem 0.8rem",
          borderRadius: "0.65rem",
          background: "rgba(30, 41, 59, 0.45)",
          color: "#cbd5e1"
        }}
      >
        <span>
          Feed runtime: {runtimeIndicator.modeLabel} / Target: {runtimeIndicator.targetLabel}
        </span>
        <span style={{ color: "#94a3b8" }}>{runtimeIndicator.helperText}</span>
        <span style={{ color: createDisabled ? "#fca5a5" : "#94a3b8" }}>
          Feed create auth: {createGuard.sliceLabel} / {createGuard.state}
        </span>
        <span style={{ color: createDisabled ? "#fca5a5" : "#94a3b8" }}>
          Shared non-alert operator access: {operatorSummary.label} / {operatorStatusLabel}
        </span>
        <span style={{ color: createDisabled ? "#fca5a5" : "#94a3b8" }}>
          {operatorSummary.message}
        </span>
        <span style={{ color: "#94a3b8" }}>
          Current-session sufficient: {operatorSummary.currentSessionSufficient ? "yes" : "no"} /
          Forwarding: {operatorSummary.forwardingState}
        </span>
        {runtimeIndicator.warnings.map((warning) => (
          <span key={`${warning.code}:${warning.message}`} style={{ color: "#fbbf24" }}>
            {warning.message}
          </span>
        ))}
      </div>
      <label style={{ display: "grid", gap: "0.35rem" }}>
        <span>Feed Type</span>
        <input
          value={feedType}
          onChange={(event) => setFeedType(event.target.value)}
          disabled={createDisabled}
          style={{ padding: "0.6rem", borderRadius: "0.5rem", border: "1px solid #475569" }}
        />
      </label>
      <label style={{ display: "grid", gap: "0.35rem" }}>
        <span>Quantity (kg)</span>
        <input
          value={quantityKg}
          onChange={(event) => setQuantityKg(event.target.value)}
          disabled={createDisabled}
          style={{ padding: "0.6rem", borderRadius: "0.5rem", border: "1px solid #475569" }}
        />
      </label>
      <label style={{ display: "grid", gap: "0.35rem" }}>
        <span>Fed At</span>
        <input
          value={fedAt}
          onChange={(event) => setFedAt(event.target.value)}
          disabled={createDisabled}
          style={{ padding: "0.6rem", borderRadius: "0.5rem", border: "1px solid #475569" }}
        />
      </label>
      <button
        type="submit"
        disabled={pageState.isSubmitting || createDisabled}
        style={{
          padding: "0.7rem 0.9rem",
          borderRadius: "0.5rem",
          border: "1px solid #0f172a",
          background: "#e2e8f0",
          color: "#0f172a",
          fontWeight: 600
        }}
      >
        {pageState.isSubmitting ? "Saving..." : "Save feed entry"}
      </button>
      {pageState.status === "validation_error" ? (
        <p style={{ margin: 0, color: "#fca5a5" }}>
          {Object.values(pageState.fieldErrors).filter(Boolean).join(", ")}
        </p>
      ) : null}
      {pageState.status === "success" ? (
        <p style={{ margin: 0, color: "#86efac" }}>
          Saved {pageState.data?.feedType}. Refreshed entries: {pageState.refreshedList?.items.length ?? 0}
        </p>
      ) : null}
      {runtimeError ? <p style={{ margin: 0, color: "#fca5a5" }}>{runtimeError}</p> : null}
      {createDisabled ? (
        <p style={{ margin: 0, color: "#fca5a5" }}>
          Feed create is backend-protected in active auth mode. Forwarded auth/current-session
          must be available before this bounded non-alert operator action can run.
        </p>
      ) : null}
    </form>
  );
}
