import { describe, expect, it } from "vitest";
import type { AlertQueueSummary, AlertSummary } from "@aquapulse/types";
import {
  buildAlertQueuePageResetKey,
  createAlertSavedViewsStore,
  defaultAlertWorkbenchOwner,
  deriveOwnerAlertIndicators,
  getAlertPresetQuery,
  getAlertSummaryQuery
} from "../features/alert-workbench";

const summary: AlertQueueSummary = {
  totalAlerts: 2,
  statusCounts: { open: 1, acknowledged: 1, resolved: 0 },
  assignmentCounts: { assigned: 1, unassigned: 1 },
  reviewStateCounts: { unreviewed: 1, underReview: 1, reviewed: 0, deferred: 0 },
  noteCounts: { withLatestNote: 1, withoutLatestNote: 1 },
  severityCounts: { low: 0, medium: 1, high: 1, critical: 0 },
  ownerWorkloads: [
    {
      ownerId: defaultAlertWorkbenchOwner,
      assignedAlerts: 1,
      openAlerts: 1,
      underReviewAlerts: 1,
      unresolvedAlerts: 1
    }
  ]
};

describe("Alert workbench helpers", () => {
  it("derives owner indicators and summary queries predictably", () => {
    expect(deriveOwnerAlertIndicators(summary, defaultAlertWorkbenchOwner)).toEqual({
      ownerId: defaultAlertWorkbenchOwner,
      assignedAlerts: 1,
      openAlerts: 1,
      underReviewAlerts: 1,
      unresolvedAlerts: 1
    });
    expect(
      getAlertSummaryQuery({
        page: 1,
        pageSize: 20,
        status: "open",
        reviewState: "under_review"
      })
    ).toEqual({
      page: 1,
      pageSize: 20,
      status: undefined,
      reviewState: undefined
    });
  });

  it("applies preset queries with the owner placeholder", () => {
    expect(getAlertPresetQuery("assigned_to_me", defaultAlertWorkbenchOwner)).toMatchObject({
      assignedTo: defaultAlertWorkbenchOwner
    });
    expect(getAlertPresetQuery("with_notes", defaultAlertWorkbenchOwner)).toMatchObject({
      hasLatestNote: true
    });
  });

  it("saves and removes workbench views through the local persistence boundary", () => {
    const storage = new Map<string, string>();
    const store = createAlertSavedViewsStore({
      getItem(key) {
        return storage.get(key) ?? null;
      },
      setItem(key, value) {
        storage.set(key, value);
      }
    });

    const saved = store.save({
      name: "Assigned queue",
      presetId: "assigned_to_me",
      query: {
        assignedTo: defaultAlertWorkbenchOwner,
        page: 1,
        pageSize: 20
      }
    });

    expect(saved).toHaveLength(1);
    expect(store.list()[0]?.name).toBe("Assigned queue");
    expect(store.remove(saved[0]!.id)).toHaveLength(0);
  });

  it("caps the local saved-view memory store to keep long sessions bounded", () => {
    const store = createAlertSavedViewsStore(undefined);
    let latest = store.list();

    for (let index = 0; index < 30; index += 1) {
      latest = store.save({
        name: `Queue ${index + 1}`,
        presetId: "all_open",
        query: {
          page: 1,
          pageSize: 20,
          status: "open"
        }
      });
    }

    expect(latest).toHaveLength(25);
    expect(latest[0]?.name).toBe("Queue 6");
    expect(latest.at(-1)?.name).toBe("Queue 30");
  });

  it("builds a stable pagination reset key for query-driving changes", () => {
    const baseKey = buildAlertQueuePageResetKey({
      presetId: "custom",
      status: "open",
      sortBy: "updatedAt_desc",
      pondId: "pond-1",
      assignedTo: defaultAlertWorkbenchOwner,
      reviewState: "under_review",
      hasLatestNote: true
    });

    expect(
      buildAlertQueuePageResetKey({
        presetId: "custom",
        status: "open",
        sortBy: "updatedAt_desc",
        pondId: "pond-1",
        assignedTo: defaultAlertWorkbenchOwner,
        reviewState: "under_review",
        hasLatestNote: true
      })
    ).toBe(baseKey);
    expect(
      buildAlertQueuePageResetKey({
        presetId: "assigned_to_me",
        status: "open",
        sortBy: "updatedAt_desc",
        pondId: "pond-1",
        assignedTo: defaultAlertWorkbenchOwner,
        reviewState: "under_review",
        hasLatestNote: true
      })
    ).not.toBe(baseKey);
  });
});
