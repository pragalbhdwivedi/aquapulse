import { describe, expect, it } from "vitest";
import { createRepositories, createRepositoriesFromConfig } from "../repositories";
import { createMockApiClients } from "../clients";
import { createAlertLifecycleSubmitter, submitAlertLifecycleAction } from "../features/alert-lifecycle";

describe("Alerts lifecycle flow", () => {
  it("supports acknowledge and resolve through the default mock-backed repository path", async () => {
    const repositories = createRepositories(createMockApiClients());
    const acknowledge = createAlertLifecycleSubmitter(repositories, "acknowledge")("alert-1");
    const resolve = createAlertLifecycleSubmitter(repositories, "resolve")("alert-1");

    const acknowledged = await acknowledge({ note: "Checked dissolved oxygen meter." });
    const resolved = await resolve({ note: "Values back in range." });

    expect(acknowledged.status).toBe("success");
    expect(resolved.status).toBe("success");
    if (acknowledged.status === "success" && resolved.status === "success") {
      expect(acknowledged.data.status).toBe("acknowledged");
      expect(resolved.data.status).toBe("resolved");
      expect(resolved.data.latestNote).toBe("Values back in range.");
      expect(resolved.data.actionHistory?.map((item) => item.action)).toEqual([
        "created",
        "acknowledged",
        "resolved"
      ]);
      expect(resolved.refreshedList?.items.find((item) => item.id === "alert-1")?.status).toBe("resolved");
    }
  });

  it("supports lifecycle actions through placeholder-http runtime", async () => {
    const repositories = createRepositoriesFromConfig({
      mode: "http",
      enablePlaceholderHttp: true
    });

    const acknowledged = await repositories.alerts.acknowledge("alert-1", { note: "Reviewed in HTTP mode." });
    const resolved = await repositories.alerts.resolve("alert-1", { note: "Closed in HTTP mode." });

    expect(acknowledged.data.status).toBe("acknowledged");
    expect(resolved.data.status).toBe("resolved");
    expect(resolved.data.actionHistory?.at(-1)?.note).toBe("Closed in HTTP mode.");
  });

  it("keeps the public submit helper stable", async () => {
    const result = await submitAlertLifecycleAction("acknowledge", "alert-1", {
      note: "Operator follow-up."
    });

    expect(result.status).toBe("success");
    if (result.status === "success") {
      expect(result.data.status).toBe("acknowledged");
      expect(result.data.latestNote).toBe("Operator follow-up.");
    }
  });
});
