import { afterEach, describe, expect, it, vi } from "vitest";
import { GET as pondsGet, POST as pondsPost } from "../../app/api/ponds/route";
import { GET as pondsCatchAllGet, PATCH as pondsCatchAllPatch } from "../../app/api/ponds/[...segments]/route";
import {
  buildPondsProxyTargetUrl,
  proxyPondsApiRequest,
  readPondsLocalProxyConfig
} from "../server/ponds-local-proxy";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json"
    }
  });
}

describe("Ponds local API proxy", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("builds local backend targets with safe defaults", () => {
    const request = new Request("http://localhost:3000/api/ponds?page=1&pageSize=20");
    const config = readPondsLocalProxyConfig({});

    expect(config.backendBaseUrl).toBe("http://localhost:4000");
    expect(buildPondsProxyTargetUrl(request, config)).toBe(
      "http://localhost:4000/api/ponds?page=1&pageSize=20"
    );
  });

  it("proxies ponds list requests through the Next route bridge", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      expect(String(input)).toBe("http://localhost:4000/api/ponds?page=1&pageSize=20");
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

    const response = await pondsGet(
      new Request("http://localhost:3000/api/ponds?page=1&pageSize=20")
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

  it("proxies create, detail, and update requests while preserving payload and status", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);

      if (url === "http://localhost:4000/api/ponds") {
        expect(init?.method).toBe("POST");
        expect(init?.body).toBeInstanceOf(ArrayBuffer);
        return jsonResponse({
          ok: true,
          data: {
            id: "pond-3",
            name: "South Growout",
            code: "SG-03",
            farmId: "farm-1",
            kind: "pond",
            status: "active",
            createdAt: "2026-04-21T10:00:00.000Z",
            updatedAt: "2026-04-21T10:00:00.000Z"
          }
        });
      }

      if (url === "http://localhost:4000/api/ponds/pond-3" && init?.method === "PATCH") {
        return jsonResponse({
          ok: true,
          data: {
            id: "pond-3",
            name: "South Growout Updated",
            code: "SG-03",
            farmId: "farm-1",
            kind: "pond",
            status: "maintenance",
            createdAt: "2026-04-21T10:00:00.000Z",
            updatedAt: "2026-04-21T11:00:00.000Z"
          }
        });
      }

      expect(url).toBe("http://localhost:4000/api/ponds/pond-3");
      expect(init?.method).toBe("GET");
      return jsonResponse({
        ok: true,
        data: {
          id: "pond-3",
          name: "South Growout",
          code: "SG-03",
          farmId: "farm-1",
          kind: "pond",
          status: "active",
          createdAt: "2026-04-21T10:00:00.000Z",
          updatedAt: "2026-04-21T10:00:00.000Z"
        }
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    const createResponse = await pondsPost(
      new Request("http://localhost:3000/api/ponds", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          name: "South Growout",
          code: "SG-03",
          farmId: "farm-1",
          kind: "pond",
          status: "active"
        })
      })
    );
    const detailResponse = await pondsCatchAllGet(
      new Request("http://localhost:3000/api/ponds/pond-3")
    );
    const updateResponse = await pondsCatchAllPatch(
      new Request("http://localhost:3000/api/ponds/pond-3", {
        method: "PATCH",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          name: "South Growout Updated",
          status: "maintenance"
        })
      })
    );

    expect(createResponse.status).toBe(200);
    expect((await createResponse.json()).data.id).toBe("pond-3");
    expect(detailResponse.status).toBe(200);
    expect((await detailResponse.json()).data.id).toBe("pond-3");
    expect(updateResponse.status).toBe(200);
    expect((await updateResponse.json()).data.status).toBe("maintenance");
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
              message: "name is required",
              fieldErrors: { name: "Required" }
            }
          },
          422
        )
      )
    );

    const response = await pondsPost(
      new Request("http://localhost:3000/api/ponds", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({ code: "SG-03" })
      })
    );

    expect(response.status).toBe(422);
    expect(await response.json()).toEqual({
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "name is required",
        fieldErrors: { name: "Required" }
      }
    });
  });

  it("returns a developer-friendly 502 response when the backend is unavailable", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => {
      throw new Error("connect ECONNREFUSED");
    }));

    const response = await proxyPondsApiRequest(
      new Request("http://localhost:3000/api/ponds"),
      {
        backendBaseUrl: "http://localhost:4000"
      }
    );

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({
      ok: false,
      error: {
        code: "PONDS_LOCAL_PROXY_UNAVAILABLE",
        message:
          "Ponds local proxy could not reach http://localhost:4000. Start the API server or update AQUAPULSE_WEB_LOCAL_API_BACKEND_URL."
      }
    });
  });
});
