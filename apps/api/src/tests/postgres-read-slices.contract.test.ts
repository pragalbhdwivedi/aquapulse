import {
  createPlaceholderAlertActionHistoryRow,
  createPlaceholderAlertRow,
  createPlaceholderBatchRow,
  createPlaceholderFeedRow,
  createPlaceholderPondRow,
  createPlaceholderTaskRow,
  createPlaceholderWaterQualityRow,
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
  buildAlertsSummaryQueryPlan,
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
import {
  buildActivePondResponsibilityByUserAndPondQueryPlan,
  buildListActivePondResponsibilitiesByUserQueryPlan,
  PostgresPondResponsibilityRepository
} from "../modules/pond-responsibility/adapters/postgres-pond-responsibility.repository";
import type { PondResponsibilityRepositoryPort } from "../modules/pond-responsibility/ports/pond-responsibility-repository.port";
import { buildUpdateAlertQueryPlan } from "../modules/alerts/adapters/postgres-alerts.repository";
import {
  buildBatchByIdQueryPlan,
  buildBatchesListQueryPlan,
  PostgresBatchesRepository
} from "../modules/batches/adapters/postgres-batches.repository";
import type { BatchesRepositoryPort } from "../modules/batches/ports/batches-repository.port";
import {
  buildFeedByIdQueryPlan,
  buildFeedListQueryPlan,
  PostgresFeedRepository
} from "../modules/feed/adapters/postgres-feed.repository";
import type { FeedRepositoryPort } from "../modules/feed/ports/feed-repository.port";
import {
  buildTaskByIdQueryPlan,
  buildTasksListQueryPlan,
  PostgresTasksRepository
} from "../modules/tasks/adapters/postgres-tasks.repository";
import type { TasksRepositoryPort } from "../modules/tasks/ports/tasks-repository.port";
import {
  buildWaterQualityByIdQueryPlan,
  buildWaterQualityListByPondQueryPlan,
  buildWaterQualityListQueryPlan,
  PostgresWaterQualityRepository
} from "../modules/water-quality/adapters/postgres-water-quality.repository";
import type { WaterQualityRepositoryPort } from "../modules/water-quality/ports/water-quality-repository.port";

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
    expect(list.page.totalItems).toBe(1);
    expect(recordedQueries).toHaveLength(2);
    expect(recordedQueries[0]).toEqual({
      statement: expect.stringContaining("from ponds"),
      params: ["pond-42"]
    });
    expect(recordedQueries[1]).toEqual({
      statement: expect.stringContaining("count(*) over()::int as total_count"),
      params: ["farm-42", "active", "pond", "%north%", "%north%", 10, 10]
    });
    expect(recordedQueries[1]?.statement).toContain("order by name asc, id asc");
    expect(buildPondByIdQueryPlan("pond-42").filters).toEqual({ id: "pond-42" });
    expect(buildPondsListQueryPlan({ page: 1, pageSize: 20, status: "active" }).filters).toEqual({
      readablePondIds: undefined,
      farmId: undefined,
      status: "active",
      kind: undefined,
      search: undefined
    });
  });

  it("pond responsibility adapter resolves active mappings without changing current resource reads", async () => {
    const recordedQueries: RecordedDatabasePlan[] = [];
    const repository: PondResponsibilityRepositoryPort = PostgresPondResponsibilityRepository.forTesting({
      connectionFactory: createRecordingConnectionFactory(recordedQueries, {
        rows: [
          {
            id: "responsibility-42",
            user_id: "user-42",
            pond_id: "pond-42",
            responsibility_type: "operator",
            active: true,
            starts_at: "2026-05-10T00:00:00.000Z",
            ends_at: undefined,
            created_at: "2026-05-10T00:00:00.000Z",
            updated_at: "2026-05-10T00:00:00.000Z"
          }
        ]
      }),
      databaseConfig: createTestDatabaseConfig()
    });

    const responsibilities = await repository.listActiveByUserId("user-42", "2026-05-10T12:00:00.000Z");
    const hasResponsibility = await repository.hasActiveResponsibility(
      "user-42",
      "pond-42",
      "2026-05-10T12:00:00.000Z"
    );

    expect(responsibilities[0]?.pondId).toBe("pond-42");
    expect(responsibilities[0]?.responsibilityType).toBe("operator");
    expect(hasResponsibility).toBe(true);
    expect(recordedQueries).toHaveLength(2);
    expect(recordedQueries[0]).toEqual({
      statement: expect.stringContaining("from pond_responsibilities"),
      params: ["user-42", "2026-05-10T12:00:00.000Z"]
    });
    expect(recordedQueries[1]).toEqual({
      statement: expect.stringContaining("where user_id = $1"),
      params: ["user-42", "pond-42", "2026-05-10T12:00:00.000Z"]
    });
    expect(buildListActivePondResponsibilitiesByUserQueryPlan("user-42", "2026-05-10T12:00:00.000Z").filters)
      .toEqual({
        userId: "user-42",
        active: true,
        effectiveAt: "2026-05-10T12:00:00.000Z"
      });
    expect(
      buildActivePondResponsibilityByUserAndPondQueryPlan(
        "user-42",
        "pond-42",
        "2026-05-10T12:00:00.000Z"
      ).filters
    ).toEqual({
      userId: "user-42",
      pondId: "pond-42",
      active: true,
      effectiveAt: "2026-05-10T12:00:00.000Z"
    });
  });

  it("batches adapter keeps pond-filtered list semantics aligned with responsibility-ready query inputs", async () => {
    const recordedQueries: RecordedDatabasePlan[] = [];
    const repository: BatchesRepositoryPort = PostgresBatchesRepository.forTesting({
      connectionFactory: createRecordingConnectionFactory(recordedQueries, {
        rows: [
          {
            ...createPlaceholderBatchRow({
              id: "batch-42",
              pond_id: "pond-42",
              lifecycle_stage: "growing"
            }),
            total_count: 1
          }
        ]
      }),
      databaseConfig: createTestDatabaseConfig()
    });

    const item = await repository.getById("batch-42");
    const list = await repository.list({
      page: 2,
      pageSize: 10,
      pondId: "pond-42",
      lifecycleStage: "growing",
      readablePondIds: ["pond-42"],
      search: "tilapia"
    });

    expect(item.id).toBe("batch-42");
    expect(item.pondId).toBe("pond-42");
    expect(list.items[0]?.id).toBe("batch-42");
    expect(list.page.totalItems).toBe(1);
    expect(recordedQueries).toHaveLength(2);
    expect(recordedQueries[0]).toEqual({
      statement: "batches.getById",
      params: ["batch-42"]
    });
    expect(recordedQueries[1]).toEqual({
      statement: "batches.list",
      params: [2, 10, null, ["pond-42"], "pond-42", "growing", "tilapia"]
    });
    expect(buildBatchByIdQueryPlan("batch-42").filters).toEqual({ id: "batch-42" });
    expect(
      buildBatchesListQueryPlan({
        page: 1,
        pageSize: 20,
        readablePondIds: ["pond-42"],
        lifecycleStage: "growing"
      }).filters
    ).toEqual({
      batchId: undefined,
      readablePondIds: ["pond-42"],
      pondId: undefined,
      lifecycleStage: "growing",
      search: undefined
    });
  });

  it("alerts adapter keeps the repository contract and translates query inputs consistently", async () => {
    const recordedQueries: RecordedDatabasePlan[] = [];
    const repository: AlertsRepositoryPort = PostgresAlertsRepository.forTesting({
      connectionFactory: createRecordingConnectionFactory(recordedQueries, {
        resolveRows(statement) {
          if (statement.includes("from alert_action_history")) {
            return [
              createPlaceholderAlertActionHistoryRow({
                id: "history-42",
                alert_id: "alert-42",
                action: "acknowledged"
              })
            ] as never[];
          }

          if (statement.includes("count(*) over()::int as total_count")) {
            return [
              {
                ...createPlaceholderAlertRow({
                  id: "alert-42",
                  pond_id: "pond-42",
                  status: "open",
                  latest_note: "Operator note"
                }),
                total_count: 1
              }
            ] as never[];
          }

          if (statement.includes("json_agg")) {
            return [
              {
                total_alerts: 1,
                open_count: 1,
                acknowledged_count: 0,
                resolved_count: 0,
                assigned_count: 0,
                unassigned_count: 1,
                unreviewed_count: 1,
                under_review_count: 0,
                reviewed_count: 0,
                deferred_count: 0,
                with_latest_note_count: 1,
                without_latest_note_count: 0,
                low_count: 0,
                medium_count: 0,
                high_count: 1,
                critical_count: 0,
                owner_workloads: []
              }
            ] as never[];
          }

          return [createPlaceholderAlertRow({ id: "alert-42", pond_id: "pond-42", status: "open" })] as never[];
        }
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
    const summary = await repository.summary({
      page: 1,
      pageSize: 15,
      pondId: "pond-42",
      status: "open",
      search: "oxygen"
    });
    const open = await repository.listOpen();

    expect(item.id).toBe("alert-42");
    expect(item.actionHistory?.[0]?.action).toBe("acknowledged");
    expect(list.items[0]?.pondId).toBe("pond-42");
    expect(list.page.totalItems).toBe(1);
    expect(summary.statusCounts.open).toBe(1);
    expect(summary.noteCounts.withLatestNote).toBe(1);
    expect(open.items[0]?.status).toBe("open");
    expect(recordedQueries).toHaveLength(5);
    expect(recordedQueries[0]?.statement).toContain("from alerts");
    expect(recordedQueries[0]?.statement).toContain("where id = $1");
    expect(recordedQueries[0]?.params).toEqual(["alert-42"]);
    expect(recordedQueries[1]?.statement).toContain("from alert_action_history");
    expect(recordedQueries[1]?.params).toEqual(["alert-42"]);
    expect(recordedQueries[2]?.statement).toContain("count(*) over()::int as total_count");
    expect(recordedQueries[2]?.statement).toContain("order by updated_at desc, id desc");
    expect(recordedQueries[2]?.statement).toContain("lower(coalesce(latest_note, '')) like");
    expect(recordedQueries[2]?.params).toEqual([
      "pond-42",
      "high",
      "open",
      "water-quality",
      "%oxygen%",
      15,
      0
    ]);
    expect(recordedQueries[3]?.statement).toContain("json_agg");
    expect(recordedQueries[3]?.params).toEqual(["pond-42", "open", "%oxygen%"]);
    expect(recordedQueries[4]?.statement).toContain("where status = 'open'");
    expect(buildAlertByIdQueryPlan("alert-42").filters).toEqual({ id: "alert-42" });
    expect(buildAlertsListQueryPlan({ page: 1, pageSize: 20, severity: "high", hasLatestNote: true }).filters).toEqual({
      pondId: undefined,
      severity: "high",
      status: undefined,
      source: undefined,
      assignedTo: undefined,
      reviewState: undefined,
      hasLatestNote: true,
      search: undefined
    });
    expect(buildAlertsSummaryQueryPlan({ page: 1, pageSize: 20, assignedTo: "operator-1" }).filters).toEqual({
      pondId: undefined,
      severity: undefined,
      status: undefined,
      source: undefined,
      assignedTo: "operator-1",
      reviewState: undefined,
      hasLatestNote: undefined,
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
        statement: expect.stringContaining("insert into ponds"),
        params: [
          "pond-write-1",
          "North Pond 1",
          "NP-01",
          "farm-1",
          "pond",
          "active",
          "2026-04-13T00:00:00.000Z",
          "2026-04-13T00:00:00.000Z"
        ]
      },
      {
        statement: expect.stringContaining("update ponds"),
        params: [
          "pond-write-2",
          null,
          null,
          null,
          null,
          null,
          "2026-04-13T00:00:00.000Z"
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
            latest_note: "Placeholder alert note.",
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
            latest_note: undefined,
            updated_at: "2026-04-13T00:00:00.000Z"
          }
        ]
      }
    ]);

    expect(buildCreatePondQueryPlan({ id: "pond-write-1", name: "North Pond 1", code: "NP-01", farm_id: "farm-1", kind: "pond", status: "active", created_at: "2026-04-13T00:00:00.000Z", updated_at: "2026-04-13T00:00:00.000Z" }).key).toBe("ponds.create");
    expect(buildUpdatePondQueryPlan("pond-write-2", { id: "pond-write-2", updated_at: "2026-04-13T00:00:00.000Z" }).params).toEqual([
      "pond-write-2",
      null,
      null,
      null,
      null,
      null,
      "2026-04-13T00:00:00.000Z"
    ]);
    expect(buildCreateAlertQueryPlan({ id: "alert-write-1", title: "Low dissolved oxygen warning", severity: "high", source: "water-quality", pond_id: "pond-1", status: "open", assigned_to: undefined, review_state: "unreviewed", review_label: undefined, latest_note: "Placeholder alert note.", created_at: "2026-04-13T00:00:00.000Z", updated_at: "2026-04-13T00:00:00.000Z" }).key).toBe("alerts.create");
    expect(buildUpdateAlertQueryPlan("alert-write-2", { id: "alert-write-2", title: undefined, severity: undefined, source: undefined, pond_id: undefined, status: undefined, assigned_to: undefined, review_state: undefined, review_label: undefined, latest_note: undefined, updated_at: "2026-04-13T00:00:00.000Z" }).params).toEqual([
      "alert-write-2",
      { id: "alert-write-2", title: undefined, severity: undefined, source: undefined, pond_id: undefined, status: undefined, assigned_to: undefined, review_state: undefined, review_label: undefined, latest_note: undefined, updated_at: "2026-04-13T00:00:00.000Z" }
    ]);
  });

  it("water-quality adapter keeps the repository contract and translates read inputs consistently", async () => {
    const recordedQueries: RecordedDatabasePlan[] = [];
    const repository: WaterQualityRepositoryPort = PostgresWaterQualityRepository.forTesting({
      connectionFactory: createRecordingConnectionFactory(recordedQueries, {
        resolveRows(statement) {
          if (statement.includes("count(*) over()::int as total_count")) {
            return [
              {
                ...createPlaceholderWaterQualityRow({
                  id: "wq-42",
                  pond_id: "pond-42",
                  recorded_at: "2026-04-15T06:00:00.000Z",
                  temperature_c: 29.4
                }),
                total_count: 1
              }
            ] as never[];
          }

          return [
            createPlaceholderWaterQualityRow({
              id: "wq-42",
              pond_id: "pond-42",
              recorded_at: "2026-04-15T06:00:00.000Z",
              temperature_c: 29.4
            })
          ] as never[];
        }
      }),
      databaseConfig: createTestDatabaseConfig()
    });

    const item = await repository.getById("wq-42");
    const list = await repository.list({
      page: 1,
      pageSize: 10,
      pondId: "pond-42",
      readablePondIds: ["pond-42"],
      metric: "temperatureC"
    });
    const byPond = await repository.listByPond("pond-42");

    expect(item.id).toBe("wq-42");
    expect(item.pondId).toBe("pond-42");
    expect(list.items[0]?.temperatureC).toBe(29.4);
    expect(list.page.totalItems).toBe(1);
    expect(byPond.items[0]?.pondId).toBe("pond-42");
    expect(recordedQueries[0]?.statement).toContain("from water_quality");
    expect(recordedQueries[0]?.statement).toContain("where id = $1");
    expect(recordedQueries[1]?.statement).toContain("count(*) over()::int as total_count");
    expect(recordedQueries[1]?.statement).toContain("temperature_c is not null");
    expect(recordedQueries[1]?.statement).toContain("pond_id = any($2)");
    expect(recordedQueries[1]?.params).toEqual(["pond-42", ["pond-42"], 10, 0]);
    expect(recordedQueries[2]?.statement).toContain("where pond_id = $1");
    expect(recordedQueries[2]?.params).toEqual(["pond-42", 20, 0]);
    expect(buildWaterQualityByIdQueryPlan("wq-42").filters).toEqual({ id: "wq-42" });
    expect(
      buildWaterQualityListQueryPlan({
        page: 1,
        pageSize: 20,
        pondId: "pond-42",
        readablePondIds: ["pond-42"],
        metric: "ph"
      })
        .filters
    ).toEqual({
      readablePondIds: ["pond-42"],
      pondId: "pond-42",
      metric: "ph"
    });
    expect(buildWaterQualityListByPondQueryPlan("pond-42").filters).toEqual({ pondId: "pond-42" });
  });

  it("feed adapter keeps the repository contract and translates read inputs consistently", async () => {
    const recordedQueries: RecordedDatabasePlan[] = [];
    const repository: FeedRepositoryPort = PostgresFeedRepository.forTesting({
      connectionFactory: createRecordingConnectionFactory(recordedQueries, {
        resolveRows(statement) {
          if (statement.includes("count(*) over()::int as total_count")) {
            return [
              {
                ...createPlaceholderFeedRow({
                  id: "feed-42",
                  pond_id: "pond-42",
                  batch_id: "batch-42",
                  feed_type: "Grower Feed",
                  quantity_kg: 42,
                  fed_at: "2026-04-15T06:00:00.000Z"
                }),
                total_count: 1
              }
            ] as never[];
          }

          return [
            createPlaceholderFeedRow({
              id: "feed-42",
              pond_id: "pond-42",
              batch_id: "batch-42",
              feed_type: "Grower Feed",
              quantity_kg: 42,
              fed_at: "2026-04-15T06:00:00.000Z"
            })
          ] as never[];
        }
      }),
      databaseConfig: createTestDatabaseConfig()
    });

    const item = await repository.getById("feed-42");
    const list = await repository.list({
      page: 1,
      pageSize: 10,
      pondId: "pond-42",
      readablePondIds: ["pond-42"],
      batchId: "batch-42",
      feedType: "Grower Feed",
      search: "grower"
    });

    expect(item.id).toBe("feed-42");
    expect(item.pondId).toBe("pond-42");
    expect(item.batchId).toBe("batch-42");
    expect(list.items[0]?.feedType).toBe("Grower Feed");
    expect(list.page.totalItems).toBe(1);
    expect(recordedQueries[0]?.statement).toContain("from feed_entries");
    expect(recordedQueries[0]?.statement).toContain("where id = $1");
    expect(recordedQueries[1]?.statement).toContain("count(*) over()::int as total_count");
    expect(recordedQueries[1]?.statement).toContain("pond_id = any($2)");
    expect(recordedQueries[1]?.statement).toContain("lower(feed_type) like");
    expect(recordedQueries[1]?.statement).toContain("order by fed_at desc, id desc");
    expect(recordedQueries[1]?.params).toEqual([
      "pond-42",
      ["pond-42"],
      "batch-42",
      "Grower Feed",
      "%grower%",
      10,
      0
    ]);
    expect(buildFeedByIdQueryPlan("feed-42").filters).toEqual({ id: "feed-42" });
    expect(
      buildFeedListQueryPlan({
        page: 1,
        pageSize: 20,
        pondId: "pond-42",
        readablePondIds: ["pond-42"],
        batchId: "batch-42",
        feedType: "Grower Feed",
        search: "grower"
      }).filters
    ).toEqual({
      readablePondIds: ["pond-42"],
      pondId: "pond-42",
      batchId: "batch-42",
      feedType: "Grower Feed",
      search: "grower"
    });
  });

  it("tasks adapter keeps the repository contract and translates read inputs consistently", async () => {
    const recordedQueries: RecordedDatabasePlan[] = [];
    const repository: TasksRepositoryPort = PostgresTasksRepository.forTesting({
      connectionFactory: createRecordingConnectionFactory(recordedQueries, {
        resolveRows(statement) {
          if (statement.includes("count(*) over()::int as total_count")) {
            return [
              {
                ...createPlaceholderTaskRow({
                  id: "task-42",
                  pond_id: "pond-42",
                  assignee_id: "user-42",
                  title: "Inspect intake grating",
                  status: "in_progress"
                }),
                total_count: 1
              }
            ] as never[];
          }

          return [
            createPlaceholderTaskRow({
              id: "task-42",
              pond_id: "pond-42",
              assignee_id: "user-42",
              title: "Inspect intake grating",
              status: "in_progress"
            })
          ] as never[];
        }
      }),
      databaseConfig: createTestDatabaseConfig()
    });

    const item = await repository.getById("task-42");
    const list = await repository.list({
      page: 2,
      pageSize: 10,
      assigneeId: "user-42",
      pondId: "pond-42",
      status: "in_progress",
      search: "intake"
    });

    expect(item.id).toBe("task-42");
    expect(item.assigneeId).toBe("user-42");
    expect(item.status).toBe("in_progress");
    expect(list.items[0]?.pondId).toBe("pond-42");
    expect(list.page.totalItems).toBe(1);
    expect(recordedQueries[0]?.statement).toContain("from tasks");
    expect(recordedQueries[0]?.statement).toContain("where id = $1");
    expect(recordedQueries[0]?.params).toEqual(["task-42"]);
    expect(recordedQueries[1]?.statement).toContain("count(*) over()::int as total_count");
    expect(recordedQueries[1]?.statement).toContain("lower(title) like");
    expect(recordedQueries[1]?.statement).toContain("order by updated_at desc, id desc");
    expect(recordedQueries[1]?.params).toEqual([
      "user-42",
      "pond-42",
      "in_progress",
      "%intake%",
      10,
      10
    ]);
    expect(buildTaskByIdQueryPlan("task-42").filters).toEqual({ id: "task-42" });
    expect(
      buildTasksListQueryPlan({
        page: 1,
        pageSize: 20,
        assigneeId: "user-42",
        pondId: "pond-42",
        status: "in_progress",
        search: "intake"
      }).filters
    ).toEqual({
      assigneeId: "user-42",
      pondId: "pond-42",
      status: "in_progress",
      search: "intake"
    });
  });
});
