"use client";

import { useMemo, useState } from "react";
import type { FrontendSessionBootstrapStatus, PondSummary } from "@aquapulse/types";
import { parseClientRuntimeConfig } from "@web/clients/runtime-config";
import { createRepositoriesFromConfig } from "@web/repositories";
import {
  deriveNonAlertOperatorAccessSummary,
  deriveProtectedOperatorUiGuard
} from "@web/features/auth-session";
import {
  createPondCreateSubmitter,
  type PondCreateSubmissionResult
} from "@web/features/pond-create";
import {
  derivePondsRuntimeIndicator,
  formatPondsRuntimeError
} from "@web/features/ponds-runtime";
import { toMutationPageState } from "@web/features/mutation-refresh";

interface PondCreateFormProps {
  readonly session: FrontendSessionBootstrapStatus;
  readonly initialFarmId?: string;
  readonly initialKind?: PondSummary["kind"];
}

export function PondCreateForm({
  session,
  initialFarmId = "farm-1",
  initialKind = "pond"
}: PondCreateFormProps) {
  const [name, setName] = useState("South Pond 2");
  const [code, setCode] = useState("SP-02");
  const [farmId, setFarmId] = useState(initialFarmId);
  const [kind, setKind] = useState<PondSummary["kind"]>(initialKind);
  const [result, setResult] = useState<PondCreateSubmissionResult | null>(null);
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
        NEXT_PUBLIC_AQUAPULSE_WEB_PONDS_MODE: process.env.NEXT_PUBLIC_AQUAPULSE_WEB_PONDS_MODE,
        NEXT_PUBLIC_AQUAPULSE_WEB_PONDS_HTTP_BASE_URL:
          process.env.NEXT_PUBLIC_AQUAPULSE_WEB_PONDS_HTTP_BASE_URL,
        NEXT_PUBLIC_AQUAPULSE_WEB_PONDS_HTTP_TRANSPORT:
          process.env.NEXT_PUBLIC_AQUAPULSE_WEB_PONDS_HTTP_TRANSPORT
      }),
    []
  );
  const repositories = useMemo(() => createRepositoriesFromConfig(runtimeConfig), [runtimeConfig]);
  const submitPond = useMemo(() => createPondCreateSubmitter(repositories), [repositories]);
  const runtimeIndicator = useMemo(
    () => derivePondsRuntimeIndicator(runtimeConfig),
    [runtimeConfig]
  );
  const createGuard = useMemo(
    () =>
      deriveProtectedOperatorUiGuard(session, {
        sliceLabel: session.octonaryNonAlertsGuardedSliceLabel ?? "ponds_create",
        enforcedByBackend: session.octonaryNonAlertsGuardedSliceEnforced
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
          const submission = await submitPond({
            name,
            code,
            farmId,
            kind
          });
          setResult(submission);
        } catch (error) {
          setRuntimeError(formatPondsRuntimeError(error, runtimeConfig));
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
      <h2 style={{ margin: 0, fontSize: "1rem" }}>Create pond</h2>
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
          Ponds runtime: {runtimeIndicator.modeLabel} / Target: {runtimeIndicator.targetLabel}
        </span>
        <span style={{ color: "#94a3b8" }}>{runtimeIndicator.helperText}</span>
        <span style={{ color: createDisabled ? "#fca5a5" : "#94a3b8" }}>
          Ponds create auth: {createGuard.sliceLabel} / {createGuard.state}
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
        <span>Name</span>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          disabled={createDisabled}
          style={{ padding: "0.6rem", borderRadius: "0.5rem", border: "1px solid #475569" }}
        />
      </label>
      <label style={{ display: "grid", gap: "0.35rem" }}>
        <span>Code</span>
        <input
          value={code}
          onChange={(event) => setCode(event.target.value)}
          disabled={createDisabled}
          style={{ padding: "0.6rem", borderRadius: "0.5rem", border: "1px solid #475569" }}
        />
      </label>
      <label style={{ display: "grid", gap: "0.35rem" }}>
        <span>Farm ID</span>
        <input
          value={farmId}
          onChange={(event) => setFarmId(event.target.value)}
          disabled={createDisabled}
          style={{ padding: "0.6rem", borderRadius: "0.5rem", border: "1px solid #475569" }}
        />
      </label>
      <label style={{ display: "grid", gap: "0.35rem" }}>
        <span>Kind</span>
        <select
          value={kind}
          onChange={(event) => setKind(event.target.value as PondSummary["kind"])}
          disabled={createDisabled}
          style={{ padding: "0.6rem", borderRadius: "0.5rem", border: "1px solid #475569" }}
        >
          <option value="pond">Pond</option>
          <option value="tank">Tank</option>
          <option value="cage">Cage</option>
        </select>
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
        {pageState.isSubmitting ? "Saving..." : "Create pond"}
      </button>
      {pageState.status === "validation_error" ? (
        <p style={{ margin: 0, color: "#fca5a5" }}>
          {Object.values(pageState.fieldErrors).filter(Boolean).join(", ")}
        </p>
      ) : null}
      {pageState.status === "success" ? (
        <p style={{ margin: 0, color: "#86efac" }}>
          Created {pageState.data?.name}. Refreshed ponds: {pageState.refreshedList?.items.length ?? 0}
        </p>
      ) : null}
      {runtimeError ? <p style={{ margin: 0, color: "#fca5a5" }}>{runtimeError}</p> : null}
      {createDisabled ? (
        <p style={{ margin: 0, color: "#fca5a5" }}>
          Ponds create is backend-protected in active auth mode. Forwarded auth/current-session
          must be available before this bounded non-alert operator action can run.
        </p>
      ) : null}
    </form>
  );
}
