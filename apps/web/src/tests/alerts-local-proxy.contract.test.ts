import { afterEach, describe, expect, it, vi } from "vitest";
import { GET as alertsGet } from "../../app/api/alerts/route";
import { POST as alertsCatchAllPost } from "../../app/api/alerts/[...segments]/route";
import {
  buildAlertsProxyTargetUrl,
  proxyAlertsApiRequest,
  readAlertsLocalProxyConfig
} from "../server/alerts-local-proxy";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json"
    }
  });
}

describe("Alerts local API proxy", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("builds local backend targets with safe defaults", () => {
    const request = new Request("http://localhost:3000/api/alerts?page=1&pageSize=20");
    const config = readAlertsLocalProxyConfig({});

    expect(config.backendBaseUrl).toBe("http://localhost:4000");
    expect(buildAlertsProxyTargetUrl(request, config)).toBe(
      "http://localhost:4000/api/alerts?page=1&pageSize=20"
    );
  });

  it("proxies alerts list requests through the Next route bridge", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      expect(String(input)).toBe("http://localhost:4000/api/alerts?page=1&pageSize=20");
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

    const response = await alertsGet(
      new Request("http://localhost:3000/api/alerts?page=1&pageSize=20")
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

  it("proxies action requests and preserves the body payload", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      expect(String(input)).toBe("http://localhost:4000/api/alerts/alert-1/acknowledge");
      expect(init?.method).toBe("POST");
      expect(init?.body).toBeInstanceOf(ArrayBuffer);
      return jsonResponse({
        ok: true,
        data: { id: "alert-1", status: "acknowledged" }
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    const response = await alertsCatchAllPost(
      new Request("http://localhost:3000/api/alerts/alert-1/acknowledge", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({ note: "Local proxy note." })
      })
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      ok: true,
      data: { id: "alert-1", status: "acknowledged" }
    });
  });

  it("can proxy directly through the shared helper", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({ ok: true, data: { totalAlerts: 1 } })
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await proxyAlertsApiRequest(
      new Request("http://localhost:3000/api/alerts/summary?page=1&pageSize=20")
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, data: { totalAlerts: 1 } });
  });
});
