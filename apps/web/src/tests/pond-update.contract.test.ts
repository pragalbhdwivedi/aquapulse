import { describe, expect, it } from "vitest";
import { createMockApiClients } from "../clients";
import { createRepositories, createRepositoriesFromConfig } from "../repositories";
import { createPondUpdateSubmitter, submitPondUpdate } from "../features/pond-update";

describe("Ponds update flow", () => {
  it("supports valid update through the default mock-backed repository path", async () => {
    const repositories = createRepositories(createMockApiClients());
    const created = await repositories.ponds.getById("pond-1");
    const submit = createPondUpdateSubmitter(repositories)(created.data.id);
    const result = await submit({
      name: "North Pond 1 Revised",
      status: "maintenance"
    });

    expect(result.status).toBe("success");
    if (result.status === "success") {
      expect(result.data.name).toBe("North Pond 1 Revised");
      expect(result.refreshedList?.items[0]?.id).toBe(created.data.id);
      expect(result.refreshedDetail?.status).toBe("maintenance");
    }
  });

  it("returns validation-style failure for invalid update before calling the client path", async () => {
    const result = await submitPondUpdate("pond-1", {
      name: ""
    });

    expect(result.status).toBe("validation_error");
    if (result.status === "validation_error") {
      expect(result.fieldErrors.name).toBeTruthy();
    }
  });

  it("remains structurally compatible with placeholder-http runtime", async () => {
    const repositories = createRepositoriesFromConfig({
      mode: "http",
      enablePlaceholderHttp: true
    });

    const updated = await repositories.ponds.update("pond-1", {
      name: "North Pond 1 Proxy",
      status: "inactive"
    });
    const detail = await repositories.ponds.getById("pond-1");

    expect(updated.data.name).toBe("North Pond 1 Proxy");
    expect(detail.data.status).toBe("inactive");
  });
});
