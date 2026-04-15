import { Injectable } from "@nestjs/common";
import type {
  AlertAssignActionRequest,
  AlertActionHistoryItem,
  AlertLifecycleActionRequest,
  AlertQueueSummary,
  AlertReviewStateActionRequest,
  AlertSummary,
  AlertUnassignActionRequest,
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
  reviewState: "unreviewed",
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

function summarizeAlerts(items: readonly AlertSummary[]): AlertQueueSummary {
  let open = 0;
  let acknowledged = 0;
  let resolved = 0;
  let assigned = 0;
  let unassigned = 0;
  let unreviewed = 0;
  let underReview = 0;
  let reviewed = 0;
  let deferred = 0;
  let withLatestNote = 0;
  let withoutLatestNote = 0;
  let low = 0;
  let medium = 0;
  let high = 0;
  let critical = 0;

  for (const item of items) {
    if (item.status === "open") open += 1;
    if (item.status === "acknowledged") acknowledged += 1;
    if (item.status === "resolved") resolved += 1;

    if (item.assignedTo) assigned += 1;
    else unassigned += 1;

    switch (item.reviewState ?? "unreviewed") {
      case "under_review":
        underReview += 1;
        break;
      case "reviewed":
        reviewed += 1;
        break;
      case "deferred":
        deferred += 1;
        break;
      case "unreviewed":
      default:
        unreviewed += 1;
        break;
    }

    if (item.latestNote?.trim()) withLatestNote += 1;
    else withoutLatestNote += 1;

    if (item.severity === "low") low += 1;
    if (item.severity === "medium") medium += 1;
    if (item.severity === "high") high += 1;
    if (item.severity === "critical") critical += 1;
  }

  return {
    totalAlerts: items.length,
    statusCounts: { open, acknowledged, resolved },
    assignmentCounts: { assigned, unassigned },
    reviewStateCounts: { unreviewed, underReview, reviewed, deferred },
    noteCounts: { withLatestNote, withoutLatestNote },
    severityCounts: { low, medium, high, critical }
  };
}

function filterAlerts(items: readonly AlertSummary[], query: AlertsListQueryContract): AlertSummary[] {
  return items.filter(
    (item) =>
      (!query.pondId || item.pondId === query.pondId) &&
      (!query.severity || item.severity === query.severity) &&
      (!query.status || item.status === query.status) &&
      (!query.source || item.source === query.source) &&
      (!query.assignedTo || item.assignedTo === query.assignedTo) &&
      (!query.reviewState || item.reviewState === query.reviewState) &&
      (query.hasLatestNote === undefined ||
        (query.hasLatestNote ? Boolean(item.latestNote?.trim()) : !item.latestNote?.trim())) &&
      (!query.search || item.title.toLowerCase().includes(query.search.toLowerCase()))
  );
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
      assignedTo: input.assignedTo,
      reviewState: input.reviewState ?? "unreviewed",
      reviewLabel: input.reviewLabel,
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

  async assign(id: string, input: AlertAssignActionRequest): Promise<AlertSummary> {
    return applyAlertMutation(
      this,
      id,
      {
        assignedTo: input.assignedTo,
        reviewState: "under_review"
      },
      {
        action: "assigned",
        note: input.note,
        assignedTo: input.assignedTo,
        reviewState: "under_review",
        timestamp: "2026-04-15T10:20:00.000Z"
      },
      "2026-04-15T10:20:00.000Z"
    );
  }

  async unassign(id: string, input: AlertUnassignActionRequest): Promise<AlertSummary> {
    return applyAlertMutation(
      this,
      id,
      {
        assignedTo: undefined
      },
      {
        action: "unassigned",
        note: input.note,
        timestamp: "2026-04-15T10:25:00.000Z"
      },
      "2026-04-15T10:25:00.000Z"
    );
  }

  async setReviewState(id: string, input: AlertReviewStateActionRequest): Promise<AlertSummary> {
    return applyAlertMutation(
      this,
      id,
      {
        reviewState: input.reviewState,
        reviewLabel: input.reviewLabel
      },
      {
        action: "review_state_changed",
        note: input.note,
        reviewState: input.reviewState,
        reviewLabel: input.reviewLabel,
        timestamp: "2026-04-15T10:30:00.000Z"
      },
      "2026-04-15T10:30:00.000Z"
    );
  }

  async getById(id: string): Promise<AlertSummary> {
    return getAlerts(this).find((item) => item.id === id) ?? getAlerts(this)[0];
  }

  async list(query: AlertsListQueryContract): Promise<ListResponse<AlertSummary>> {
    const filtered = filterAlerts(getAlerts(this), query);
    return createPage(sortAlerts(filtered, query.sortBy), query.page, query.pageSize);
  }

  async summary(query: AlertsListQueryContract): Promise<AlertQueueSummary> {
    return summarizeAlerts(filterAlerts(getAlerts(this), query));
  }

  async listOpen(): Promise<ListResponse<AlertSummary>> {
    return createPage(getAlerts(this).filter((item) => item.status === "open"));
  }
}
