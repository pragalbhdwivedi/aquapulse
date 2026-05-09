import {
  buildAlertSummaryQuery,
  getAlertQueuePresetQuery,
  type AlertQueuePresetId,
  type AlertQueueSummary,
  type AlertSavedViewCreateRequest,
  type AlertSavedViewDefinition,
  type AlertSummary
} from "@aquapulse/types";
import type { AlertsListQuery } from "../contracts/api";
import type { AlertsRepository } from "../repositories";

export const defaultAlertWorkbenchOwner = "operator-queue";
const alertSavedViewsStorageKey = "aquapulse.alert.savedViews";
const MAX_SAVED_VIEW_STORE_SIZE = 25;

export function getAlertPresetQuery(
  presetId: AlertQueuePresetId,
  currentOwnerId = defaultAlertWorkbenchOwner
): Partial<AlertsListQuery> {
  return getAlertQueuePresetQuery(presetId, currentOwnerId);
}

export function getAlertSummaryQuery(query: Partial<AlertsListQuery>): AlertsListQuery {
  return {
    page: query.page ?? 1,
    pageSize: query.pageSize ?? 20,
    ...buildAlertSummaryQuery(query)
  };
}

export interface AlertQueuePageResetInput {
  readonly presetId?: AlertQueuePresetId | "custom";
  readonly savedViewId?: string | null;
  readonly status?: AlertsListQuery["status"] | "all";
  readonly hasLatestNote?: boolean;
  readonly pondId?: string;
  readonly assignedTo?: string;
  readonly reviewState?: AlertsListQuery["reviewState"] | "all";
  readonly sortBy?: AlertsListQuery["sortBy"];
}

export function buildAlertQueuePageResetKey(input: AlertQueuePageResetInput): string {
  return JSON.stringify({
    presetId: input.presetId ?? "custom",
    savedViewId: input.savedViewId ?? "",
    status: input.status ?? "all",
    hasLatestNote: Boolean(input.hasLatestNote),
    pondId: input.pondId?.trim() ?? "",
    assignedTo: input.assignedTo?.trim() ?? "",
    reviewState: input.reviewState ?? "all",
    sortBy: input.sortBy ?? "updatedAt_desc"
  });
}

export function deriveSelectedAlert(
  alerts: readonly AlertSummary[],
  selectedAlertId: string | null
): AlertSummary | undefined {
  return alerts.find((item) => item.id === selectedAlertId);
}

export function deriveOwnerAlertIndicators(
  summary: AlertQueueSummary,
  ownerId = defaultAlertWorkbenchOwner
) {
  const workload = summary.ownerWorkloads.find((item) => item.ownerId === ownerId);

  return {
    ownerId,
    assignedAlerts: workload?.assignedAlerts ?? 0,
    openAlerts: workload?.openAlerts ?? 0,
    underReviewAlerts: workload?.underReviewAlerts ?? 0,
    unresolvedAlerts: workload?.unresolvedAlerts ?? 0
  };
}

export function createAlertSavedView(
  input: AlertSavedViewCreateRequest,
  now = new Date().toISOString()
): AlertSavedViewDefinition {
  return {
    id: `alert-view-${Math.random().toString(36).slice(2, 10)}`,
    name: input.name,
    presetId: input.presetId,
    query: input.query,
    createdAt: now,
    updatedAt: now
  };
}

function capSavedViewStore(
  views: readonly AlertSavedViewDefinition[]
): AlertSavedViewDefinition[] {
  return views.length > MAX_SAVED_VIEW_STORE_SIZE
    ? [...views].slice(-MAX_SAVED_VIEW_STORE_SIZE)
    : [...views];
}

export interface AlertSavedViewsStore {
  list(): AlertSavedViewDefinition[];
  save(input: AlertSavedViewCreateRequest): AlertSavedViewDefinition[];
  remove(id: string): AlertSavedViewDefinition[];
}

export interface AlertSavedViewsRepositoryStore {
  list(): Promise<AlertSavedViewDefinition[]>;
  save(input: AlertSavedViewCreateRequest): Promise<AlertSavedViewDefinition[]>;
  remove(id: string): Promise<AlertSavedViewDefinition[]>;
}

export function createAlertSavedViewsStore(
  storage: Pick<Storage, "getItem" | "setItem"> | undefined
): AlertSavedViewsStore {
  const memoryState: { views: AlertSavedViewDefinition[] } = { views: [] };

  function read(): AlertSavedViewDefinition[] {
    if (!storage) {
      return capSavedViewStore(memoryState.views);
    }

    const raw = storage.getItem(alertSavedViewsStorageKey);
    if (!raw) {
      return [];
    }

    try {
      return capSavedViewStore(JSON.parse(raw) as AlertSavedViewDefinition[]);
    } catch {
      return [];
    }
  }

  function write(views: AlertSavedViewDefinition[]): AlertSavedViewDefinition[] {
    const next = capSavedViewStore(views);
    memoryState.views = next;
    if (storage) {
      storage.setItem(alertSavedViewsStorageKey, JSON.stringify(next));
    }
    return next;
  }

  return {
    list() {
      return read();
    },
    save(input) {
      return write([...read(), createAlertSavedView(input)]);
    },
    remove(id) {
      return write(read().filter((item) => item.id !== id));
    }
  };
}

export function createAlertSavedViewsRepositoryStore(
  alertsRepository: Pick<AlertsRepository, "listSavedViews" | "saveSavedView" | "removeSavedView">
): AlertSavedViewsRepositoryStore {
  return {
    async list() {
      const response = await alertsRepository.listSavedViews();
      return response.data;
    },
    async save(input) {
      const response = await alertsRepository.saveSavedView(input);
      return response.data;
    },
    async remove(id) {
      const response = await alertsRepository.removeSavedView(id);
      return response.data;
    }
  };
}
