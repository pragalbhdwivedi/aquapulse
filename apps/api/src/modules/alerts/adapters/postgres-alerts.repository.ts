import { Injectable } from "@nestjs/common";
import type { AlertSummary, ListResponse } from "@aquapulse/types";
import type { CreateAlertsDto, UpdateAlertsDto } from "../dto";
import type { AlertsRepositoryPort } from "../ports/alerts-repository.port";
import type { AlertsListQueryContract } from "../query-contracts/alerts-query.contract";

interface AlertRow {
  readonly id: string;
  readonly title: string;
  readonly severity: "low" | "medium" | "high" | "critical";
  readonly source: string;
  readonly pond_id?: string;
  readonly status: "open" | "acknowledged" | "resolved";
  readonly created_at: string;
  readonly updated_at: string;
}

function mapAlertRowToDomain(row: AlertRow): AlertSummary {
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

function createPlaceholderAlertRow(): AlertRow {
  return {
    id: "alert-1",
    title: "Low dissolved oxygen warning",
    severity: "high",
    source: "water-quality",
    pond_id: "pond-1",
    status: "open",
    created_at: "2026-04-13T00:00:00.000Z",
    updated_at: "2026-04-13T00:00:00.000Z"
  };
}

@Injectable()
export class PostgresAlertsRepository implements AlertsRepositoryPort {
  async create(_input: CreateAlertsDto): Promise<AlertSummary> {
    return mapAlertRowToDomain(createPlaceholderAlertRow());
  }

  async update(_id: string, _input: UpdateAlertsDto): Promise<AlertSummary> {
    return mapAlertRowToDomain(createPlaceholderAlertRow());
  }

  async getById(_id: string): Promise<AlertSummary> {
    return mapAlertRowToDomain(createPlaceholderAlertRow());
  }

  async list(_query: AlertsListQueryContract): Promise<ListResponse<AlertSummary>> {
    return {
      items: [mapAlertRowToDomain(createPlaceholderAlertRow())],
      page: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 }
    };
  }

  async listOpen(): Promise<ListResponse<AlertSummary>> {
    return {
      items: [mapAlertRowToDomain(createPlaceholderAlertRow())],
      page: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 }
    };
  }
}

export const POSTGRES_ALERTS_IMPLEMENTATION_PLAN = {
  readMethods: ["getById", "list", "listOpen"],
  writeMethods: ["create", "update"],
  rowSource: "alerts",
  queryNotes: ["filter by severity/source/status", "support open-alert fast path"],
  mappingNotes: ["map alert rows into AlertSummary"]
} as const;
