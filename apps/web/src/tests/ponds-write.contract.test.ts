import { describe, expect, it } from "vitest";
import { createMockApiClients } from "../clients";
import { createRepositories, createRepositoriesFromConfig } from "../repositories";
import { createPondCreateSubmitter, submitPondCreate } from "../features/pond-create";

describe("Ponds write flow", () => {
  it("supports valid submission through the default mock-backed repository path", async () => {
    const repositories = createRepositories(createMockApiClients());
    const submit = createPondCreateSubmitter(repositories);
    const result = await submit({
      name: "South Pond 2",
      code: "SP-02",
      farmId: "farm-2",
      kind: "pond"
    });

    expect(result.status).toBe("success");
    if (result.status === "success") {
      expect(result.data.name).toBe("South Pond 2");
      expect(result.data.status).toBe("active");
      expect(result.refreshedList?.items[0]?.farmId).toBe("farm-2");
    }
  });

  it("returns validation-style failure for invalid submission before calling the client path", async () => {
    const result = await submitPondCreate({
      name: "",
      code: "X",
      farmId: "farm-1",
      kind: "pond"
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

    const created = await repositories.ponds.create({
      name: "Proxy Pond 9",
      code: "PX-09",
      farmId: "farm-9",
      kind: "cage"
    });
    const listed = await repositories.ponds.list({
      page: 1,
      pageSize: 20,
      farmId: "farm-9"
    });

    expect(created.data.name).toBe("Proxy Pond 9");
    expect(listed.data.items[0]?.farmId).toBe("farm-9");
  });

  it("keeps bounded ponds detail reads structurally compatible with existing repository clients", async () => {
    const repositories = createRepositories(createMockApiClients());
    const detail = await repositories.ponds.getById("pond-1");

    expect(detail.data.id).toBe("pond-1");
    expect(detail.data.name).toBeTruthy();
  });
});
