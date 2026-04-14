import { Injectable } from "@nestjs/common";
import type {
  AlertActionHistoryItem,
  AlertLifecycleActionRequest,
  AlertSummary,
  ListResponse
} from "@aquapulse/types";
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
  status: "open",
  actionHistory: [
    {
      action: "created",
      timestamp: "2026-04-13T00:00:00.000Z"
    }
  ]
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

function sortAlerts(items: AlertSummary[], sortBy: AlertsListQueryContract["sortBy"]) {
  const sorted = [...items];
  switch (sortBy) {
    case "createdAt_asc":
      sorted.sort((left, right) => left.createdAt.localeCompare(right.createdAt));
      break;
    case "updatedAt_asc":
      sorted.sort((left, right) => left.updatedAt.localeCompare(right.updatedAt));
      break;
    case "createdAt_desc":
      sorted.sort((left, right) => right.createdAt.localeCompare(left.createdAt));
      break;
    case "updatedAt_desc":
    default:
      sorted.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
      break;
  }
  return sorted;
}

function applyAlertMutation(
  repository: InMemoryAlertsRepository,
  id: string,
  patch: Partial<AlertSummary>,
  actionHistoryItem: AlertActionHistoryItem | undefined,
  updatedAt: string
): AlertSummary {
  const alerts = getAlerts(repository);
  const current = alerts.find((item) => item.id === id) ?? alerts[0];
  const updated: AlertSummary = {
    ...current,
    ...patch,
    latestNote: actionHistoryItem?.note ?? patch.latestNote ?? current.latestNote,
    actionHistory: actionHistoryItem
      ? [...(current.actionHistory ?? []), actionHistoryItem]
      : current.actionHistory,
    updatedAt
  };
  const index = alerts.findIndex((item) => item.id === id);
  if (index >= 0) {
    alerts[index] = updated;
  } else {
    alerts.push(updated);
  }
  return updated;
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
      status: input.status ?? "open",
      actionHistory: [
        {
          action: "created",
          note: input.latestNote,
          timestamp: "2026-04-15T10:00:00.000Z"
        }
      ],
      latestNote: input.latestNote
    };
    alerts.push(created);
    return created;
  }

  async update(id: string, input: UpdateAlertsDto): Promise<AlertSummary> {
    return applyAlertMutation(this, id, input, undefined, "2026-04-15T10:05:00.000Z");
  }

  async acknowledge(id: string, input: AlertLifecycleActionRequest): Promise<AlertSummary> {
    return applyAlertMutation(
      this,
      id,
      { status: "acknowledged" },
      {
        action: "acknowledged",
        note: input.note,
        timestamp: "2026-04-15T10:10:00.000Z"
      },
      "2026-04-15T10:10:00.000Z"
    );
  }

  async resolve(id: string, input: AlertLifecycleActionRequest): Promise<AlertSummary> {
    return applyAlertMutation(
      this,
      id,
      { status: "resolved" },
      {
        action: "resolved",
        note: input.note,
        timestamp: "2026-04-15T10:15:00.000Z"
      },
      "2026-04-15T10:15:00.000Z"
    );
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
        (query.hasLatestNote === undefined ||
          (query.hasLatestNote ? Boolean(item.latestNote?.trim()) : !item.latestNote?.trim())) &&
        (!query.search || item.title.toLowerCase().includes(query.search.toLowerCase()))
    );
    return createPage(sortAlerts(filtered, query.sortBy), query.page, query.pageSize);
  }

  async listOpen(): Promise<ListResponse<AlertSummary>> {
    return createPage(getAlerts(this).filter((item) => item.status === "open"));
  }
}
