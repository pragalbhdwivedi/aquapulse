"use client";

import { useMemo, useState, type FormEvent } from "react";
import type {
  FrontendSessionBootstrapStatus,
  WaterQualityReading
} from "@aquapulse/types";
import { parseClientRuntimeConfig } from "@web/clients/runtime-config";
import {
  deriveNonAlertOperatorAccessSummary,
  deriveProtectedOperatorUiGuard
} from "@web/features/auth-session";
import {
  createWaterQualityUpdateSubmitter,
  type WaterQualityUpdateSubmissionResult
} from "@web/features/water-quality-update";
import { deriveWaterQualityRuntimeIndicator, formatWaterQualityRuntimeError } from "@web/features/water-quality-runtime";
import { toMutationSyncPageState } from "@web/features/mutation-refresh";
import { createRepositoriesFromConfig } from "@web/repositories";

interface WaterQualityUpdateFormProps {
  readonly pondId: string;
  readonly reading: WaterQualityReading;
  readonly session: FrontendSessionBootstrapStatus;
}

export function WaterQualityUpdateForm({
  pondId,
  reading,
  session
}: WaterQualityUpdateFormProps) {
  const [recordedAt, setRecordedAt] = useState(reading.recordedAt);
  const [temperatureC, setTemperatureC] = useState(
    reading.temperatureC?.toString() ?? ""
  );
  const [ph, setPh] = useState(reading.ph?.toString() ?? "");
  const [result, setResult] = useState<WaterQualityUpdateSubmissionResult | null>(null);
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
  const submitUpdate = useMemo(
    () => createWaterQualityUpdateSubmitter(repositories)(reading.id, pondId),
    [repositories, reading.id, pondId]
  );
  const runtimeIndicator = useMemo(
    () => deriveWaterQualityRuntimeIndicator(runtimeConfig),
    [runtimeConfig]
  );
  const updateGuard = useMemo(
    () =>
      deriveProtectedOperatorUiGuard(session, {
        sliceLabel: session.quinaryNonAlertsGuardedSliceLabel ?? "water_quality_update",
        enforcedByBackend: session.quinaryNonAlertsGuardedSliceEnforced
      }),
    [session]
  );
  const operatorSummary = useMemo(() => deriveNonAlertOperatorAccessSummary(session), [session]);
  const pageState = toMutationSyncPageState(result, isSubmitting);
  const updateDisabled = !updateGuard.enabled;
  const operatorStatusLabel =
    operatorSummary.accessState === "available"
      ? "action available"
      : operatorSummary.accessState === "bypassed_local"
        ? "allowed in disabled/local modes"
        : operatorSummary.accessState === "degraded"
          ? "protected with degraded forwarding/session"
          : "protected and waiting for forwarded auth/session";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (updateDisabled) {
      return;
    }

    setIsSubmitting(true);
    setRuntimeError(null);

    try {
      const submission = await submitUpdate({
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
      <h2>Update Water-Quality Reading</h2>
      <p>Use this bounded follow-up edit path only after reviewing the latest detailed reading and recent history. Saving stays manual and review-first.</p>
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
        <span style={{ color: updateDisabled ? "#fca5a5" : "#94a3b8" }}>
          Water-quality update auth: {updateGuard.sliceLabel} / {updateGuard.state}
        </span>
        <span style={{ color: updateDisabled ? "#fca5a5" : "#94a3b8" }}>
          Shared non-alert operator access: {operatorSummary.label} / {operatorStatusLabel}
        </span>
        <span style={{ color: updateDisabled ? "#fca5a5" : "#94a3b8" }}>
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
        What this does: updates the selected reading only. It does not create a new reading or change the rest of the history.
      </p>
      <label style={{ display: "block", marginBottom: 8 }}>
        Recorded At
        <input value={recordedAt} onChange={(event) => setRecordedAt(event.target.value)} disabled={updateDisabled} />
      </label>
      <label style={{ display: "block", marginBottom: 8 }}>
        Temperature C
        <input value={temperatureC} onChange={(event) => setTemperatureC(event.target.value)} disabled={updateDisabled} />
      </label>
      <label style={{ display: "block", marginBottom: 8 }}>
        pH
        <input value={ph} onChange={(event) => setPh(event.target.value)} disabled={updateDisabled} />
      </label>
      <button type="submit" disabled={pageState.isSubmitting || updateDisabled}>
        {pageState.isSubmitting ? "Saving..." : "Update Reading"}
      </button>
      {pageState.status === "success" ? (
        <p>
          Updated reading {pageState.data?.id}. Refreshed readings: {pageState.refreshedList?.items.length ?? 0}. Synced detail timestamp: {pageState.refreshedDetail?.updatedAt ?? "n/a"}.
        </p>
      ) : null}
      {pageState.status === "validation_error" ? (
        <p>
          Validation failed:{" "}
          {Object.values(pageState.fieldErrors).filter(Boolean).join(", ")}
        </p>
      ) : null}
      {runtimeError ? <p style={{ color: "#fca5a5" }}>{runtimeError}</p> : null}
      {updateDisabled ? (
        <p style={{ color: "#fca5a5" }}>
          Water-quality update is backend-protected in active auth mode. Forwarded auth/current-session
          must be available before this bounded manual update can run.
        </p>
      ) : null}
    </form>
  );
}
