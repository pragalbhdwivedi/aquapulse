import {
  createPlaceholderAlertRow,
  createPlaceholderAlertSavedViewRow,
  createPlaceholderBatchRow,
  createPlaceholderFeedRow,
  createPlaceholderPondRow,
  createPlaceholderPondResponsibilityRow,
  createPlaceholderTaskRow,
  createRecordingConnectionFactory,
  createTestDatabaseConfig
} from "@aquapulse/database";
import { describe, expect, expectTypeOf, it } from "vitest";
import { resolvePersistenceAdapter } from "../common/persistence/persistence-adapter.types";
import type { AiRepositoryPort } from "../modules/ai/ports/ai-repository.port";
import { AI_ACTIVE_REPOSITORY, AI_ADAPTERS, AI_PERSISTENCE_PROVIDER } from "../modules/ai/ai.module";
import { PostgresAiRepository } from "../modules/ai/adapters/postgres-ai.repository";
import type { AlertsRepositoryPort } from "../modules/alerts/ports/alerts-repository.port";
import { ALERTS_ACTIVE_REPOSITORY, ALERTS_ADAPTERS, ALERTS_PERSISTENCE_PROVIDER } from "../modules/alerts/alerts.module";
import { PostgresAlertsRepository } from "../modules/alerts/adapters/postgres-alerts.repository";
import type { AttachmentsListQueryContract } from "../modules/attachments/query-contracts/attachments-query.contract";
import type { AttachmentsRepositoryPort } from "../modules/attachments/ports/attachments-repository.port";
import {
  ATTACHMENTS_ACTIVE_REPOSITORY,
  ATTACHMENTS_ADAPTERS,
  ATTACHMENTS_PERSISTENCE_PROVIDER
} from "../modules/attachments/attachments.module";
import { PostgresAttachmentsRepository } from "../modules/attachments/adapters/postgres-attachments.repository";
import type { BatchesRepositoryPort } from "../modules/batches/ports/batches-repository.port";
import { BATCHES_ACTIVE_REPOSITORY, BATCHES_ADAPTERS, BATCHES_PERSISTENCE_PROVIDER } from "../modules/batches/batches.module";
import { PostgresBatchesRepository } from "../modules/batches/adapters/postgres-batches.repository";
import type { BatchesListQueryContract } from "../modules/batches/query-contracts/batches-query.contract";
import type { FeedListQueryContract } from "../modules/feed/query-contracts/feed-query.contract";
import type { FeedRepositoryPort } from "../modules/feed/ports/feed-repository.port";
import { FEED_ACTIVE_REPOSITORY, FEED_ADAPTERS, FEED_PERSISTENCE_PROVIDER } from "../modules/feed/feed.module";
import { PostgresFeedRepository } from "../modules/feed/adapters/postgres-feed.repository";
import type { PondsRepositoryPort } from "../modules/ponds/ports/ponds-repository.port";
import { PONDS_ACTIVE_REPOSITORY, PONDS_ADAPTERS, PONDS_PERSISTENCE_PROVIDER } from "../modules/ponds/ponds.module";
import { PostgresPondsRepository } from "../modules/ponds/adapters/postgres-ponds.repository";
import {
  POND_RESPONSIBILITY_ACTIVE_REPOSITORY,
  POND_RESPONSIBILITY_ADAPTERS,
  POND_RESPONSIBILITY_PERSISTENCE_PROVIDER
} from "../modules/pond-responsibility/pond-responsibility.module";
import { PostgresPondResponsibilityRepository } from "../modules/pond-responsibility/adapters/postgres-pond-responsibility.repository";
import type { PondResponsibilityRepositoryPort } from "../modules/pond-responsibility/ports/pond-responsibility-repository.port";
import type { TasksRepositoryPort } from "../modules/tasks/ports/tasks-repository.port";
import { TASKS_ACTIVE_REPOSITORY, TASKS_ADAPTERS, TASKS_PERSISTENCE_PROVIDER } from "../modules/tasks/tasks.module";
import { PostgresTasksRepository } from "../modules/tasks/adapters/postgres-tasks.repository";
import type { WaterQualityRepositoryPort } from "../modules/water-quality/ports/water-quality-repository.port";
import {
  WATER_QUALITY_ACTIVE_REPOSITORY,
  WATER_QUALITY_ADAPTERS,
  WATER_QUALITY_PERSISTENCE_PROVIDER
} from "../modules/water-quality/water-quality.module";
import { PostgresWaterQualityRepository } from "../modules/water-quality/adapters/postgres-water-quality.repository";
import type { AiResponseLogQueryContract } from "../modules/ai/query-contracts/ai-query.contract";
import type { AlertsListQueryContract } from "../modules/alerts/query-contracts/alerts-query.contract";
import type { PondListQueryContract } from "../modules/ponds/query-contracts/ponds-query.contract";
import type { TasksListQueryContract } from "../modules/tasks/query-contracts/tasks-query.contract";
import type { WaterQualityListQueryContract } from "../modules/water-quality/query-contracts/water-quality-query.contract";

describe("Persistence adapter skeletons", () => {
  it("postgres adapter skeletons satisfy the repository ports", async () => {
    const pondsRepository: PondsRepositoryPort = PostgresPondsRepository.forTesting({
      connectionFactory: createRecordingConnectionFactory([], {
        rows: [createPlaceholderPondRow({ id: "pond-1" })]
      }),
      databaseConfig: createTestDatabaseConfig()
    });
    const alertsRepository: AlertsRepositoryPort = PostgresAlertsRepository.forTesting({
      connectionFactory: createRecordingConnectionFactory([], {
        resolveRows(statement) {
          if (statement.includes("from saved_alert_views")) {
            return [createPlaceholderAlertSavedViewRow({ id: "alert-view-1" })] as never[];
          }

          return [createPlaceholderAlertRow({ id: "alert-1" })] as never[];
        }
      }),
      databaseConfig: createTestDatabaseConfig()
    });
    const pondResponsibilityRepository: PondResponsibilityRepositoryPort =
      PostgresPondResponsibilityRepository.forTesting({
        connectionFactory: createRecordingConnectionFactory([], {
          rows: [createPlaceholderPondResponsibilityRow({ id: "pond-responsibility-1", user_id: "user-1" })]
        }),
        databaseConfig: createTestDatabaseConfig()
      });
    const attachmentsRepository: AttachmentsRepositoryPort = new PostgresAttachmentsRepository();
    const batchesRepository: BatchesRepositoryPort = PostgresBatchesRepository.forTesting({
      connectionFactory: createRecordingConnectionFactory([], {
        rows: [createPlaceholderBatchRow({ id: "batch-1" })]
      }),
      databaseConfig: createTestDatabaseConfig()
    });
    const feedRepository: FeedRepositoryPort = PostgresFeedRepository.forTesting({
      connectionFactory: createRecordingConnectionFactory([], {
        rows: [createPlaceholderFeedRow({ id: "feed-1" })]
      }),
      databaseConfig: createTestDatabaseConfig()
    });
    const tasksRepository: TasksRepositoryPort = PostgresTasksRepository.forTesting({
      connectionFactory: createRecordingConnectionFactory([], {
        rows: [createPlaceholderTaskRow({ id: "task-1" })]
      }),
      databaseConfig: createTestDatabaseConfig()
    });
    const waterQualityRepository: WaterQualityRepositoryPort = PostgresWaterQualityRepository.forTesting({
      connectionFactory: createRecordingConnectionFactory([], {
        rows: []
      }),
      databaseConfig: createTestDatabaseConfig()
    });
    const aiRepository: AiRepositoryPort = PostgresAiRepository.forTesting({
      connectionFactory: createRecordingConnectionFactory([], {
        resolveRows(statement) {
          if (statement.includes("from ai_requests")) {
            return [{
              id: "ai-request-1",
              request_type: "dashboard_assistant_query",
              requested_by: "user-1",
              input_payload: { question: "What needs attention today?" },
              status: "completed",
              created_at: "2026-05-09T06:20:00.000Z",
              updated_at: "2026-05-09T06:20:00.000Z",
              total_count: 1
            }] as never[];
          }

          if (statement.includes("from ai_responses")) {
            return [{
              id: "ai-response-1",
              request_id: "ai-request-1",
              status: "completed",
              output_text: "{\"headline\":\"Dashboard assistant\"}",
              model: "gpt-5-nano",
              created_at: "2026-05-09T06:20:05.000Z",
              updated_at: "2026-05-09T06:20:05.000Z",
              total_count: 1
            }] as never[];
          }

          return [];
        }
      }),
      databaseConfig: createTestDatabaseConfig()
    });

    const [ponds, alerts, alertSavedViews, pondResponsibilities, hasPondAccess, attachments, batches, feed, tasks, waterQuality, ai] = await Promise.all([
      pondsRepository.list({ page: 1, pageSize: 20 }),
      alertsRepository.list({ page: 1, pageSize: 20 }),
      alertsRepository.listSavedViews(),
      pondResponsibilityRepository.listActiveByUserId("user-1", "2026-05-10T00:00:00.000Z"),
      pondResponsibilityRepository.hasActiveResponsibility("user-1", "pond-1", "2026-05-10T00:00:00.000Z"),
      attachmentsRepository.list({ page: 1, pageSize: 20 }),
      batchesRepository.list({ page: 1, pageSize: 20 }),
      feedRepository.list({ page: 1, pageSize: 20 }),
      tasksRepository.list({ page: 1, pageSize: 20 }),
      waterQualityRepository.list({ page: 1, pageSize: 20 }),
      aiRepository.list({ page: 1, pageSize: 20 })
    ]);

    expect(ponds.items[0]?.id).toBe("pond-1");
    expect(Array.isArray(alerts.items)).toBe(true);
    expect(Array.isArray(alertSavedViews)).toBe(true);
    expect(pondResponsibilities[0]?.id).toBe("pond-responsibility-1");
    expect(hasPondAccess).toBe(true);
    expect(attachments.items[0]?.id).toBe("attachment-1");
    expect(batches.items[0]?.id).toBe("batch-1");
    expect(feed.items[0]?.id).toBe("feed-1");
    expect(tasks.items[0]?.id).toBe("task-1");
    expect(Array.isArray(waterQuality.items)).toBe(true);
    expect(ai.items[0]?.id).toBe("ai-response-1");
  });

  it("module provider composition keeps the in-memory adapter active by default", () => {
    expect(PONDS_ACTIVE_REPOSITORY.name).toBe("InMemoryPondsRepository");
    expect(POND_RESPONSIBILITY_ACTIVE_REPOSITORY.name).toBe("InMemoryPondResponsibilityRepository");
    expect(ALERTS_ACTIVE_REPOSITORY.name).toBe("InMemoryAlertsRepository");
    expect(ATTACHMENTS_ACTIVE_REPOSITORY.name).toBe("InMemoryAttachmentsRepository");
    expect(BATCHES_ACTIVE_REPOSITORY.name).toBe("InMemoryBatchesRepository");
    expect(FEED_ACTIVE_REPOSITORY.name).toBe("InMemoryFeedRepository");
    expect(TASKS_ACTIVE_REPOSITORY.name).toBe("InMemoryTasksRepository");
    expect(WATER_QUALITY_ACTIVE_REPOSITORY.name).toBe("InMemoryWaterQualityRepository");
    expect(AI_ACTIVE_REPOSITORY.name).toBe("InMemoryAiRepository");

    expect(PONDS_ADAPTERS).toContain(PostgresPondsRepository);
    expect(POND_RESPONSIBILITY_ADAPTERS).toContain(PostgresPondResponsibilityRepository);
    expect(ALERTS_ADAPTERS).toContain(PostgresAlertsRepository);
    expect(ATTACHMENTS_ADAPTERS).toContain(PostgresAttachmentsRepository);
    expect(BATCHES_ADAPTERS).toContain(PostgresBatchesRepository);
    expect(FEED_ADAPTERS).toContain(PostgresFeedRepository);
    expect(TASKS_ADAPTERS).toContain(PostgresTasksRepository);
    expect(WATER_QUALITY_ADAPTERS).toContain(PostgresWaterQualityRepository);
    expect(AI_ADAPTERS).toContain(PostgresAiRepository);

    expect(PONDS_PERSISTENCE_PROVIDER.useExisting).toBe(PONDS_ACTIVE_REPOSITORY);
    expect(POND_RESPONSIBILITY_PERSISTENCE_PROVIDER.useExisting).toBe(POND_RESPONSIBILITY_ACTIVE_REPOSITORY);
    expect(ALERTS_PERSISTENCE_PROVIDER.useExisting).toBe(ALERTS_ACTIVE_REPOSITORY);
    expect(ATTACHMENTS_PERSISTENCE_PROVIDER.useExisting).toBe(ATTACHMENTS_ACTIVE_REPOSITORY);
    expect(BATCHES_PERSISTENCE_PROVIDER.useExisting).toBe(BATCHES_ACTIVE_REPOSITORY);
    expect(FEED_PERSISTENCE_PROVIDER.useExisting).toBe(FEED_ACTIVE_REPOSITORY);
    expect(TASKS_PERSISTENCE_PROVIDER.useExisting).toBe(TASKS_ACTIVE_REPOSITORY);
    expect(WATER_QUALITY_PERSISTENCE_PROVIDER.useExisting).toBe(WATER_QUALITY_ACTIVE_REPOSITORY);
    expect(AI_PERSISTENCE_PROVIDER.useExisting).toBe(AI_ACTIVE_REPOSITORY);

    expect(
      resolvePersistenceAdapter(
        { inMemory: PONDS_ACTIVE_REPOSITORY, postgres: PostgresPondsRepository },
        { token: Symbol("ponds"), defaultAdapter: "in-memory" },
        "postgres"
      )
    ).toBe(PONDS_ACTIVE_REPOSITORY);
  });

  it("query contracts stay aligned with repository list boundaries", () => {
    expectTypeOf<PondListQueryContract>().toMatchTypeOf<Parameters<PondsRepositoryPort["list"]>[0]>();
    expectTypeOf<AlertsListQueryContract>().toMatchTypeOf<Parameters<AlertsRepositoryPort["list"]>[0]>();
    expectTypeOf<AttachmentsListQueryContract>().toMatchTypeOf<Parameters<AttachmentsRepositoryPort["list"]>[0]>();
    expectTypeOf<BatchesListQueryContract>().toMatchTypeOf<Parameters<BatchesRepositoryPort["list"]>[0]>();
    expectTypeOf<FeedListQueryContract>().toMatchTypeOf<Parameters<FeedRepositoryPort["list"]>[0]>();
    expectTypeOf<TasksListQueryContract>().toMatchTypeOf<Parameters<TasksRepositoryPort["list"]>[0]>();
    expectTypeOf<WaterQualityListQueryContract>().toMatchTypeOf<
      Parameters<WaterQualityRepositoryPort["list"]>[0]
    >();
    expectTypeOf<AiResponseLogQueryContract>().toMatchTypeOf<Parameters<AiRepositoryPort["list"]>[0]>();
  });
});
