import { describe, expect, it } from "vitest";
import { createRepositories, createRepositoriesFromConfig } from "../repositories";
import { createMockApiClients } from "../clients";
import { createTaskUpdateSubmitter, submitTaskUpdate } from "../features/task-update";

describe("Tasks update flow", () => {
  it("supports valid update through the default mock-backed repository path", async () => {
    const repositories = createRepositories(createMockApiClients());
    const created = await repositories.tasks.create({
      title: "Update pump logs",
      assigneeId: "user-2",
      pondId: "pond-1"
    });
    const submit = createTaskUpdateSubmitter(repositories)(created.data.id);
    const result = await submit({
      title: "Update pump logs - done",
      status: "done",
      assigneeId: "user-7"
    });

    expect(result.status).toBe("success");
    if (result.status === "success") {
      expect(result.data.title).toBe("Update pump logs - done");
      expect(result.refreshedList?.items[0]?.id).toBe(created.data.id);
      expect(result.refreshedDetail?.status).toBe("done");
    }
  });

  it("returns validation-style failure for invalid update before calling the client path", async () => {
    const result = await submitTaskUpdate("task-1", {
      title: ""
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
      title: "Inspect blower housing",
      assigneeId: "user-5",
      pondId: "pond-1"
    });
    const updated = await repositories.tasks.update(created.data.id, {
      title: "Inspect blower housing complete",
      status: "done"
    });
    const detail = await repositories.tasks.getById(created.data.id);

    expect(updated.data.title).toBe("Inspect blower housing complete");
    expect(detail.data.status).toBe("done");
  });
});
