"use client";

import { useMemo, useState, type FormEvent } from "react";
import type { FrontendSessionBootstrapStatus } from "@aquapulse/types";
import type { WaterQualityEntrySubmissionResult } from "@web/features/water-quality-entry";
import { createWaterQualityEntrySubmitter } from "@web/features/water-quality-entry";
import { toMutationPageState } from "@web/features/mutation-refresh";
import { parseClientRuntimeConfig } from "@web/clients/runtime-config";
import { createRepositoriesFromConfig } from "@web/repositories";
import {
  deriveNonAlertOperatorAccessSummary,
  deriveProtectedOperatorUiGuard
} from "@web/features/auth-session";
import {
  deriveWaterQualityRuntimeIndicator,
  formatWaterQualityRuntimeError
} from "@web/features/water-quality-runtime";

export function WaterQualityEntryForm({
  pondId,
  session
}: {
  pondId: string;
  session: FrontendSessionBootstrapStatus;
}) {
  const [recordedAt, setRecordedAt] = useState("2026-04-14T08:00:00.000Z");
  const [temperatureC, setTemperatureC] = useState("28.4");
  const [ph, setPh] = useState("7.6");
  const [result, setResult] = useState<WaterQualityEntrySubmissionResult | null>(null);
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
        NEXT_PUBLIC_AQUAPULSE_WEB_WATER_QUALITY_MODE:
          process.env.NEXT_PUBLIC_AQUAPULSE_WEB_WATER_QUALITY_MODE,
        NEXT_PUBLIC_AQUAPULSE_WEB_WATER_QUALITY_HTTP_BASE_URL:
          process.env.NEXT_PUBLIC_AQUAPULSE_WEB_WATER_QUALITY_HTTP_BASE_URL,
        NEXT_PUBLIC_AQUAPULSE_WEB_WATER_QUALITY_HTTP_TRANSPORT:
          process.env.NEXT_PUBLIC_AQUAPULSE_WEB_WATER_QUALITY_HTTP_TRANSPORT
      }),
    []
  );
  const repositories = useMemo(() => createRepositoriesFromConfig(runtimeConfig), [runtimeConfig]);
  const submitEntry = useMemo(
    () => createWaterQualityEntrySubmitter(repositories),
    [repositories]
  );
  const runtimeIndicator = useMemo(
    () => deriveWaterQualityRuntimeIndicator(runtimeConfig),
    [runtimeConfig]
  );
  const createGuard = useMemo(
    () =>
      deriveProtectedOperatorUiGuard(session, {
        sliceLabel: session.quaternaryNonAlertsGuardedSliceLabel ?? "water_quality_create",
        enforcedByBackend: session.quaternaryNonAlertsGuardedSliceEnforced
      }),
    [session]
  );
  const operatorSummary = useMemo(() => deriveNonAlertOperatorAccessSummary(session), [session]);
  const pageState = toMutationPageState(result, isSubmitting);
  const createDisabled = !createGuard.enabled;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (createDisabled) {
      return;
    }
    setIsSubmitting(true);
    setRuntimeError(null);

    try {
      const submission = await submitEntry({
        pondId,
        recordedAt,
        temperatureC: temperatureC ? Number(temperatureC) : undefined,
        ph: ph ? Number(ph) : undefined
      });

      setResult(submission);
    } catch (error) {
      setRuntimeError(formatWaterQualityRuntimeError(error, runtimeConfig));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: 24 }}>
      <h2>Water-Quality Entry</h2>
      <p>Use this bounded create path to record a new reading after checking the latest detail and recent history. Saving stays manual and review-first.</p>
      <div
        style={{
          display: "grid",
          gap: "0.25rem",
          marginBottom: 12,
          padding: "0.65rem 0.8rem",
          borderRadius: "0.65rem",
          background: "rgba(30, 41, 59, 0.45)",
          color: "#cbd5e1"
        }}
      >
        <span>
          Water-quality runtime: {runtimeIndicator.modeLabel} / Target: {runtimeIndicator.targetLabel}
        </span>
        <span style={{ color: "#94a3b8" }}>{runtimeIndicator.helperText}</span>
        <span style={{ color: createDisabled ? "#fca5a5" : "#94a3b8" }}>
          Water-quality create auth: {createGuard.sliceLabel} / {createGuard.state}
        </span>
        <span style={{ color: createDisabled ? "#fca5a5" : "#94a3b8" }}>
          Shared non-alert operator access: {operatorSummary.label} / {operatorSummary.accessState}
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
      <p style={{ margin: 0, color: "#94a3b8" }}>
        What this does: adds a new reading for this pond. It does not replace earlier readings automatically.
      </p>
      <label style={{ display: "block", marginBottom: 8 }}>
        Recorded At
        <input value={recordedAt} onChange={(event) => setRecordedAt(event.target.value)} disabled={createDisabled} />
      </label>
      <label style={{ display: "block", marginBottom: 8 }}>
        Temperature C
        <input value={temperatureC} onChange={(event) => setTemperatureC(event.target.value)} disabled={createDisabled} />
      </label>
      <label style={{ display: "block", marginBottom: 8 }}>
        pH
        <input value={ph} onChange={(event) => setPh(event.target.value)} disabled={createDisabled} />
      </label>
      <button type="submit" disabled={pageState.isSubmitting || createDisabled}>
        {pageState.isSubmitting ? "Saving..." : "Save Entry"}
      </button>
      {pageState.status === "success" ? (
        <p>
          Saved reading {pageState.data?.id} for pond {pageState.data?.pondId}. Refreshed readings: {pageState.refreshedList?.items.length ?? 0}.
        </p>
      ) : null}
      {pageState.status === "validation_error" ? (
        <p>
          Validation failed:
          {" "}
          {Object.values(pageState.fieldErrors).filter(Boolean).join(", ")}
        </p>
      ) : null}
      {runtimeError ? <p style={{ color: "#fca5a5" }}>{runtimeError}</p> : null}
      {createDisabled ? (
        <p style={{ color: "#fca5a5" }}>
          Water-quality create is backend-protected in active auth mode. Forwarded auth/current-session
          must be available before this bounded manual create action can run.
        </p>
      ) : null}
    </form>
  );
}
