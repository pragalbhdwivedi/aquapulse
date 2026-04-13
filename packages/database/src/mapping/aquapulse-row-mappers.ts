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
