import { afterEach, describe, expect, it, vi } from "vitest";
import { GET as feedGet, POST as feedPost } from "../../app/api/feed/route";
import { GET as feedCatchAllGet, PATCH as feedCatchAllPatch } from "../../app/api/feed/[...segments]/route";
import {
  buildFeedProxyTargetUrl,
  proxyFeedApiRequest,
  readFeedLocalProxyConfig
} from "../server/feed-local-proxy";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json"
    }
  });
}

describe("Feed local API proxy", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("builds local backend targets with safe defaults", () => {
    const request = new Request("http://localhost:3000/api/feed?page=1&pageSize=20");
    const config = readFeedLocalProxyConfig({});

    expect(config.backendBaseUrl).toBe("http://localhost:4000");
    expect(buildFeedProxyTargetUrl(request, config)).toBe(
      "http://localhost:4000/api/feed?page=1&pageSize=20"
    );
  });

  it("proxies feed list requests through the Next route bridge", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      expect(String(input)).toBe("http://localhost:4000/api/feed?page=1&pageSize=20");
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

    const response = await feedGet(
      new Request("http://localhost:3000/api/feed?page=1&pageSize=20")
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

      if (url === "http://localhost:4000/api/feed") {
        expect(init?.method).toBe("POST");
        expect(init?.body).toBeInstanceOf(ArrayBuffer);
        return jsonResponse({
          ok: true,
          data: {
            id: "feed-1",
            pondId: "pond-1",
            batchId: "batch-1",
            feedType: "Grower Feed",
            quantityKg: 42,
            fedAt: "2026-04-21T10:00:00.000Z",
            createdAt: "2026-04-21T10:00:00.000Z",
            updatedAt: "2026-04-21T10:00:00.000Z"
          }
        });
      }

      expect(url).toBe("http://localhost:4000/api/feed/feed-1");
      expect(init?.method).toBe("GET");
      return jsonResponse({
        ok: true,
        data: {
          id: "feed-1",
          pondId: "pond-1",
          batchId: "batch-1",
          feedType: "Grower Feed",
          quantityKg: 42,
          fedAt: "2026-04-21T10:00:00.000Z",
          createdAt: "2026-04-21T10:00:00.000Z",
          updatedAt: "2026-04-21T10:00:00.000Z"
        }
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    const createResponse = await feedPost(
      new Request("http://localhost:3000/api/feed", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          pondId: "pond-1",
          batchId: "batch-1",
          feedType: "Grower Feed",
          quantityKg: 42,
          fedAt: "2026-04-21T10:00:00.000Z"
        })
      })
    );
    const detailResponse = await feedCatchAllGet(
      new Request("http://localhost:3000/api/feed/feed-1")
    );

    expect(createResponse.status).toBe(200);
    expect((await createResponse.json()).data.id).toBe("feed-1");
    expect(detailResponse.status).toBe(200);
    expect((await detailResponse.json()).data.id).toBe("feed-1");
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
              message: "feedType is required",
              fieldErrors: { feedType: "Required" }
            }
          },
          422
        )
      )
    );

    const response = await feedPost(
      new Request("http://localhost:3000/api/feed", {
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
        message: "feedType is required",
        fieldErrors: { feedType: "Required" }
      }
    });
  });

  it("proxies update requests through the catch-all bridge", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      expect(String(input)).toBe("http://localhost:4000/api/feed/feed-1");
      expect(init?.method).toBe("PATCH");
      return jsonResponse({
        ok: true,
        data: {
          id: "feed-1",
          pondId: "pond-1",
          batchId: "batch-1",
          feedType: "Finisher Feed",
          quantityKg: 46,
          fedAt: "2026-04-21T10:00:00.000Z",
          createdAt: "2026-04-21T10:00:00.000Z",
          updatedAt: "2026-04-21T11:00:00.000Z"
        }
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    const response = await feedCatchAllPatch(
      new Request("http://localhost:3000/api/feed/feed-1", {
        method: "PATCH",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({ feedType: "Finisher Feed", quantityKg: 46 })
      })
    );

    expect(response.status).toBe(200);
    expect((await response.json()).data.feedType).toBe("Finisher Feed");
  });

  it("returns a developer-friendly 502 response when the backend is unavailable", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => {
      throw new Error("connect ECONNREFUSED");
    }));

    const response = await proxyFeedApiRequest(
      new Request("http://localhost:3000/api/feed"),
      {
        backendBaseUrl: "http://localhost:4000"
      }
    );

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({
      ok: false,
      error: {
        code: "FEED_LOCAL_PROXY_UNAVAILABLE",
        message:
          "Feed local proxy could not reach http://localhost:4000. Start the API server or update AQUAPULSE_WEB_LOCAL_API_BACKEND_URL."
      }
    });
  });
});
