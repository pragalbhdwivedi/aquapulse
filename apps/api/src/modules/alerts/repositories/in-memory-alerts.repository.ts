import { Injectable } from "@nestjs/common";
import type { AlertSummary, ListResponse } from "@aquapulse/types";
import type { CreateAlertsDto, UpdateAlertsDto } from "../dto";
import type { AlertsRepositoryPort } from "../ports/alerts-repository.port";
import type { AlertsListQueryContract } from "../query-contracts/alerts-query.contract";

const alert: AlertSummary = {
  id: "alert-1",
  createdAt: "2026-04-13T00:00:00.000Z",
  updatedAt: "2026-04-13T00:00:00.000Z",
  title: "Low dissolved oxygen warning",
  severity: "high",
  source: "water-quality",
  pondId: "pond-1",
  status: "open"
};

const alertStore = new WeakMap<InMemoryAlertsRepository, AlertSummary[]>();

function getAlerts(repository: InMemoryAlertsRepository): AlertSummary[] {
  return alertStore.get(repository) ?? [alert];
}

function createPage(items: AlertSummary[], page = 1, pageSize = 20): ListResponse<AlertSummary> {
  return {
    items,
    page: {
      page,
      pageSize,
      totalItems: items.length,
      totalPages: Math.max(1, Math.ceil(items.length / pageSize))
    }
  };
}

@Injectable()
export class InMemoryAlertsRepository implements AlertsRepositoryPort {
  constructor() {
    alertStore.set(this, [alert]);
  }

  async create(input: CreateAlertsDto): Promise<AlertSummary> {
    const alerts = getAlerts(this);
    const created: AlertSummary = {
      id: input.id ?? `alert-${alerts.length + 1}`,
      createdAt: "2026-04-15T10:00:00.000Z",
      updatedAt: "2026-04-15T10:00:00.000Z",
      title: input.title ?? "Operational alert",
      severity: input.severity ?? "medium",
      source: input.source ?? "system",
      pondId: input.pondId,
      status: input.status ?? "open"
    };
    alerts.push(created);
    return created;
  }

  async update(id: string, input: UpdateAlertsDto): Promise<AlertSummary> {
    const alerts = getAlerts(this);
    const current = alerts.find((item) => item.id === id) ?? alerts[0];
    const updated: AlertSummary = {
      ...current,
      ...input,
      updatedAt: "2026-04-15T10:05:00.000Z"
    };
    const index = alerts.findIndex((item) => item.id === id);
    if (index >= 0) {
      alerts[index] = updated;
    } else {
      alerts.push(updated);
    }
    return updated;
  }

  async getById(id: string): Promise<AlertSummary> {
    return getAlerts(this).find((item) => item.id === id) ?? getAlerts(this)[0];
  }

  async list(query: AlertsListQueryContract): Promise<ListResponse<AlertSummary>> {
    const filtered = getAlerts(this).filter(
      (item) =>
        (!query.pondId || item.pondId === query.pondId) &&
        (!query.severity || item.severity === query.severity) &&
        (!query.status || item.status === query.status) &&
        (!query.source || item.source === query.source) &&
        (!query.search || item.title.toLowerCase().includes(query.search.toLowerCase()))
    );
    return createPage(filtered, query.page, query.pageSize);
  }

  async listOpen(): Promise<ListResponse<AlertSummary>> {
    return createPage(getAlerts(this).filter((item) => item.status === "open"));
  }
}
