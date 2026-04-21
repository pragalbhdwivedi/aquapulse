import { afterEach, describe, expect, it, vi } from "vitest";
import { GET as waterQualityGet, POST as waterQualityPost } from "../../app/api/water-quality/route";
import { GET as waterQualityCatchAllGet, PATCH as waterQualityCatchAllPatch } from "../../app/api/water-quality/[...segments]/route";
import {
  buildWaterQualityProxyTargetUrl,
  proxyWaterQualityApiRequest,
  readWaterQualityLocalProxyConfig
} from "../server/water-quality-local-proxy";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json"
    }
  });
}

describe("Water-quality local API proxy", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("builds local backend targets with safe defaults", () => {
    const request = new Request("http://localhost:3000/api/water-quality?page=1&pageSize=20");
    const config = readWaterQualityLocalProxyConfig({});

    expect(config.backendBaseUrl).toBe("http://localhost:4000");
    expect(buildWaterQualityProxyTargetUrl(request, config)).toBe(
      "http://localhost:4000/api/water-quality?page=1&pageSize=20"
    );
  });

  it("proxies water-quality list requests through the Next route bridge", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      expect(String(input)).toBe("http://localhost:4000/api/water-quality?page=1&pageSize=20");
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

    const response = await waterQualityGet(
      new Request("http://localhost:3000/api/water-quality?page=1&pageSize=20")
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

      if (url === "http://localhost:4000/api/water-quality") {
        expect(init?.method).toBe("POST");
        expect(init?.body).toBeInstanceOf(ArrayBuffer);
        return jsonResponse({
          ok: true,
          data: {
            id: "wq-1",
            pondId: "pond-1",
            recordedAt: "2026-04-21T10:00:00.000Z",
            temperatureC: 28.4,
            ph: 7.6,
            createdAt: "2026-04-21T10:00:00.000Z",
            updatedAt: "2026-04-21T10:00:00.000Z"
          }
        });
      }

      expect(url).toBe("http://localhost:4000/api/water-quality/wq-1");
      expect(init?.method).toBe("GET");
      return jsonResponse({
        ok: true,
        data: {
          id: "wq-1",
          pondId: "pond-1",
          recordedAt: "2026-04-21T10:00:00.000Z",
          temperatureC: 28.4,
          ph: 7.6,
          createdAt: "2026-04-21T10:00:00.000Z",
          updatedAt: "2026-04-21T10:00:00.000Z"
        }
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    const createResponse = await waterQualityPost(
      new Request("http://localhost:3000/api/water-quality", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          pondId: "pond-1",
          recordedAt: "2026-04-21T10:00:00.000Z",
          temperatureC: 28.4,
          ph: 7.6
        })
      })
    );
    const detailResponse = await waterQualityCatchAllGet(
      new Request("http://localhost:3000/api/water-quality/wq-1")
    );

    expect(createResponse.status).toBe(200);
    expect((await createResponse.json()).data.id).toBe("wq-1");
    expect(detailResponse.status).toBe(200);
    expect((await detailResponse.json()).data.id).toBe("wq-1");
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
              message: "recordedAt is required",
              fieldErrors: { recordedAt: "Required" }
            }
          },
          422
        )
      )
    );

    const response = await waterQualityPost(
      new Request("http://localhost:3000/api/water-quality", {
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
        message: "recordedAt is required",
        fieldErrors: { recordedAt: "Required" }
      }
    });
  });

  it("proxies update requests through the catch-all bridge", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      expect(String(input)).toBe("http://localhost:4000/api/water-quality/wq-1");
      expect(init?.method).toBe("PATCH");
      return jsonResponse({
        ok: true,
        data: {
          id: "wq-1",
          pondId: "pond-1",
          recordedAt: "2026-04-21T10:00:00.000Z",
          temperatureC: 29.1,
          ph: 7.8,
          createdAt: "2026-04-21T10:00:00.000Z",
          updatedAt: "2026-04-21T11:00:00.000Z"
        }
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    const response = await waterQualityCatchAllPatch(
      new Request("http://localhost:3000/api/water-quality/wq-1", {
        method: "PATCH",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({ temperatureC: 29.1, ph: 7.8 })
      })
    );

    expect(response.status).toBe(200);
    expect((await response.json()).data.temperatureC).toBe(29.1);
  });

  it("returns a developer-friendly 502 response when the backend is unavailable", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => {
      throw new Error("connect ECONNREFUSED");
    }));

    const response = await proxyWaterQualityApiRequest(
      new Request("http://localhost:3000/api/water-quality"),
      {
        backendBaseUrl: "http://localhost:4000"
      }
    );

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({
      ok: false,
      error: {
        code: "WATER_QUALITY_LOCAL_PROXY_UNAVAILABLE",
        message:
          "Water-quality local proxy could not reach http://localhost:4000. Start the API server or update AQUAPULSE_WEB_LOCAL_API_BACKEND_URL."
      }
    });
  });
});
