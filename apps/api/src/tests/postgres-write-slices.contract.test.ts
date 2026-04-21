import {
  createPlaceholderAlertActionHistoryRow,
  createPlaceholderAlertRow,
  createPlaceholderAlertSavedViewRow,
  createPlaceholderWaterQualityRow,
  createRecordingConnectionFactory,
  createTestDatabaseConfig,
  type DatabaseConnectionFactory,
  type AlertActionHistoryRow,
  type AlertRow,
  type AlertSavedViewRow,
  type WaterQualityRow,
  type RecordedDatabasePlan
} from "@aquapulse/database";
import { describe, expect, it } from "vitest";
import { PostgresAlertsRepository } from "../modules/alerts/adapters/postgres-alerts.repository";
import type { AlertsRepositoryPort } from "../modules/alerts/ports/alerts-repository.port";
import {
  buildCreateWaterQualityQueryPlan,
  buildUpdateWaterQualityQueryPlan,
  PostgresWaterQualityRepository
} from "../modules/water-quality/adapters/postgres-water-quality.repository";
import type { WaterQualityRepositoryPort } from "../modules/water-quality/ports/water-quality-repository.port";

describe("Postgres write adapter slices", () => {
  function createQueryResult<TRow>(rows: readonly TRow[]) {
    return {
      rows: rows as TRow[],
      rowCount: rows.length
    };
  }

  function createRollbackAwareConnectionFactory(
    recordedQueries: RecordedDatabasePlan[],
    state: {
      alerts: Map<string, AlertRow>;
      history: Map<string, AlertActionHistoryRow[]>;
    }
  ): DatabaseConnectionFactory {
    return {
      async create() {
        return {
          async query<TRow = Record<string, unknown>>(statement: string, params: readonly unknown[] = []) {
            recordedQueries.push({ statement, params });

            if (statement.startsWith("update alerts")) {
              const id = params[0] as string;
              const current = state.alerts.get(id) ?? createPlaceholderAlertRow({ id });
              const next: AlertRow = statement.includes("status = 'acknowledged'")
                ? {
                    ...current,
                    status: "acknowledged",
                    latest_note: (params[1] as string | null) ?? current.latest_note,
                    updated_at: params[2] as string
                  }
                : current;
              state.alerts.set(id, next);
              if (id === "alert-2" && statement.includes("status = 'acknowledged'")) {
                throw new Error("bulk mutation failed");
              }
              return createQueryResult([next] as never[] as TRow[]);
            }

            if (statement.startsWith("insert into alert_action_history")) {
              const row: AlertActionHistoryRow = {
                id: params[0] as string,
                alert_id: params[1] as string,
                action: params[2] as AlertActionHistoryRow["action"],
                note: (params[3] as string | null) ?? undefined,
                assigned_to: (params[4] as string | null) ?? undefined,
                review_state: (params[5] as AlertActionHistoryRow["review_state"] | null) ?? undefined,
                review_label: (params[6] as string | null) ?? undefined,
                created_at: params[7] as string
              };
              state.history.set(row.alert_id, [...(state.history.get(row.alert_id) ?? []), row]);
              return createQueryResult([] as TRow[]);
            }

            if (statement.includes("from alert_action_history")) {
              const alertId = params[0] as string;
              const rows = state.history.get(alertId) ?? [];
              return createQueryResult(rows as TRow[]);
            }

            if (statement.includes("from alerts") && statement.includes("where id = $1")) {
              const row = state.alerts.get(params[0] as string);
              return createQueryResult((row ? [row] : []) as TRow[]);
            }

            return createQueryResult([] as TRow[]);
          },
          async transaction(callback) {
            const snapshot = {
              alerts: new Map(state.alerts),
              history: new Map(Array.from(state.history.entries(), ([key, value]) => [key, [...value]]))
            };

            try {
              return await callback({
                async query<TRow = Record<string, unknown>>(statement: string, params: readonly unknown[] = []) {
                  recordedQueries.push({ statement, params });

                  if (statement.startsWith("update alerts")) {
                    const id = params[0] as string;
                    const current = state.alerts.get(id) ?? createPlaceholderAlertRow({ id });
                    const next: AlertRow = statement.includes("status = 'acknowledged'")
                      ? {
                          ...current,
                          status: "acknowledged",
                          latest_note: (params[1] as string | null) ?? current.latest_note,
                          updated_at: params[2] as string
                        }
                      : statement.includes("status = 'resolved'")
                        ? {
                            ...current,
                            status: "resolved",
                            latest_note: (params[1] as string | null) ?? current.latest_note,
                            updated_at: params[2] as string
                          }
                        : current;
                    state.alerts.set(id, next);
                    if (id === "alert-2" && statement.includes("status = 'acknowledged'")) {
                      throw new Error("bulk mutation failed");
                    }
                    return createQueryResult([next] as TRow[]);
                  }

                  if (statement.startsWith("insert into alert_action_history")) {
                    const row: AlertActionHistoryRow = {
                      id: params[0] as string,
                      alert_id: params[1] as string,
                      action: params[2] as AlertActionHistoryRow["action"],
                      note: (params[3] as string | null) ?? undefined,
                      assigned_to: (params[4] as string | null) ?? undefined,
                      review_state: (params[5] as AlertActionHistoryRow["review_state"] | null) ?? undefined,
                      review_label: (params[6] as string | null) ?? undefined,
                      created_at: params[7] as string
                    };
                    state.history.set(row.alert_id, [...(state.history.get(row.alert_id) ?? []), row]);
                    return createQueryResult([] as TRow[]);
                  }

                  if (statement.includes("from alert_action_history")) {
                    const alertId = params[0] as string;
                    const rows = state.history.get(alertId) ?? [];
                    return createQueryResult(rows as TRow[]);
                  }

                  if (statement.includes("from alerts") && statement.includes("where id = $1")) {
                    const row = state.alerts.get(params[0] as string);
                    return createQueryResult((row ? [row] : []) as TRow[]);
                  }

                  return createQueryResult([] as TRow[]);
                }
              });
            } catch (error) {
              state.alerts = snapshot.alerts;
              state.history = snapshot.history;
              throw error;
            }
          },
          async dispose() {
            return;
          }
        };
      },
      async checkReadiness() {
        return {
          ready: false,
          message: "Rollback-aware test factory does not check live readiness.",
          checkedAt: new Date(0).toISOString()
        };
      }
    };
  }

  it("acknowledge and resolve use the real Postgres alert write path and persist action history", async () => {
    const recordedQueries: RecordedDatabasePlan[] = [];
    const alerts = new Map<string, AlertRow>([
      [
        "alert-1",
        createPlaceholderAlertRow({
          id: "alert-1",
          status: "open",
          review_state: "unreviewed",
          latest_note: "Initial operator note"
        })
      ]
    ]);
    const history = new Map<string, AlertActionHistoryRow[]>([
      [
        "alert-1",
        [
          createPlaceholderAlertActionHistoryRow({
            id: "history-created",
            alert_id: "alert-1",
            action: "created"
          })
        ]
      ]
    ]);

    const repository: AlertsRepositoryPort = PostgresAlertsRepository.forTesting({
      connectionFactory: createRecordingConnectionFactory(recordedQueries, {
        resolveRows(statement, params) {
          if (statement.startsWith("update alerts")) {
            const id = params[0] as string;
            const current = alerts.get(id) ?? createPlaceholderAlertRow({ id });

            if (statement.includes("status = 'acknowledged'")) {
              const next: AlertRow = {
                ...current,
                status: "acknowledged",
                latest_note: (params[1] as string | null) ?? current.latest_note,
                updated_at: params[2] as string
              };
              alerts.set(id, next);
              return [next] as never[];
            }

            if (statement.includes("status = 'resolved'")) {
              const next: AlertRow = {
                ...current,
                status: "resolved",
                latest_note: (params[1] as string | null) ?? current.latest_note,
                updated_at: params[2] as string
              };
              alerts.set(id, next);
              return [next] as never[];
            }

            return [] as never[];
          }

          if (statement.startsWith("insert into alert_action_history")) {
            const row: AlertActionHistoryRow = {
              id: params[0] as string,
              alert_id: params[1] as string,
              action: params[2] as AlertActionHistoryRow["action"],
              note: (params[3] as string | null) ?? undefined,
              assigned_to: (params[4] as string | null) ?? undefined,
              review_state: (params[5] as AlertActionHistoryRow["review_state"] | null) ?? undefined,
              review_label: (params[6] as string | null) ?? undefined,
              created_at: params[7] as string
            };

            history.set(row.alert_id, [...(history.get(row.alert_id) ?? []), row]);
            return [] as never[];
          }

          if (statement.includes("from alert_action_history")) {
            return (history.get(params[0] as string) ?? []) as never[];
          }

          if (statement.includes("from alerts") && statement.includes("where id = $1")) {
            const row = alerts.get(params[0] as string);
            return row ? ([row] as never[]) : ([] as never[]);
          }

          return [] as never[];
        }
      }),
      databaseConfig: createTestDatabaseConfig()
    });

    const acknowledged = await repository.acknowledge("alert-1", { note: "Checked aerator." });
    const resolved = await repository.resolve("alert-1", { note: "Readings back in range." });
    const detail = await repository.getById("alert-1");

    expect(acknowledged.status).toBe("acknowledged");
    expect(acknowledged.latestNote).toBe("Checked aerator.");
    expect(acknowledged.actionHistory?.at(-1)?.action).toBe("acknowledged");
    expect(resolved.status).toBe("resolved");
    expect(resolved.latestNote).toBe("Readings back in range.");
    expect(resolved.actionHistory?.map((item) => item.action)).toEqual([
      "created",
      "acknowledged",
      "resolved"
    ]);
    expect(detail.actionHistory?.map((item) => item.action)).toEqual([
      "created",
      "acknowledged",
      "resolved"
    ]);
    expect(recordedQueries.some((query) => query.statement.includes("status = 'acknowledged'"))).toBe(true);
    expect(recordedQueries.some((query) => query.statement.includes("status = 'resolved'"))).toBe(true);
    expect(
      recordedQueries.filter((query) => query.statement.startsWith("insert into alert_action_history"))
    ).toHaveLength(2);
  });

  it("rolls back a bulk mutation when one item fails inside the transaction", async () => {
    const recordedQueries: RecordedDatabasePlan[] = [];
    const state = {
      alerts: new Map<string, AlertRow>([
        [
          "alert-1",
          createPlaceholderAlertRow({
            id: "alert-1",
            status: "open",
            review_state: "unreviewed"
          })
        ],
        [
          "alert-2",
          createPlaceholderAlertRow({
            id: "alert-2",
            status: "open",
            review_state: "unreviewed"
          })
        ]
      ]),
      history: new Map<string, AlertActionHistoryRow[]>([
        [
          "alert-1",
          [createPlaceholderAlertActionHistoryRow({ id: "history-created-1", alert_id: "alert-1", action: "created" })]
        ],
        [
          "alert-2",
          [createPlaceholderAlertActionHistoryRow({ id: "history-created-2", alert_id: "alert-2", action: "created" })]
        ]
      ])
    };

    const repository: AlertsRepositoryPort = PostgresAlertsRepository.forTesting({
      connectionFactory: createRollbackAwareConnectionFactory(recordedQueries, state),
      databaseConfig: createTestDatabaseConfig()
    });

    await expect(
      repository.bulkAcknowledge({
        alertIds: ["alert-1", "alert-2"],
        note: "Batch acknowledge should roll back."
      })
    ).rejects.toThrow("bulk mutation failed");

    expect(state.alerts.get("alert-1")?.status).toBe("open");
    expect(state.alerts.get("alert-2")?.status).toBe("open");
    expect(state.history.get("alert-1")?.map((item) => item.action)).toEqual(["created"]);
    expect(state.history.get("alert-2")?.map((item) => item.action)).toEqual(["created"]);
    expect(
      recordedQueries.filter((query) => query.statement.startsWith("insert into alert_action_history"))
    ).toHaveLength(1);
  });

  it("assign, review-state update, and unassign use the real Postgres alert write path with history metadata", async () => {
    const recordedQueries: RecordedDatabasePlan[] = [];
    const alerts = new Map<string, AlertRow>([
      [
        "alert-7",
        createPlaceholderAlertRow({
          id: "alert-7",
          status: "open",
          review_state: "unreviewed"
        })
      ]
    ]);
    const history = new Map<string, AlertActionHistoryRow[]>([
      [
        "alert-7",
        [
          createPlaceholderAlertActionHistoryRow({
            id: "history-created-7",
            alert_id: "alert-7",
            action: "created"
          })
        ]
      ]
    ]);

    const repository: AlertsRepositoryPort = PostgresAlertsRepository.forTesting({
      connectionFactory: createRecordingConnectionFactory(recordedQueries, {
        resolveRows(statement, params) {
          if (statement.startsWith("update alerts")) {
            const id = params[0] as string;
            const current = alerts.get(id) ?? createPlaceholderAlertRow({ id });

            if (statement.includes("assigned_to = $2")) {
              const next: AlertRow = {
                ...current,
                assigned_to: params[1] as string,
                review_state: "under_review",
                latest_note: (params[2] as string | null) ?? current.latest_note,
                updated_at: params[3] as string
              };
              alerts.set(id, next);
              return [next] as never[];
            }

            if (statement.includes("review_state = $2")) {
              const next: AlertRow = {
                ...current,
                review_state: params[1] as AlertRow["review_state"],
                review_label: (params[2] as string | null) ?? undefined,
                latest_note: (params[3] as string | null) ?? current.latest_note,
                updated_at: params[4] as string
              };
              alerts.set(id, next);
              return [next] as never[];
            }

            if (statement.includes("assigned_to = null")) {
              const next: AlertRow = {
                ...current,
                assigned_to: undefined,
                latest_note: (params[1] as string | null) ?? current.latest_note,
                updated_at: params[2] as string
              };
              alerts.set(id, next);
              return [next] as never[];
            }

            return [] as never[];
          }

          if (statement.startsWith("insert into alert_action_history")) {
            const row: AlertActionHistoryRow = {
              id: params[0] as string,
              alert_id: params[1] as string,
              action: params[2] as AlertActionHistoryRow["action"],
              note: (params[3] as string | null) ?? undefined,
              assigned_to: (params[4] as string | null) ?? undefined,
              review_state: (params[5] as AlertActionHistoryRow["review_state"] | null) ?? undefined,
              review_label: (params[6] as string | null) ?? undefined,
              created_at: params[7] as string
            };

            history.set(row.alert_id, [...(history.get(row.alert_id) ?? []), row]);
            return [] as never[];
          }

          if (statement.includes("from alert_action_history")) {
            return (history.get(params[0] as string) ?? []) as never[];
          }

          return [] as never[];
        }
      }),
      databaseConfig: createTestDatabaseConfig()
    });

    const assigned = await repository.assign("alert-7", {
      assignedTo: "operator-7",
      note: "Operator picked up review."
    });
    const reviewed = await repository.setReviewState("alert-7", {
      reviewState: "reviewed",
      reviewLabel: "oxygen-review",
      note: "Review completed."
    });
    const unassigned = await repository.unassign("alert-7", {
      note: "Return to shared queue."
    });

    expect(assigned.assignedTo).toBe("operator-7");
    expect(assigned.reviewState).toBe("under_review");
    expect(assigned.actionHistory?.at(-1)).toMatchObject({
      action: "assigned",
      assignedTo: "operator-7",
      reviewState: "under_review"
    });
    expect(reviewed.reviewState).toBe("reviewed");
    expect(reviewed.reviewLabel).toBe("oxygen-review");
    expect(reviewed.actionHistory?.at(-1)).toMatchObject({
      action: "review_state_changed",
      reviewState: "reviewed",
      reviewLabel: "oxygen-review"
    });
    expect(unassigned.assignedTo).toBeUndefined();
    expect(unassigned.actionHistory?.map((item) => item.action)).toEqual([
      "created",
      "assigned",
      "review_state_changed",
      "unassigned"
    ]);
    expect(recordedQueries.some((query) => query.statement.includes("assigned_to = $2"))).toBe(true);
    expect(recordedQueries.some((query) => query.statement.includes("review_state = $2"))).toBe(true);
    expect(recordedQueries.some((query) => query.statement.includes("assigned_to = null"))).toBe(true);
    expect(
      recordedQueries.filter((query) => query.statement.startsWith("insert into alert_action_history"))
    ).toHaveLength(3);
  });

  it("bulk alert actions use the real Postgres write path and emit history rows for each affected alert", async () => {
    const recordedQueries: RecordedDatabasePlan[] = [];
    const alerts = new Map<string, AlertRow>([
      ["alert-1", createPlaceholderAlertRow({ id: "alert-1", status: "open", review_state: "unreviewed" })],
      ["alert-2", createPlaceholderAlertRow({ id: "alert-2", status: "open", review_state: "unreviewed" })]
    ]);
    const history = new Map<string, AlertActionHistoryRow[]>([
      ["alert-1", [createPlaceholderAlertActionHistoryRow({ id: "history-created-1", alert_id: "alert-1", action: "created" })]],
      ["alert-2", [createPlaceholderAlertActionHistoryRow({ id: "history-created-2", alert_id: "alert-2", action: "created" })]]
    ]);

    const repository: AlertsRepositoryPort = PostgresAlertsRepository.forTesting({
      connectionFactory: createRecordingConnectionFactory(recordedQueries, {
        resolveRows(statement, params) {
          if (statement.startsWith("update alerts")) {
            const id = params[0] as string;
            const current = alerts.get(id) ?? createPlaceholderAlertRow({ id });

            if (statement.includes("status = 'acknowledged'")) {
              const next: AlertRow = {
                ...current,
                status: "acknowledged",
                latest_note: (params[1] as string | null) ?? current.latest_note,
                updated_at: params[2] as string
              };
              alerts.set(id, next);
              return [next] as never[];
            }

            if (statement.includes("assigned_to = $2")) {
              const next: AlertRow = {
                ...current,
                assigned_to: params[1] as string,
                review_state: "under_review",
                latest_note: (params[2] as string | null) ?? current.latest_note,
                updated_at: params[3] as string
              };
              alerts.set(id, next);
              return [next] as never[];
            }

            if (statement.includes("review_state = $2")) {
              const next: AlertRow = {
                ...current,
                review_state: params[1] as AlertRow["review_state"],
                review_label: (params[2] as string | null) ?? undefined,
                latest_note: (params[3] as string | null) ?? current.latest_note,
                updated_at: params[4] as string
              };
              alerts.set(id, next);
              return [next] as never[];
            }

            return [] as never[];
          }

          if (statement.startsWith("insert into alert_action_history")) {
            const row: AlertActionHistoryRow = {
              id: params[0] as string,
              alert_id: params[1] as string,
              action: params[2] as AlertActionHistoryRow["action"],
              note: (params[3] as string | null) ?? undefined,
              assigned_to: (params[4] as string | null) ?? undefined,
              review_state: (params[5] as AlertActionHistoryRow["review_state"] | null) ?? undefined,
              review_label: (params[6] as string | null) ?? undefined,
              created_at: params[7] as string
            };

            history.set(row.alert_id, [...(history.get(row.alert_id) ?? []), row]);
            return [] as never[];
          }

          if (statement.includes("from alert_action_history")) {
            return (history.get(params[0] as string) ?? []) as never[];
          }

          return [] as never[];
        }
      }),
      databaseConfig: createTestDatabaseConfig()
    });

    const bulkAcknowledged = await repository.bulkAcknowledge({
      alertIds: ["alert-1", "alert-2"],
      note: "Batch acknowledged."
    });
    const bulkAssigned = await repository.bulkAssign({
      alertIds: ["alert-1", "alert-2"],
      assignedTo: "operator-bulk",
      note: "Batch assigned."
    });
    const bulkReviewed = await repository.bulkSetReviewState({
      alertIds: ["alert-1", "alert-2"],
      reviewState: "under_review",
      reviewLabel: "queue-pass",
      note: "Bulk review queued."
    });

    expect(bulkAcknowledged.totalUpdated).toBe(2);
    expect(bulkAcknowledged.updatedAlerts.every((item) => item.status === "acknowledged")).toBe(true);
    expect(bulkAssigned.updatedAlerts.every((item) => item.assignedTo === "operator-bulk")).toBe(true);
    expect(bulkReviewed.updatedAlerts.every((item) => item.reviewState === "under_review")).toBe(true);
    expect(
      recordedQueries.filter((query) => query.statement.startsWith("insert into alert_action_history"))
    ).toHaveLength(6);
    const historyInsertTimestamps = recordedQueries
      .filter((query) => query.statement.startsWith("insert into alert_action_history"))
      .map((query) => query.params[7]);
    expect(historyInsertTimestamps[0]).toBe(historyInsertTimestamps[1]);
    expect(historyInsertTimestamps[2]).toBe(historyInsertTimestamps[3]);
    expect(historyInsertTimestamps[4]).toBe(historyInsertTimestamps[5]);
    expect(history.get("alert-1")?.map((item) => item.action)).toEqual([
      "created",
      "acknowledged",
      "assigned",
      "review_state_changed"
    ]);
  });

  it("saved alert views use the real Postgres path for list, save, and remove", async () => {
    const recordedQueries: RecordedDatabasePlan[] = [];
    const savedViews = new Map<string, AlertSavedViewRow>([
      [
        "alert-view-1",
        createPlaceholderAlertSavedViewRow({
          id: "alert-view-1",
          name: "Open queue"
        })
      ]
    ]);

    const repository: AlertsRepositoryPort = PostgresAlertsRepository.forTesting({
      connectionFactory: createRecordingConnectionFactory(recordedQueries, {
        resolveRows(statement, params) {
          if (statement.startsWith("insert into saved_alert_views")) {
            const row: AlertSavedViewRow = {
              id: params[0] as string,
              name: params[1] as string,
              preset_id: (params[2] as string | null) ?? undefined,
              filter_query: params[3] as Record<string, unknown>,
              created_at: params[4] as string,
              updated_at: params[5] as string
            };
            savedViews.set(row.id, row);
            return [row] as never[];
          }

          if (statement.startsWith("delete from saved_alert_views")) {
            savedViews.delete(params[0] as string);
            return [] as never[];
          }

          if (statement.includes("from saved_alert_views")) {
            return [...savedViews.values()].sort((left, right) => right.updated_at.localeCompare(left.updated_at)) as never[];
          }

          return [] as never[];
        }
      }),
      databaseConfig: createTestDatabaseConfig()
    });

    const listed = await repository.listSavedViews();
    const saved = await repository.saveSavedView({
      name: "Assigned queue",
      presetId: "assigned_to_me",
      query: { page: 1, pageSize: 20, assignedTo: "operator-queue" }
    });
    const removed = await repository.removeSavedView("alert-view-1");

    expect(listed[0]?.name).toBe("Open queue");
    expect(saved.some((item) => item.name === "Assigned queue")).toBe(true);
    expect(removed.some((item) => item.id === "alert-view-1")).toBe(false);
    expect(recordedQueries.some((query) => query.statement.startsWith("insert into saved_alert_views"))).toBe(true);
    expect(recordedQueries.some((query) => query.statement.startsWith("delete from saved_alert_views"))).toBe(true);
    expect(recordedQueries.filter((query) => query.statement.includes("from saved_alert_views")).length).toBeGreaterThanOrEqual(3);
  });

  it("water-quality create and update use the real Postgres path and return stable row-mapped results", async () => {
    const recordedQueries: RecordedDatabasePlan[] = [];
    const readings = new Map<string, WaterQualityRow>([
      [
        "wq-7",
        createPlaceholderWaterQualityRow({
          id: "wq-7",
          pond_id: "pond-7",
          recorded_at: "2026-04-16T06:00:00.000Z",
          temperature_c: 28.5,
          ph: 7.5
        })
      ]
    ]);

    const repository: WaterQualityRepositoryPort = PostgresWaterQualityRepository.forTesting({
      connectionFactory: createRecordingConnectionFactory(recordedQueries, {
        resolveRows(statement, params) {
          if (statement.startsWith("insert into water_quality")) {
            const row: WaterQualityRow = {
              id: params[0] as string,
              pond_id: params[1] as string,
              recorded_at: params[2] as string,
              temperature_c: (params[3] as number | null) ?? undefined,
              ph: (params[4] as number | null) ?? undefined,
              created_at: params[5] as string,
              updated_at: params[6] as string
            };
            readings.set(row.id, row);
            return [row] as never[];
          }

          if (statement.startsWith("update water_quality")) {
            const current = readings.get(params[0] as string) ?? createPlaceholderWaterQualityRow({ id: params[0] as string });
            const row: WaterQualityRow = {
              ...current,
              pond_id: (params[1] as string | null) ?? current.pond_id,
              recorded_at: (params[2] as string | null) ?? current.recorded_at,
              temperature_c: (params[3] as number | null) ?? current.temperature_c,
              ph: (params[4] as number | null) ?? current.ph,
              updated_at: params[5] as string
            };
            readings.set(row.id, row);
            return [row] as never[];
          }

          if (statement.includes("from water_quality") && statement.includes("where id = $1")) {
            const row = readings.get(params[0] as string);
            return row ? ([row] as never[]) : ([] as never[]);
          }

          return [] as never[];
        }
      }),
      databaseConfig: createTestDatabaseConfig()
    });

    const created = await repository.create({
      pondId: "pond-9",
      recordedAt: "2026-04-16T07:00:00.000Z",
      temperatureC: 30.2,
      ph: 7.1
    });
    const updated = await repository.update(created.id, {});
    const detail = await repository.getById(created.id);

    expect(created.pondId).toBe("pond-9");
    expect(created.temperatureC).toBe(30.2);
    expect(created.id).toContain("wq-pond-9");
    expect(updated.id).toBe(created.id);
    expect(detail.id).toBe(created.id);
    expect(recordedQueries[0]?.statement).toContain("insert into water_quality");
    expect(recordedQueries[0]?.params).toEqual([
      created.id,
      "pond-9",
      "2026-04-16T07:00:00.000Z",
      30.2,
      7.1,
      "2026-04-16T07:00:00.000Z",
      "2026-04-16T07:00:00.000Z"
    ]);
    expect(recordedQueries[1]?.statement).toContain("update water_quality");
    expect(buildCreateWaterQualityQueryPlan({
      pondId: "pond-9",
      recordedAt: "2026-04-16T07:00:00.000Z",
      temperatureC: 30.2,
      ph: 7.1
    }).filters).toEqual({
      pondId: "pond-9",
      recordedAt: "2026-04-16T07:00:00.000Z"
    });
    expect(buildUpdateWaterQualityQueryPlan(created.id, {}).filters).toEqual({
      id: created.id
    });
  });
});
