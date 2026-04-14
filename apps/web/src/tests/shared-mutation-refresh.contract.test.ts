import { describe, expect, it } from "vitest";
import { createMockApiClients } from "../clients";
import { createFeedEntrySubmitter } from "../features/feed-entry";
import { createFeedUpdateSubmitter } from "../features/feed-update";
import { toMutationPageState } from "../features/mutation-refresh";
import { createTaskSubmitter } from "../features/task-create";
import { createTaskUpdateSubmitter } from "../features/task-update";
import { createWaterQualityEntrySubmitter } from "../features/water-quality-entry";
import { createRepositories } from "../repositories";

describe("Shared mutation refresh helper", () => {
  it("returns refreshed list data for water-quality, tasks, and feed submissions", async () => {
    const repositories = createRepositories(createMockApiClients());

    const [waterQuality, task, feed] = await Promise.all([
      createWaterQualityEntrySubmitter(repositories)({
        pondId: "pond-1",
        recordedAt: "2026-04-14T07:30:00.000Z",
        temperatureC: 29.1,
        ph: 7.5
      }),
      createTaskSubmitter(repositories)({
        title: "Inspect net line",
        pondId: "pond-1",
        assigneeId: "user-2"
      }),
      createFeedEntrySubmitter(repositories)({
        pondId: "pond-1",
        batchId: "batch-1",
        feedType: "Finisher Feed",
        quantityKg: 26,
        fedAt: "2026-04-14T06:30:00.000Z"
      })
    ]);

    expect(waterQuality.status).toBe("success");
    expect(task.status).toBe("success");
    expect(feed.status).toBe("success");
    if (waterQuality.status === "success" && task.status === "success" && feed.status === "success") {
      expect(waterQuality.refreshedList?.items.length).toBeGreaterThan(0);
      expect(task.refreshedList?.items.length).toBeGreaterThan(0);
      expect(feed.refreshedList?.items.length).toBeGreaterThan(0);
    }
  });

  it("derives stable page-facing mutation state for success and validation-error results", async () => {
    const repositories = createRepositories(createMockApiClients());
    const successResult = await createTaskSubmitter(repositories)({
      title: "Check oxygen sensor",
      pondId: "pond-1",
      assigneeId: "user-3"
    });
    const validationResult = await createFeedEntrySubmitter(repositories)({
      pondId: "",
      batchId: undefined,
      feedType: "",
      quantityKg: 0,
      fedAt: ""
    });

    const successState = toMutationPageState(successResult, false);
    const validationState = toMutationPageState(validationResult, false);

    expect(successState.status).toBe("success");
    expect(successState.refreshedList?.items.length).toBeGreaterThan(0);
    expect(validationState.status).toBe("validation_error");
    expect(validationState.fieldErrors.feedType).toBeTruthy();
  });

  it("syncs both list and detail state for update flows", async () => {
    const repositories = createRepositories(createMockApiClients());
    const createdTask = await repositories.tasks.create({
      title: "Check inlet sensor",
      assigneeId: "user-3",
      pondId: "pond-1"
    });
    const createdFeed = await repositories.feed.create({
      pondId: "pond-1",
      batchId: "batch-1",
      feedType: "Starter Feed",
      quantityKg: 18,
      fedAt: "2026-04-14T06:00:00.000Z"
    });
    const [taskResult, feedResult] = await Promise.all([
      createTaskUpdateSubmitter(repositories)(createdTask.data.id)({
        title: "Check inlet sensor complete",
        status: "done"
      }),
      createFeedUpdateSubmitter(repositories)(createdFeed.data.id)({
        feedType: "Grower Feed",
        quantityKg: 24
      })
    ]);
    const taskState = toMutationPageState(taskResult, false);
    const feedState = toMutationPageState(feedResult, false);

    expect(taskState.status).toBe("success");
    expect(taskState.refreshedList?.items[0]?.id).toBe(createdTask.data.id);
    expect(taskState.refreshedDetail?.status).toBe("done");
    expect(feedState.status).toBe("success");
    expect(feedState.refreshedList?.items[0]?.id).toBe(createdFeed.data.id);
    expect(feedState.refreshedDetail?.quantityKg).toBe(24);
  });
});
