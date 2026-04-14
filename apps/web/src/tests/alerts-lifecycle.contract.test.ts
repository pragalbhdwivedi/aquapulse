import { describe, expect, it } from "vitest";
import { createRepositories, createRepositoriesFromConfig } from "../repositories";
import { createMockApiClients } from "../clients";
import { createAlertLifecycleSubmitter, submitAlertLifecycleAction } from "../features/alert-lifecycle";

describe("Alerts lifecycle flow", () => {
  it("supports acknowledge and resolve through the default mock-backed repository path", async () => {
    const repositories = createRepositories(createMockApiClients());
    const acknowledge = createAlertLifecycleSubmitter(repositories, "acknowledge")("alert-1");
    const resolve = createAlertLifecycleSubmitter(repositories, "resolve")("alert-1");

    const acknowledged = await acknowledge({});
    const resolved = await resolve({});

    expect(acknowledged.status).toBe("success");
    expect(resolved.status).toBe("success");
    if (acknowledged.status === "success" && resolved.status === "success") {
      expect(acknowledged.data.status).toBe("acknowledged");
      expect(resolved.data.status).toBe("resolved");
      expect(resolved.refreshedList?.items.find((item) => item.id === "alert-1")?.status).toBe("resolved");
    }
  });

  it("supports lifecycle actions through placeholder-http runtime", async () => {
    const repositories = createRepositoriesFromConfig({
      mode: "http",
      enablePlaceholderHttp: true
    });

    const acknowledged = await repositories.alerts.acknowledge("alert-1", {});
    const resolved = await repositories.alerts.resolve("alert-1", {});

    expect(acknowledged.data.status).toBe("acknowledged");
    expect(resolved.data.status).toBe("resolved");
  });

  it("keeps the public submit helper stable", async () => {
    const result = await submitAlertLifecycleAction("acknowledge", "alert-1", {});

    expect(result.status).toBe("success");
    if (result.status === "success") {
      expect(result.data.status).toBe("acknowledged");
    }
  });
});
