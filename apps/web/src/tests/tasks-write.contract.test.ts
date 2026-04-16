import { describe, expect, it } from "vitest";
import { createRepositories, createRepositoriesFromConfig } from "../repositories";
import { createMockApiClients } from "../clients";
import { createTaskSubmitter, submitTask } from "../features/task-create";

describe("Tasks write flow", () => {
  it("supports valid submission through the default mock-backed repository path", async () => {
    const repositories = createRepositories(createMockApiClients());
    const submit = createTaskSubmitter(repositories);
    const result = await submit({
      title: "Check inlet valve",
      assigneeId: "user-2",
      pondId: "pond-1"
    });

    expect(result.status).toBe("success");
    if (result.status === "success") {
      expect(result.data.title).toBe("Check inlet valve");
      expect(result.data.status).toBe("todo");
      expect(result.refreshedList?.items[0]?.title).toBeTruthy();
    }
  });

  it("returns validation-style failure for invalid submission before calling the client path", async () => {
    const result = await submitTask({
      title: "",
      assigneeId: undefined,
      pondId: "pond-1"
    });

    expect(result.status).toBe("validation_error");
    if (result.status === "validation_error") {
      expect(result.fieldErrors.title).toBeTruthy();
    }
  });

  it("remains structurally compatible with placeholder-http runtime", async () => {
    const repositories = createRepositoriesFromConfig({
      mode: "http",
      enablePlaceholderHttp: true
    });

    const created = await repositories.tasks.create({
      title: "Inspect paddlewheel motor",
      assigneeId: "user-4",
      pondId: "pond-1"
    });
    const listed = await repositories.tasks.list({
      page: 1,
      pageSize: 20,
      pondId: "pond-1"
    });

    expect(created.data.title).toBe("Inspect paddlewheel motor");
    expect(listed.data.items[0]?.pondId).toBe("pond-1");
  });
});
