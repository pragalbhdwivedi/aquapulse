import { describe, expect, it } from "vitest";
import { QueryAiDto } from "../modules/ai/dto/query-ai.dto";
import { toQueryAiInput } from "../modules/ai/mappers/ai.mapper";
import { QueryAlertsDto } from "../modules/alerts/dto/query-alerts.dto";
import { toQueryAlertsInput } from "../modules/alerts/mappers/alerts.mapper";
import { QueryAttachmentsDto } from "../modules/attachments/dto/query-attachments.dto";
import { toQueryAttachmentsInput } from "../modules/attachments/mappers/attachments.mapper";
import { QueryAuditDto } from "../modules/audit/dto/query-audit.dto";
import { toQueryAuditInput } from "../modules/audit/mappers/audit.mapper";
import { QueryBatchesDto } from "../modules/batches/dto/query-batches.dto";
import { toQueryBatchesInput } from "../modules/batches/mappers/batches.mapper";
import { QueryFeedDto } from "../modules/feed/dto/query-feed.dto";
import { toQueryFeedInput } from "../modules/feed/mappers/feed.mapper";
import { QueryPondsDto } from "../modules/ponds/dto/query-ponds.dto";
import { toQueryPondsInput } from "../modules/ponds/mappers/ponds.mapper";
import { QueryTasksDto } from "../modules/tasks/dto/query-tasks.dto";
import { toQueryTasksInput } from "../modules/tasks/mappers/tasks.mapper";

describe("Query contract normalization", () => {
  it("normalizes pond, alert, and task query DTOs into shared list-query contracts", () => {
    const ponds = Object.assign(new QueryPondsDto(), {
      page: 2,
      pageSize: 15,
      search: "north",
      sortField: "name",
      sortDirection: "desc" as const,
      farmId: "farm-1",
      status: "active" as const
    });
    const alerts = Object.assign(new QueryAlertsDto(), {
      page: 1,
      pageSize: 10,
      severity: "high" as const,
      source: "water-quality",
      hasLatestNote: true,
      sortBy: "updatedAt_desc" as const,
      filters: [{ field: "status", value: "open" as const }]
    });
    const tasks = Object.assign(new QueryTasksDto(), {
      page: 1,
      pageSize: 5,
      assigneeId: "user-1",
      status: "todo" as const
    });

    expect(toQueryPondsInput(ponds)).toEqual({
      page: 2,
      pageSize: 15,
      search: "north",
      sort: [{ field: "name", direction: "desc" }],
      filters: undefined,
      dateRange: undefined,
      farmId: "farm-1",
      status: "active",
      kind: undefined
    });
    expect(toQueryAlertsInput(alerts)).toEqual({
      page: 1,
      pageSize: 10,
      search: undefined,
      sort: undefined,
      filters: [{ field: "status", value: "open" }],
      dateRange: undefined,
      pondId: undefined,
      severity: "high",
      status: undefined,
      source: "water-quality",
      hasLatestNote: true,
      sortBy: "updatedAt_desc"
    });
    expect(toQueryTasksInput(tasks)).toEqual({
      page: 1,
      pageSize: 5,
      search: undefined,
      sort: undefined,
      filters: undefined,
      dateRange: undefined,
      assigneeId: "user-1",
      pondId: undefined,
      status: "todo"
    });
  });

  it("normalizes attachments, batches, feed, audit, and ai query DTOs consistently", () => {
    const attachments = Object.assign(new QueryAttachmentsDto(), {
      page: 1,
      pageSize: 20,
      resourceType: "alert",
      resourceId: "alert-1"
    });
    const batches = Object.assign(new QueryBatchesDto(), {
      page: 1,
      pageSize: 20,
      pondId: "pond-1",
      lifecycleStage: "growing" as const
    });
    const feed = Object.assign(new QueryFeedDto(), {
      page: 3,
      pageSize: 25,
      batchId: "batch-1",
      feedType: "starter"
    });
    const audit = Object.assign(new QueryAuditDto(), {
      page: 1,
      pageSize: 20,
      action: "update" as const,
      resourceType: "alert"
    });
    const ai = Object.assign(new QueryAiDto(), {
      page: 1,
      pageSize: 20,
      requestId: "ai-request-1",
      status: "completed" as const,
      model: "gpt-5.4"
    });

    expect(toQueryAttachmentsInput(attachments).resourceType).toBe("alert");
    expect(toQueryAttachmentsInput(attachments).resourceId).toBe("alert-1");
    expect(toQueryBatchesInput(batches).lifecycleStage).toBe("growing");
    expect(toQueryFeedInput(feed)).toEqual({
      page: 3,
      pageSize: 25,
      search: undefined,
      sort: undefined,
      filters: undefined,
      dateRange: undefined,
      pondId: undefined,
      batchId: "batch-1",
      feedType: "starter"
    });
    expect(toQueryAuditInput(audit).action).toBe("update");
    expect(toQueryAiInput(ai)).toEqual({
      page: 1,
      pageSize: 20,
      search: undefined,
      sort: undefined,
      filters: undefined,
      dateRange: undefined,
      requestId: "ai-request-1",
      status: "completed",
      model: "gpt-5.4"
    });
  });
});
