import { describe, expect, it } from "vitest";
import { createRepositoriesFromConfig } from "../repositories";
import { createReadonlyQueries } from "../queries";

describe("Readonly HTTP vertical slice", () => {
  it("keeps ponds list/detail, alerts list, and tasks list stable through placeholder-http runtime", async () => {
    const repositories = createRepositoriesFromConfig({
      mode: "http",
      enablePlaceholderHttp: true
    });
    const queries = createReadonlyQueries({
      ponds: repositories.ponds,
      alerts: repositories.alerts,
      tasks: repositories.tasks,
      ai: repositories.ai,
      waterQuality: repositories.waterQuality
    });

    const [ponds, pondDetail, alerts, tasks] = await Promise.all([
      queries.getPondsPageData(),
      queries.getPondDetailPageData("pond-1"),
      queries.getAlertsPageData(),
      queries.getTasksPageData()
    ]);

    expect(ponds.items[0]?.id).toBe("pond-1");
    expect(pondDetail.pond.id).toBe("pond-1");
    expect(pondDetail.waterQuality.items[0]?.pondId).toBe("pond-1");
    expect(alerts.alerts.items[0]?.id).toBe("alert-1");
    expect(tasks.items[0]?.id).toBe("task-1");
  });

  it("preserves dashboard semantics when the readonly slice uses placeholder-http runtime", async () => {
    const repositories = createRepositoriesFromConfig({
      mode: "http",
      enablePlaceholderHttp: true
    });
    const queries = createReadonlyQueries({
      ponds: repositories.ponds,
      alerts: repositories.alerts,
      tasks: repositories.tasks,
      ai: repositories.ai,
      waterQuality: repositories.waterQuality
    });

    const dashboard = await queries.getDashboardPageData();

    expect(dashboard.ponds.items[0]?.id).toBe("pond-1");
    expect(dashboard.alerts.items[0]?.id).toBe("alert-1");
    expect(dashboard.tasks.items[0]?.id).toBe("task-1");
    expect(dashboard.answer.answer).toBe(dashboard.answer.directAnswer);
    expect(dashboard.answer.metadata.taskLabel).toBe("dashboard_assistant_query");
  });
});
