import {
  createPlaceholderAttachmentRow,
  createPlaceholderBatchRow,
  createPlaceholderFeedRow,
  createPlaceholderTaskRow,
  createRecordingConnectionFactory,
  createTestDatabaseConfig,
  type RecordedDatabasePlan
} from "@aquapulse/database";
import { describe, expect, it } from "vitest";
import {
  PostgresAttachmentsRepository,
  buildAttachmentByIdQueryPlan,
  buildAttachmentsByResourceQueryPlan,
  buildAttachmentsListQueryPlan,
  buildCreateAttachmentQueryPlan,
  buildUpdateAttachmentQueryPlan
} from "../modules/attachments/adapters/postgres-attachments.repository";
import type { AttachmentsRepositoryPort } from "../modules/attachments/ports/attachments-repository.port";
import {
  PostgresBatchesRepository,
  buildBatchByIdQueryPlan,
  buildBatchesListQueryPlan,
  buildCreateBatchQueryPlan,
  buildUpdateBatchQueryPlan
} from "../modules/batches/adapters/postgres-batches.repository";
import type { BatchesRepositoryPort } from "../modules/batches/ports/batches-repository.port";
import {
  PostgresFeedRepository,
  buildCreateFeedQueryPlan,
  buildFeedByIdQueryPlan,
  buildFeedListQueryPlan,
  buildUpdateFeedQueryPlan
} from "../modules/feed/adapters/postgres-feed.repository";
import type { FeedRepositoryPort } from "../modules/feed/ports/feed-repository.port";
import {
  PostgresTasksRepository,
  buildCreateTaskQueryPlan,
  buildTaskByIdQueryPlan,
  buildTasksListQueryPlan,
  buildUpdateTaskQueryPlan
} from "../modules/tasks/adapters/postgres-tasks.repository";
import type { TasksRepositoryPort } from "../modules/tasks/ports/tasks-repository.port";

describe("Postgres module rollout adapters", () => {
  it("tasks and attachments use shared read/write gateway behavior", async () => {
    const taskPlans: RecordedDatabasePlan[] = [];
    const attachmentPlans: RecordedDatabasePlan[] = [];
    const tasksRepository: TasksRepositoryPort = PostgresTasksRepository.forTesting({
      connectionFactory: createRecordingConnectionFactory(taskPlans, {
        rows: [createPlaceholderTaskRow({ id: "task-42", pond_id: "pond-42" })]
      }),
      databaseConfig: createTestDatabaseConfig()
    });
    const attachmentsRepository: AttachmentsRepositoryPort = PostgresAttachmentsRepository.forTesting({
      connectionFactory: createRecordingConnectionFactory(attachmentPlans, {
        rows: [createPlaceholderAttachmentRow({ id: "attachment-42", resource_id: "alert-42" })]
      }),
      databaseConfig: createTestDatabaseConfig()
    });

    const [task, taskList, createdTask, updatedTask, attachment, attachmentList, createdAttachment, updatedAttachment] =
      await Promise.all([
        tasksRepository.getById("task-42"),
        tasksRepository.list({ page: 1, pageSize: 20, status: "todo" }),
        tasksRepository.create({ title: "Task write placeholder", pondId: "pond-1" }),
        tasksRepository.update("task-write-2", {}),
        attachmentsRepository.getById("attachment-42"),
        attachmentsRepository.listByResource("alert", "alert-42"),
        attachmentsRepository.create({ id: "attachment-write-1" }),
        attachmentsRepository.update("attachment-write-2", {})
      ]);

    expect(task.id).toBe("task-42");
    expect(taskList.items[0]?.pondId).toBe("pond-42");
    expect(createdTask.id).toBe("task-42");
    expect(updatedTask.id).toBe("task-42");
    expect(attachment.id).toBe("attachment-42");
    expect(attachmentList.items[0]?.resourceId).toBe("alert-42");
    expect(createdAttachment.id).toBe("attachment-42");
    expect(updatedAttachment.id).toBe("attachment-42");
    expect(buildTaskByIdQueryPlan("task-42").filters).toEqual({ id: "task-42" });
    expect(buildTasksListQueryPlan({ page: 1, pageSize: 20, status: "todo" }).filters).toEqual({
      assigneeId: undefined,
      pondId: undefined,
      status: "todo",
      search: undefined
    });
    expect(buildCreateTaskQueryPlan(createPlaceholderTaskRow({ id: "task-write-1" })).filters).toEqual({
      title: "Inspect aeration equipment",
      status: "todo",
      assigneeId: "user-1",
      pondId: "pond-1"
    });
    expect(
      buildUpdateTaskQueryPlan("task-write-2", {
        id: "task-write-2",
        updated_at: "2026-04-13T00:00:00.000Z"
      }).params
    ).toEqual(["task-write-2", null, null, null, null, "2026-04-13T00:00:00.000Z"]);
    expect(buildAttachmentByIdQueryPlan("attachment-42").key).toBe("attachments.getById");
    expect(buildAttachmentsListQueryPlan({ page: 1, pageSize: 20 }).params).toEqual([1, 20, null, null, null]);
    expect(buildAttachmentsByResourceQueryPlan("alert", "alert-42").filters).toEqual({
      resourceType: "alert",
      resourceId: "alert-42"
    });
    expect(
      buildCreateAttachmentQueryPlan(createPlaceholderAttachmentRow({ id: "attachment-write-1" })).key
    ).toBe("attachments.create");
    expect(
      buildUpdateAttachmentQueryPlan("attachment-write-2", {
        id: "attachment-write-2",
        updated_at: "2026-04-13T00:00:00.000Z"
      }).params
    ).toEqual([
      "attachment-write-2",
      { id: "attachment-write-2", updated_at: "2026-04-13T00:00:00.000Z" }
    ]);
    expect(taskPlans.length).toBe(4);
    expect(taskPlans[0]?.statement).toContain("from tasks");
    expect(taskPlans[1]?.statement).toContain("count(*) over()::int as total_count");
    expect(taskPlans[2]?.statement).toContain("insert into tasks");
    expect(taskPlans[3]?.statement).toContain("update tasks");
    expect(attachmentPlans.length).toBe(4);
  });

  it("batches and feed adopt the same controlled read/write slice structure", async () => {
    const batchPlans: RecordedDatabasePlan[] = [];
    const feedPlans: RecordedDatabasePlan[] = [];
    const batchesRepository: BatchesRepositoryPort = PostgresBatchesRepository.forTesting({
      connectionFactory: createRecordingConnectionFactory(batchPlans, {
        rows: [createPlaceholderBatchRow({ id: "batch-42", pond_id: "pond-42" })]
      }),
      databaseConfig: createTestDatabaseConfig()
    });
    const feedRepository: FeedRepositoryPort = PostgresFeedRepository.forTesting({
      connectionFactory: createRecordingConnectionFactory(feedPlans, {
        rows: [createPlaceholderFeedRow({ id: "feed-42", batch_id: "batch-42" })]
      }),
      databaseConfig: createTestDatabaseConfig()
    });

    const [batch, batchList, createdBatch, updatedBatch, feed, feedList, createdFeed, updatedFeed] =
      await Promise.all([
        batchesRepository.getById("batch-42"),
        batchesRepository.list({ page: 1, pageSize: 20 }),
        batchesRepository.create({ id: "batch-write-1" }),
        batchesRepository.update("batch-write-2", {}),
        feedRepository.getById("feed-42"),
        feedRepository.list({ page: 1, pageSize: 20 }),
        feedRepository.create({
          pondId: "pond-1",
          batchId: "batch-1",
          feedType: "Starter Feed",
          quantityKg: 18,
          fedAt: "2026-04-14T06:00:00.000Z"
        }),
        feedRepository.update("feed-write-2", {})
      ]);

    expect(batch.id).toBe("batch-42");
    expect(batchList.items[0]?.pondId).toBe("pond-42");
    expect(createdBatch.id).toBe("batch-42");
    expect(updatedBatch.id).toBe("batch-42");
    expect(feed.id).toBe("feed-42");
    expect(feedList.items[0]?.batchId).toBe("batch-42");
    expect(createdFeed.id).toBe("feed-42");
    expect(updatedFeed.id).toBe("feed-42");
    expect(buildBatchByIdQueryPlan("batch-42").key).toBe("batches.getById");
    expect(buildBatchesListQueryPlan({ page: 1, pageSize: 20 }).params).toEqual([1, 20, null, null, null]);
    expect(buildCreateBatchQueryPlan(createPlaceholderBatchRow({ id: "batch-write-1" })).key).toBe("batches.create");
    expect(buildUpdateBatchQueryPlan("batch-write-2", { id: "batch-write-2", updated_at: "2026-04-13T00:00:00.000Z" }).params).toEqual([
      "batch-write-2",
      { id: "batch-write-2", updated_at: "2026-04-13T00:00:00.000Z" }
    ]);
    expect(buildFeedByIdQueryPlan("feed-42").filters).toEqual({ id: "feed-42" });
    expect(buildFeedListQueryPlan({ page: 1, pageSize: 20 }).params).toEqual([20, 0]);
    expect(
      buildCreateFeedQueryPlan({
        pondId: "pond-1",
        batchId: "batch-1",
        feedType: "Starter Feed",
        quantityKg: 18,
        fedAt: "2026-04-14T06:00:00.000Z"
      }).filters
    ).toEqual({
      pondId: "pond-1",
      batchId: "batch-1",
      feedType: "Starter Feed",
      fedAt: "2026-04-14T06:00:00.000Z"
    });
    expect(buildUpdateFeedQueryPlan("feed-write-2", {}).filters).toEqual({
      id: "feed-write-2"
    });
    expect(batchPlans.length).toBe(4);
    expect(feedPlans.length).toBe(4);
  });
});
