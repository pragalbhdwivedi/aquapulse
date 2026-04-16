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

export const defaultAlertWorkbenchOwner = "operator-queue";
const alertSavedViewsStorageKey = "aquapulse.alert.savedViews";

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

export interface AlertSavedViewsStore {
  list(): AlertSavedViewDefinition[];
  save(input: AlertSavedViewCreateRequest): AlertSavedViewDefinition[];
  remove(id: string): AlertSavedViewDefinition[];
}

export function createAlertSavedViewsStore(
  storage: Pick<Storage, "getItem" | "setItem"> | undefined
): AlertSavedViewsStore {
  const memoryState: { views: AlertSavedViewDefinition[] } = { views: [] };

  function read(): AlertSavedViewDefinition[] {
    if (!storage) {
      return memoryState.views;
    }

    const raw = storage.getItem(alertSavedViewsStorageKey);
    if (!raw) {
      return [];
    }

    try {
      return JSON.parse(raw) as AlertSavedViewDefinition[];
    } catch {
      return [];
    }
  }

  function write(views: AlertSavedViewDefinition[]) {
    memoryState.views = views;
    if (storage) {
      storage.setItem(alertSavedViewsStorageKey, JSON.stringify(views));
    }
  }

  return {
    list() {
      return read();
    },
    save(input) {
      const next = [...read(), createAlertSavedView(input)];
      write(next);
      return next;
    },
    remove(id) {
      const next = read().filter((item) => item.id !== id);
      write(next);
      return next;
    }
  };
}
