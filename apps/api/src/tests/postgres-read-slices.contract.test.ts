import {
  createPlaceholderAlertRow,
  createPlaceholderPondRow,
  createRecordingConnectionFactory,
  createTestDatabaseConfig,
  type RecordedDatabasePlan
} from "@aquapulse/database";
import { describe, expect, it } from "vitest";
import {
  buildCreateAlertQueryPlan,
  PostgresAlertsRepository,
  buildAlertByIdQueryPlan,
  buildAlertsListQueryPlan,
  buildOpenAlertsQueryPlan
} from "../modules/alerts/adapters/postgres-alerts.repository";
import type { AlertsRepositoryPort } from "../modules/alerts/ports/alerts-repository.port";
import {
  buildCreatePondQueryPlan,
  PostgresPondsRepository,
  buildPondByIdQueryPlan,
  buildPondsListQueryPlan,
  buildUpdatePondQueryPlan
} from "../modules/ponds/adapters/postgres-ponds.repository";
import type { PondsRepositoryPort } from "../modules/ponds/ports/ponds-repository.port";
import { buildUpdateAlertQueryPlan } from "../modules/alerts/adapters/postgres-alerts.repository";

interface RecordedQuery {
  readonly statement: string;
  readonly params: readonly unknown[];
}

describe("Postgres read adapter slices", () => {
  it("ponds adapter keeps the repository contract while using shared row mapping", async () => {
    const recordedQueries: RecordedDatabasePlan[] = [];
    const repository: PondsRepositoryPort = PostgresPondsRepository.forTesting({
      connectionFactory: createRecordingConnectionFactory(recordedQueries, {
        rows: [createPlaceholderPondRow({ id: "pond-42", farm_id: "farm-42" })]
      }),
      databaseConfig: createTestDatabaseConfig()
    });

    const item = await repository.getById("pond-42");
    const list = await repository.list({
      page: 2,
      pageSize: 10,
      farmId: "farm-42",
      status: "active",
      kind: "pond",
      search: "north"
    });

    expect(item.id).toBe("pond-42");
    expect(item.farmId).toBe("farm-42");
    expect(list.items[0]?.id).toBe("pond-42");
    expect(recordedQueries).toEqual([
      { statement: "ponds.getById", params: ["pond-42"] },
      { statement: "ponds.list", params: [2, 10, "farm-42", "active", "pond", "north"] }
    ]);
    expect(buildPondByIdQueryPlan("pond-42").filters).toEqual({ id: "pond-42" });
    expect(buildPondsListQueryPlan({ page: 1, pageSize: 20, status: "active" }).filters).toEqual({
      farmId: undefined,
      status: "active",
      kind: undefined,
      search: undefined
    });
  });

  it("alerts adapter keeps the repository contract and translates query inputs consistently", async () => {
    const recordedQueries: RecordedDatabasePlan[] = [];
    const repository: AlertsRepositoryPort = PostgresAlertsRepository.forTesting({
      connectionFactory: createRecordingConnectionFactory(recordedQueries, {
        rows: [createPlaceholderAlertRow({ id: "alert-42", pond_id: "pond-42", status: "open" })]
      }),
      databaseConfig: createTestDatabaseConfig()
    });

    const item = await repository.getById("alert-42");
    const list = await repository.list({
      page: 1,
      pageSize: 15,
      pondId: "pond-42",
      severity: "high",
      status: "open",
      source: "water-quality",
      search: "oxygen"
    });
    const open = await repository.listOpen();

    expect(item.id).toBe("alert-42");
    expect(list.items[0]?.pondId).toBe("pond-42");
    expect(open.items[0]?.status).toBe("open");
    expect(recordedQueries).toEqual([
      { statement: "alerts.getById", params: ["alert-42"] },
      {
        statement: "alerts.list",
        params: [1, 15, "pond-42", "high", "open", "water-quality", null, null, "oxygen"]
      },
      { statement: "alerts.listOpen", params: [] }
    ]);
    expect(buildAlertByIdQueryPlan("alert-42").filters).toEqual({ id: "alert-42" });
    expect(buildAlertsListQueryPlan({ page: 1, pageSize: 20, severity: "high" }).filters).toEqual({
      pondId: undefined,
      severity: "high",
      status: undefined,
      source: undefined,
      assignedTo: undefined,
      reviewState: undefined,
      search: undefined
    });
    expect(buildOpenAlertsQueryPlan().filters).toEqual({ status: "open" });
  });

  it("pond and alert write slices remain no-op-safe while compiling stable mutation plans", async () => {
    const recordedQueries: RecordedDatabasePlan[] = [];
    const pondsRepository: PondsRepositoryPort = PostgresPondsRepository.forTesting({
      connectionFactory: createRecordingConnectionFactory(recordedQueries),
      databaseConfig: createTestDatabaseConfig()
    });
    const alertsRepository: AlertsRepositoryPort = PostgresAlertsRepository.forTesting({
      connectionFactory: createRecordingConnectionFactory(recordedQueries),
      databaseConfig: createTestDatabaseConfig()
    });

    const createdPond = await pondsRepository.create({ id: "pond-write-1" });
    const updatedPond = await pondsRepository.update("pond-write-2", {});
    const createdAlert = await alertsRepository.create({ id: "alert-write-1" });
    const updatedAlert = await alertsRepository.update("alert-write-2", {});

    expect(createdPond.id).toBe("pond-write-1");
    expect(updatedPond.id).toBe("pond-write-2");
    expect(createdAlert.id).toBe("alert-write-1");
    expect(updatedAlert.id).toBe("alert-write-2");
    expect(recordedQueries).toEqual([
      {
        statement: "ponds.create",
        params: [
          {
            id: "pond-write-1",
            name: "North Pond 1",
            code: "NP-01",
            farm_id: "farm-1",
            kind: "pond",
            status: "active",
            created_at: "2026-04-13T00:00:00.000Z",
            updated_at: "2026-04-13T00:00:00.000Z"
          }
        ]
      },
      {
        statement: "ponds.update",
        params: [
          "pond-write-2",
          {
            id: "pond-write-2",
            updated_at: "2026-04-13T00:00:00.000Z"
          }
        ]
      },
      {
        statement: "alerts.create",
        params: [
          {
            id: "alert-write-1",
            title: "Low dissolved oxygen warning",
            severity: "high",
            source: "water-quality",
            pond_id: "pond-1",
            status: "open",
            assigned_to: undefined,
            review_state: "unreviewed",
            review_label: undefined,
            created_at: "2026-04-13T00:00:00.000Z",
            updated_at: "2026-04-13T00:00:00.000Z"
          }
        ]
      },
      {
        statement: "alerts.update",
        params: [
          "alert-write-2",
          {
            id: "alert-write-2",
            title: undefined,
            severity: undefined,
            source: undefined,
            pond_id: undefined,
            status: undefined,
            assigned_to: undefined,
            review_state: undefined,
            review_label: undefined,
            updated_at: "2026-04-13T00:00:00.000Z"
          }
        ]
      }
    ]);

    expect(buildCreatePondQueryPlan({ id: "pond-write-1", name: "North Pond 1", code: "NP-01", farm_id: "farm-1", kind: "pond", status: "active", created_at: "2026-04-13T00:00:00.000Z", updated_at: "2026-04-13T00:00:00.000Z" }).key).toBe("ponds.create");
    expect(buildUpdatePondQueryPlan("pond-write-2", { id: "pond-write-2", updated_at: "2026-04-13T00:00:00.000Z" }).params).toEqual([
      "pond-write-2",
      { id: "pond-write-2", updated_at: "2026-04-13T00:00:00.000Z" }
    ]);
    expect(buildCreateAlertQueryPlan({ id: "alert-write-1", title: "Low dissolved oxygen warning", severity: "high", source: "water-quality", pond_id: "pond-1", status: "open", assigned_to: undefined, review_state: "unreviewed", review_label: undefined, created_at: "2026-04-13T00:00:00.000Z", updated_at: "2026-04-13T00:00:00.000Z" }).key).toBe("alerts.create");
    expect(buildUpdateAlertQueryPlan("alert-write-2", { id: "alert-write-2", title: undefined, severity: undefined, source: undefined, pond_id: undefined, status: undefined, assigned_to: undefined, review_state: undefined, review_label: undefined, updated_at: "2026-04-13T00:00:00.000Z" }).params).toEqual([
      "alert-write-2",
      { id: "alert-write-2", title: undefined, severity: undefined, source: undefined, pond_id: undefined, status: undefined, assigned_to: undefined, review_state: undefined, review_label: undefined, updated_at: "2026-04-13T00:00:00.000Z" }
    ]);
  });
});
