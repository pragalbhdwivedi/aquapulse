import type { AlertSummary, PondSummary } from "@aquapulse/types";
import type { RowMapper } from "./row-mapper.js";

export interface PondRow {
  readonly id: string;
  readonly name: string;
  readonly code: string;
  readonly farm_id: string;
  readonly kind: PondSummary["kind"];
  readonly status: PondSummary["status"];
  readonly created_at: string;
  readonly updated_at: string;
}

export interface AlertRow {
  readonly id: string;
  readonly title: string;
  readonly severity: AlertSummary["severity"];
  readonly source: string;
  readonly pond_id?: string;
  readonly status: AlertSummary["status"];
  readonly created_at: string;
  readonly updated_at: string;
}

export interface PondRowWrite {
  readonly id: string;
  readonly name: string;
  readonly code: string;
  readonly farm_id: string;
  readonly kind: PondSummary["kind"];
  readonly status: PondSummary["status"];
  readonly created_at: string;
  readonly updated_at: string;
}

export interface PondRowPatch {
  readonly id: string;
  readonly updated_at: string;
  readonly name?: string;
  readonly code?: string;
  readonly farm_id?: string;
  readonly kind?: PondSummary["kind"];
  readonly status?: PondSummary["status"];
}

export interface AlertRowWrite {
  readonly id: string;
  readonly title: string;
  readonly severity: AlertSummary["severity"];
  readonly source: string;
  readonly pond_id?: string;
  readonly status: AlertSummary["status"];
  readonly created_at: string;
  readonly updated_at: string;
}

export interface AlertRowPatch {
  readonly id: string;
  readonly updated_at: string;
  readonly title?: string;
  readonly severity?: AlertSummary["severity"];
  readonly source?: string;
  readonly pond_id?: string;
  readonly status?: AlertSummary["status"];
}

export const pondRowMapper: RowMapper<PondRow, PondSummary> = {
  toDomain(row) {
    return {
      id: row.id,
      name: row.name,
      code: row.code,
      farmId: row.farm_id,
      kind: row.kind,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
};

export const alertRowMapper: RowMapper<AlertRow, AlertSummary> = {
  toDomain(row) {
    return {
      id: row.id,
      title: row.title,
      severity: row.severity,
      source: row.source,
      pondId: row.pond_id,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
};

export function createPlaceholderPondRow(overrides: Partial<PondRow> = {}): PondRow {
  return {
    id: "pond-1",
    name: "North Pond 1",
    code: "NP-01",
    farm_id: "farm-1",
    kind: "pond",
    status: "active",
    created_at: "2026-04-13T00:00:00.000Z",
    updated_at: "2026-04-13T00:00:00.000Z",
    ...overrides
  };
}

export function createPlaceholderAlertRow(overrides: Partial<AlertRow> = {}): AlertRow {
  return {
    id: "alert-1",
    title: "Low dissolved oxygen warning",
    severity: "high",
    source: "water-quality",
    pond_id: "pond-1",
    status: "open",
    created_at: "2026-04-13T00:00:00.000Z",
    updated_at: "2026-04-13T00:00:00.000Z",
    ...overrides
  };
}

export function mapCreatePondInputToRowWrite(input: { readonly id?: string }): PondRowWrite {
  const base = createPlaceholderPondRow(input.id ? { id: input.id } : {});

  return {
    id: base.id,
    name: base.name,
    code: base.code,
    farm_id: base.farm_id,
    kind: base.kind,
    status: base.status,
    created_at: base.created_at,
    updated_at: base.updated_at
  };
}

export function mapUpdatePondInputToRowPatch(
  id: string,
  _input: { readonly id?: string }
): PondRowPatch {
  return {
    id,
    updated_at: createPlaceholderPondRow({ id }).updated_at
  };
}

export function mapCreateAlertInputToRowWrite(input: { readonly id?: string }): AlertRowWrite {
  const base = createPlaceholderAlertRow(input.id ? { id: input.id } : {});

  return {
    id: base.id,
    title: base.title,
    severity: base.severity,
    source: base.source,
    pond_id: base.pond_id,
    status: base.status,
    created_at: base.created_at,
    updated_at: base.updated_at
  };
}

export function mapUpdateAlertInputToRowPatch(
  id: string,
  _input: { readonly id?: string }
): AlertRowPatch {
  return {
    id,
    updated_at: createPlaceholderAlertRow({ id }).updated_at
  };
}
