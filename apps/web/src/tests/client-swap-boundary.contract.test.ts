import { describe, expect, it } from "vitest";
import { createApiClients, createHttpPlaceholderClients, createMockApiClients } from "../clients";
import { createRepositories } from "../repositories";

describe("Client swap boundary", () => {
  it("keeps mock as the default client runtime source", async () => {
    const clients = createApiClients();
    const response = await clients.ponds.list({ page: 1, pageSize: 20 });

    expect(response.ok).toBe(true);
    expect(response.data.items[0]?.id).toBe("pond-1");
  });

  it("lets repositories swap from mock clients to placeholder http clients without changing their contract", async () => {
    const mockRepositories = createRepositories(createMockApiClients());
    const httpRepositories = createRepositories(createHttpPlaceholderClients());

    const [mockDashboard, httpDashboard, mockAlerts, httpAlerts] = await Promise.all([
      mockRepositories.ai.queryDashboard({ question: "What needs attention today?" }),
      httpRepositories.ai.queryDashboard({ question: "What needs attention today?" }),
      mockRepositories.alerts.list({ page: 1, pageSize: 20, status: "open" }),
      httpRepositories.alerts.list({ page: 1, pageSize: 20, status: "open" })
    ]);

    expect(mockDashboard.data.answer).toBe(mockDashboard.data.directAnswer);
    expect(httpDashboard.data.answer).toBe(httpDashboard.data.directAnswer);
    expect(mockDashboard.data.metadata.taskLabel).toBe("dashboard_assistant_query");
    expect(httpDashboard.data.metadata.taskLabel).toBe("dashboard_assistant_query");
    expect(mockAlerts.data.page.page).toBe(1);
    expect(httpAlerts.data.page.pageSize).toBe(20);
  });
});
