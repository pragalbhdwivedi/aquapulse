import { afterEach, describe, expect, it, vi } from "vitest";
import { GET as tasksGet, POST as tasksPost } from "../../app/api/tasks/route";
import { GET as tasksCatchAllGet, PATCH as tasksCatchAllPatch } from "../../app/api/tasks/[...segments]/route";
import {
  buildTasksProxyTargetUrl,
  proxyTasksApiRequest,
  readTasksLocalProxyConfig
} from "../server/tasks-local-proxy";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json"
    }
  });
}

describe("Tasks local API proxy", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("builds local backend targets with safe defaults", () => {
    const request = new Request("http://localhost:3000/api/tasks?page=1&pageSize=20");
    const config = readTasksLocalProxyConfig({});

    expect(config.backendBaseUrl).toBe("http://localhost:4000");
    expect(buildTasksProxyTargetUrl(request, config)).toBe(
      "http://localhost:4000/api/tasks?page=1&pageSize=20"
    );
  });

  it("proxies task list requests through the Next route bridge", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      expect(String(input)).toBe("http://localhost:4000/api/tasks?page=1&pageSize=20");
      expect(init?.method).toBe("GET");
      return jsonResponse({
        ok: true,
        data: {
          items: [],
          page: { page: 1, pageSize: 20, totalItems: 0, totalPages: 1 }
        }
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    const response = await tasksGet(
      new Request("http://localhost:3000/api/tasks?page=1&pageSize=20")
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      ok: true,
      data: {
        items: [],
        page: { page: 1, pageSize: 20, totalItems: 0, totalPages: 1 }
      }
    });
  });

  it("proxies create and detail requests while preserving payload and status", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);

      if (url === "http://localhost:4000/api/tasks") {
        expect(init?.method).toBe("POST");
        expect(init?.body).toBeInstanceOf(ArrayBuffer);
        return jsonResponse({
          ok: true,
          data: {
            id: "task-1",
            title: "Inspect inlet valve",
            status: "todo",
            assigneeId: "user-1",
            pondId: "pond-1",
            createdAt: "2026-04-21T10:00:00.000Z",
            updatedAt: "2026-04-21T10:00:00.000Z"
          }
        });
      }

      expect(url).toBe("http://localhost:4000/api/tasks/task-1");
      expect(init?.method).toBe("GET");
      return jsonResponse({
        ok: true,
        data: {
          id: "task-1",
          title: "Inspect inlet valve",
          status: "todo",
          assigneeId: "user-1",
          pondId: "pond-1",
          createdAt: "2026-04-21T10:00:00.000Z",
          updatedAt: "2026-04-21T10:00:00.000Z"
        }
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    const createResponse = await tasksPost(
      new Request("http://localhost:3000/api/tasks", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          title: "Inspect inlet valve",
          assigneeId: "user-1",
          pondId: "pond-1"
        })
      })
    );
    const detailResponse = await tasksCatchAllGet(
      new Request("http://localhost:3000/api/tasks/task-1")
    );

    expect(createResponse.status).toBe(200);
    expect((await createResponse.json()).data.id).toBe("task-1");
    expect(detailResponse.status).toBe(200);
    expect((await detailResponse.json()).data.id).toBe("task-1");
  });

  it("preserves backend validation errors without flattening the payload", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse(
          {
            ok: false,
            error: {
              code: "VALIDATION_ERROR",
              message: "title is required",
              fieldErrors: { title: "Required" }
            }
          },
          422
        )
      )
    );

    const response = await tasksPost(
      new Request("http://localhost:3000/api/tasks", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({ pondId: "pond-1" })
      })
    );

    expect(response.status).toBe(422);
    expect(await response.json()).toEqual({
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "title is required",
        fieldErrors: { title: "Required" }
      }
    });
  });

  it("proxies update requests through the catch-all bridge", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      expect(String(input)).toBe("http://localhost:4000/api/tasks/task-1");
      expect(init?.method).toBe("PATCH");
      return jsonResponse({
        ok: true,
        data: {
          id: "task-1",
          title: "Inspect inlet valve complete",
          status: "done",
          assigneeId: "user-1",
          pondId: "pond-1",
          createdAt: "2026-04-21T10:00:00.000Z",
          updatedAt: "2026-04-21T11:00:00.000Z"
        }
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    const response = await tasksCatchAllPatch(
      new Request("http://localhost:3000/api/tasks/task-1", {
        method: "PATCH",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({ title: "Inspect inlet valve complete", status: "done" })
      })
    );

    expect(response.status).toBe(200);
    expect((await response.json()).data.status).toBe("done");
  });

  it("returns a developer-friendly 502 response when the backend is unavailable", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => {
      throw new Error("connect ECONNREFUSED");
    }));

    const response = await proxyTasksApiRequest(
      new Request("http://localhost:3000/api/tasks"),
      {
        backendBaseUrl: "http://localhost:4000"
      }
    );

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({
      ok: false,
      error: {
        code: "TASKS_LOCAL_PROXY_UNAVAILABLE",
        message:
          "Tasks local proxy could not reach http://localhost:4000. Start the API server or update AQUAPULSE_WEB_LOCAL_API_BACKEND_URL."
      }
    });
  });
});
