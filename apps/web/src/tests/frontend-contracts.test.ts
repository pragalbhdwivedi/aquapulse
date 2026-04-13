import { describe, expect, expectTypeOf, it } from "vitest";
import type {
  AiAlertsExplainResponse,
  AiDashboardQueryResponse,
  ApiSuccessEnvelope,
  ListResponse,
  PondSummary
} from "@aquapulse/types";
import { createMockApiClients, type AquaPulseApiClients } from "../clients";
import {
  createRepositories,
  type AquaPulseRepositories,
  type AlertsRepository,
  type PondsRepository
} from "../repositories";

describe("Frontend contract boundaries", () => {
  it("mock clients satisfy the frontend client contracts", async () => {
    const clients: AquaPulseApiClients = createMockApiClients();
    const response = await clients.ponds.list();

    expect(response.ok).toBe(true);
    expect(response.data.items[0]?.id).toBe("pond-1");
  });

  it("repositories stay aligned with the shared API envelopes", async () => {
    const repositories: AquaPulseRepositories = createRepositories(createMockApiClients());
    const ponds = await repositories.ponds.list();
    const explanation = await repositories.alerts.explain({ alertId: "alert-1" });

    expect(ponds.data.items).toHaveLength(1);
    expect(explanation.data.explanation).toContain("Placeholder");

    expectTypeOf(repositories.ponds).toMatchTypeOf<PondsRepository>();
    expectTypeOf(repositories.alerts).toMatchTypeOf<AlertsRepository>();
    expectTypeOf<typeof ponds>().toEqualTypeOf<ApiSuccessEnvelope<ListResponse<PondSummary>>>();
    expectTypeOf<typeof explanation>().toEqualTypeOf<ApiSuccessEnvelope<AiAlertsExplainResponse>>();
  });

  it("AI repository methods keep the dashboard contract stable", async () => {
    const repositories = createRepositories(createMockApiClients());
    const result = await repositories.ai.queryDashboard({ question: "What needs attention today?" });

    expect(result.data.answer).toContain("Placeholder");
    expectTypeOf<typeof result>().toEqualTypeOf<ApiSuccessEnvelope<AiDashboardQueryResponse>>();
  });
});
