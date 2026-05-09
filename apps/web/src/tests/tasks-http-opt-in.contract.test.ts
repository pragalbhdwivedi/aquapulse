import type {
  ApiSuccessEnvelope,
  ListResponse,
  TaskSummary
} from "@aquapulse/types";
import { describe, expect, it, vi } from "vitest";
import { createRepositoriesFromConfig } from "../repositories";

function jsonResponse<TBody>(body: TBody) {
  return {
    status: 200,
    async json() {
      return body;
    }
  } as Response;
}

describe("Tasks opt-in HTTP runtime", () => {
  it("keeps default runtime mock-backed while allowing tasks-only fetch HTTP mode when explicitly enabled", async () => {
    const requests: Array<{ method?: string; url: string; body?: unknown }> = [];
    const task: TaskSummary = {
      id: "task-1",
      title: "Inspect inlet valve",
      status: "todo",
      assigneeId: "user-1",
      pondId: "pond-1",
      createdAt: "2026-04-21T10:00:00.000Z",
      updatedAt: "2026-04-21T10:00:00.000Z"
    };

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method ?? (input instanceof Request ? input.method : undefined);
      let body: Record<string, unknown> | undefined;

      if (typeof init?.body === "string") {
        body = JSON.parse(init.body) as Record<string, unknown>;
      } else if (input instanceof Request) {
        const rawBody = await input.clone().text();
        body = rawBody ? (JSON.parse(rawBody) as Record<string, unknown>) : undefined;
      }

      requests.push({ method, url, body });

      if (url.endsWith("/api/tasks?page=1&pageSize=20&pondId=pond-1")) {
        return jsonResponse<ApiSuccessEnvelope<ListResponse<TaskSummary>>>({
          ok: true,
          data: {
            items: [task],
            page: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 }
          }
        });
      }

      if (url.endsWith("/api/tasks/task-1?id=task-1") || url.endsWith("/api/tasks/task-1")) {
        return jsonResponse<ApiSuccessEnvelope<TaskSummary>>({
          ok: true,
          data: task
        });
      }

      if (url.endsWith("/api/tasks/task-2") && method === "PATCH") {
        return jsonResponse<ApiSuccessEnvelope<TaskSummary>>({
          ok: true,
          data: {
            ...task,
            id: "task-2",
            title: (body?.title as string | undefined) ?? "Verifier task updated",
            status: (body?.status as TaskSummary["status"] | undefined) ?? "done",
            assigneeId: (body?.assigneeId as string | undefined) ?? "user-2",
            updatedAt: "2026-04-21T11:00:00.000Z"
          }
        });
      }

      if (url.endsWith("/api/tasks")) {
        return jsonResponse<ApiSuccessEnvelope<TaskSummary>>({
          ok: true,
          data: {
            ...task,
            id: "task-2",
            title: (body?.title as string | undefined) ?? task.title,
            assigneeId: (body?.assigneeId as string | undefined) ?? task.assigneeId,
            pondId: (body?.pondId as string | undefined) ?? task.pondId
          }
        });
      }

      throw new Error(`Unhandled fetch request: ${url}`);
    });

    vi.stubGlobal("fetch", fetchMock);

    const defaultRepositories = createRepositoriesFromConfig({
      mode: "mock",
      enablePlaceholderHttp: false,
      enableFetchHttp: false,
      tasksMode: "inherit"
    });
    const httpRepositories = createRepositoriesFromConfig({
      mode: "mock",
      enablePlaceholderHttp: false,
      enableFetchHttp: true,
      tasksMode: "http"
    });

    const [defaultList, httpList, detail, created, updated] = await Promise.all([
      defaultRepositories.tasks.list({ page: 1, pageSize: 20, pondId: "pond-1" }),
      httpRepositories.tasks.list({ page: 1, pageSize: 20, pondId: "pond-1" }),
      httpRepositories.tasks.getById("task-1"),
      httpRepositories.tasks.create({
        title: "Verifier task",
        assigneeId: "user-2",
        pondId: "pond-1"
      }),
      httpRepositories.tasks.update("task-2", {
        title: "Verifier task updated",
        status: "done",
        assigneeId: "user-2"
      })
    ]);

    expect(defaultList.data.items[0]?.pondId).toBe("pond-1");
    expect(httpList.data.items[0]?.id).toBe("task-1");
    expect(detail.data.id).toBe("task-1");
    expect(created.data.id).toBe("task-2");
    expect(updated.data.status).toBe("done");
    expect(requests.some((request) => request.url.startsWith("/api/tasks"))).toBe(true);
  });
});
