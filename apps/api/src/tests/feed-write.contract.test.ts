import {
  createPlaceholderFeedRow,
  createRecordingConnectionFactory,
  createTestDatabaseConfig,
  type FeedRow,
  type RecordedDatabasePlan
} from "@aquapulse/database";
import { describe, expect, it } from "vitest";
import { AlertsApplicationService } from "../modules/alerts/application/alerts.application-service";
import { InMemoryAlertsRepository } from "../modules/alerts/repositories/in-memory-alerts.repository";
import { PostgresFeedRepository } from "../modules/feed/adapters/postgres-feed.repository";
import { FeedApplicationService } from "../modules/feed/application/feed.application-service";
import { FeedController } from "../modules/feed/feed.controller";
import { InMemoryFeedRepository } from "../modules/feed/repositories/in-memory-feed.repository";

describe("Feed write vertical slice", () => {
  it("creates a feed entry through the in-memory repository path", async () => {
    const repository = new InMemoryFeedRepository();
    const alerts = new AlertsApplicationService(new InMemoryAlertsRepository());
    const service = new FeedApplicationService(repository, alerts);

    const created = await service.create({
      pondId: "pond-1",
      batchId: "batch-1",
      feedType: "Grower Feed",
      quantityKg: 24,
      fedAt: "2026-04-14T06:00:00.000Z"
    });
    const list = await repository.list({ page: 1, pageSize: 20, pondId: "pond-1" });

    expect(created.data.id).toContain("feed-");
    expect(created.data.feedType).toBe("Grower Feed");
    expect(list.items[0]?.id).toBe(created.data.id);
  });

  it("keeps controller -> mapper -> service -> envelope delegation stable for create", async () => {
    const repository = new InMemoryFeedRepository();
    const alerts = new AlertsApplicationService(new InMemoryAlertsRepository());
    const applicationService = new FeedApplicationService(repository, alerts);
    const controller = new FeedController(
      { getPlaceholder: async () => ({ ok: true }) } as never,
      applicationService
    );

    const response = await controller.create({
      pondId: "pond-1",
      batchId: "batch-1",
      feedType: "Starter Feed",
      quantityKg: 20,
      fedAt: "2026-04-14T05:30:00.000Z"
    });

    expect(response.ok).toBe(true);
    expect(response.data.id).toContain("feed-");
    expect(response.data.feedType).toBe("Starter Feed");
    expect(response.data.quantityKg).toBe(20);
  });

  it("supports a simple deterministic feed anomaly alert path", async () => {
    const repository = new InMemoryFeedRepository();
    const alertsRepository = new InMemoryAlertsRepository();
    const alerts = new AlertsApplicationService(alertsRepository);
    const service = new FeedApplicationService(repository, alerts);

    await service.create({
      pondId: "pond-1",
      batchId: "batch-1",
      feedType: "Emergency Feed",
      quantityKg: 95,
      fedAt: "2026-04-15T06:00:00.000Z"
    });

    const openAlerts = await alertsRepository.listOpen();
    const anomaly = openAlerts.items.find((item) => item.title === "Feed quantity anomaly detected");

    expect(anomaly?.severity).toBe("medium");
    expect(anomaly?.source).toBe("feed");
  });

  it("keeps feed create anomaly compatibility when the Postgres repository path is selected", async () => {
    const recordedQueries: RecordedDatabasePlan[] = [];
    const entries = new Map<string, FeedRow>();
    const repository = PostgresFeedRepository.forTesting({
      connectionFactory: createRecordingConnectionFactory(recordedQueries, {
        resolveRows(statement, params) {
          if (statement.startsWith("insert into feed_entries")) {
            const row: FeedRow = {
              id: params[0] as string,
              pond_id: params[1] as string,
              batch_id: (params[2] as string | null) ?? undefined,
              feed_type: params[3] as string,
              quantity_kg: params[4] as number,
              fed_at: params[5] as string,
              created_at: params[6] as string,
              updated_at: params[7] as string
            };
            entries.set(row.id, row);
            return [row] as never[];
          }

          if (statement.includes("from feed_entries") && statement.includes("where id = $1")) {
            const row =
              entries.get(params[0] as string) ??
              createPlaceholderFeedRow({ id: params[0] as string });
            return [row] as never[];
          }

          return [] as never[];
        }
      }),
      databaseConfig: createTestDatabaseConfig()
    });
    const alertsRepository = new InMemoryAlertsRepository();
    const alerts = new AlertsApplicationService(alertsRepository);
    const service = new FeedApplicationService(repository, alerts);

    const created = await service.create({
      pondId: "pond-11",
      batchId: "batch-11",
      feedType: "Emergency Feed",
      quantityKg: 95,
      fedAt: "2026-04-16T08:00:00.000Z"
    });
    const openAlerts = await alertsRepository.listOpen();
    const anomaly = openAlerts.items.find((item) => item.title === "Feed quantity anomaly detected");

    expect(created.data.pondId).toBe("pond-11");
    expect(recordedQueries[0]?.statement).toContain("insert into feed_entries");
    expect(anomaly?.severity).toBe("medium");
    expect(anomaly?.source).toBe("feed");
    expect(anomaly?.pondId).toBe("pond-11");
  });
});
