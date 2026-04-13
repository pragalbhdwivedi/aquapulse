import { describe, expect, expectTypeOf, it } from "vitest";
import type { AiRepositoryPort } from "../modules/ai/ports/ai-repository.port";
import { AI_ACTIVE_REPOSITORY, AI_ADAPTERS, AI_PERSISTENCE_PROVIDER } from "../modules/ai/ai.module";
import { PostgresAiRepository } from "../modules/ai/adapters/postgres-ai.repository";
import type { AlertsRepositoryPort } from "../modules/alerts/ports/alerts-repository.port";
import { ALERTS_ACTIVE_REPOSITORY, ALERTS_ADAPTERS, ALERTS_PERSISTENCE_PROVIDER } from "../modules/alerts/alerts.module";
import { PostgresAlertsRepository } from "../modules/alerts/adapters/postgres-alerts.repository";
import type { PondsRepositoryPort } from "../modules/ponds/ports/ponds-repository.port";
import { PONDS_ACTIVE_REPOSITORY, PONDS_ADAPTERS, PONDS_PERSISTENCE_PROVIDER } from "../modules/ponds/ponds.module";
import { PostgresPondsRepository } from "../modules/ponds/adapters/postgres-ponds.repository";
import type { TasksRepositoryPort } from "../modules/tasks/ports/tasks-repository.port";
import { TASKS_ACTIVE_REPOSITORY, TASKS_ADAPTERS, TASKS_PERSISTENCE_PROVIDER } from "../modules/tasks/tasks.module";
import { PostgresTasksRepository } from "../modules/tasks/adapters/postgres-tasks.repository";
import type { AiResponseLogQueryContract } from "../modules/ai/query-contracts/ai-query.contract";
import type { AlertsListQueryContract } from "../modules/alerts/query-contracts/alerts-query.contract";
import type { PondListQueryContract } from "../modules/ponds/query-contracts/ponds-query.contract";
import type { TasksListQueryContract } from "../modules/tasks/query-contracts/tasks-query.contract";

describe("Persistence adapter skeletons", () => {
  it("postgres adapter skeletons satisfy the repository ports", async () => {
    const pondsRepository: PondsRepositoryPort = new PostgresPondsRepository();
    const alertsRepository: AlertsRepositoryPort = new PostgresAlertsRepository();
    const tasksRepository: TasksRepositoryPort = new PostgresTasksRepository();
    const aiRepository: AiRepositoryPort = new PostgresAiRepository();

    const [ponds, alerts, tasks, ai] = await Promise.all([
      pondsRepository.list({ page: 1, pageSize: 20 }),
      alertsRepository.list({ page: 1, pageSize: 20 }),
      tasksRepository.list({ page: 1, pageSize: 20 }),
      aiRepository.list({ page: 1, pageSize: 20 })
    ]);

    expect(ponds.items[0]?.id).toBe("pond-1");
    expect(alerts.items[0]?.id).toBe("alert-1");
    expect(tasks.items[0]?.id).toBe("task-1");
    expect(ai.items[0]?.id).toBe("ai-response-1");
  });

  it("module provider composition keeps the in-memory adapter active by default", () => {
    expect(PONDS_ACTIVE_REPOSITORY.name).toBe("InMemoryPondsRepository");
    expect(ALERTS_ACTIVE_REPOSITORY.name).toBe("InMemoryAlertsRepository");
    expect(TASKS_ACTIVE_REPOSITORY.name).toBe("InMemoryTasksRepository");
    expect(AI_ACTIVE_REPOSITORY.name).toBe("InMemoryAiRepository");

    expect(PONDS_ADAPTERS).toContain(PostgresPondsRepository);
    expect(ALERTS_ADAPTERS).toContain(PostgresAlertsRepository);
    expect(TASKS_ADAPTERS).toContain(PostgresTasksRepository);
    expect(AI_ADAPTERS).toContain(PostgresAiRepository);

    expect(PONDS_PERSISTENCE_PROVIDER.useExisting).toBe(PONDS_ACTIVE_REPOSITORY);
    expect(ALERTS_PERSISTENCE_PROVIDER.useExisting).toBe(ALERTS_ACTIVE_REPOSITORY);
    expect(TASKS_PERSISTENCE_PROVIDER.useExisting).toBe(TASKS_ACTIVE_REPOSITORY);
    expect(AI_PERSISTENCE_PROVIDER.useExisting).toBe(AI_ACTIVE_REPOSITORY);
  });

  it("query contracts stay aligned with repository list boundaries", () => {
    expectTypeOf<PondListQueryContract>().toMatchTypeOf<Parameters<PondsRepositoryPort["list"]>[0]>();
    expectTypeOf<AlertsListQueryContract>().toMatchTypeOf<Parameters<AlertsRepositoryPort["list"]>[0]>();
    expectTypeOf<TasksListQueryContract>().toMatchTypeOf<Parameters<TasksRepositoryPort["list"]>[0]>();
    expectTypeOf<AiResponseLogQueryContract>().toMatchTypeOf<Parameters<AiRepositoryPort["list"]>[0]>();
  });
});
