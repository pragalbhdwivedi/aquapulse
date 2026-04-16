import {
  createPlaceholderAlertActionHistoryRow,
  createPlaceholderAlertRow,
  createRecordingConnectionFactory,
  createTestDatabaseConfig,
  type AlertActionHistoryRow,
  type AlertRow,
  type RecordedDatabasePlan
} from "@aquapulse/database";
import { describe, expect, it } from "vitest";
import { PostgresAlertsRepository } from "../modules/alerts/adapters/postgres-alerts.repository";
import type { AlertsRepositoryPort } from "../modules/alerts/ports/alerts-repository.port";

describe("Postgres write adapter slices", () => {
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
});
