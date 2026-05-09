import { NotFoundException } from "@nestjs/common";
import { describe, expect, it } from "vitest";
import { AiApplicationService } from "../modules/ai/application/ai.application-service";
import { InMemoryAiRepository } from "../modules/ai/repositories/in-memory-ai.repository";

describe("AI history read-scope", () => {
  it("scopes AI history list reads to the requesting keycloak operator", async () => {
    const service = new AiApplicationService(new InMemoryAiRepository());

    const history = await service.list(
      { page: 1, pageSize: 20 },
      { id: "user-1", provider: "keycloak" }
    );

    expect(history.data.items.length).toBeGreaterThan(0);
    expect(history.data.items.every((item) => item.requestId !== "ai-request-7")).toBe(true);
    expect(history.data.items.some((item) => item.requestId === "ai-request-1")).toBe(true);
  });

  it("hides AI history detail records that belong to a different keycloak operator", async () => {
    const service = new AiApplicationService(new InMemoryAiRepository());

    await expect(
      service.getById("ai-response-7", { id: "user-1", provider: "keycloak" })
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it("allows AI history detail reads for the matching keycloak operator", async () => {
    const service = new AiApplicationService(new InMemoryAiRepository());

    const response = await service.getById("ai-response-7", {
      id: "user-2",
      provider: "keycloak"
    });

    expect(response.data.requestId).toBe("ai-request-7");
  });

  it("keeps local-safe AI history reads broad for development flows", async () => {
    const service = new AiApplicationService(new InMemoryAiRepository());

    const history = await service.list(
      { page: 1, pageSize: 20 },
      { id: "local-operator", provider: "local" }
    );

    expect(history.data.items.some((item) => item.requestId === "ai-request-7")).toBe(true);
  });
});
