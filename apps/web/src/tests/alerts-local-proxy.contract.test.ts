import { afterEach, describe, expect, it, vi } from "vitest";
import { GET as alertsGet } from "../../app/api/alerts/route";
import { POST as alertsCatchAllPost } from "../../app/api/alerts/[...segments]/route";
import { POST as aiExplainPost } from "../../app/api/ai/alerts/explain/route";
import { POST as aiExplainFeedbackPost } from "../../app/api/ai/alerts/explain/[...segments]/route";
import {
  buildAlertsProxyTargetUrl,
  proxyAiAlertsApiRequest,
  proxyAlertsApiRequest,
  readAlertsLocalProxyConfig
} from "../server/alerts-local-proxy";
import { proxyLocalApiRequest } from "../server/local-api-proxy";

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

  it("falls back to the default local backend when the configured target is malformed", () => {
    const config = readAlertsLocalProxyConfig({
      AQUAPULSE_WEB_LOCAL_API_BACKEND_URL: "not-a-url"
    });

    expect(config.backendBaseUrl).toBe("http://localhost:4000");
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

  it("proxies AI explanation requests through the local bridge", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      expect(String(input)).toBe("http://localhost:4000/api/ai/alerts/explain");
      expect(init?.method).toBe("POST");
      return jsonResponse({
        ok: true,
        data: {
          summary: "Bridge explanation",
          explanation: "Bridge explanation body",
          recommendations: [],
          likelyCauses: [],
          recommendedChecks: [],
          suggestedActions: [],
          confidenceNote: "placeholder",
          advisoryDisclaimer: "Advisory only",
          metadata: {
            mode: "fallback",
            advisoryOnly: true,
            generatedAt: "2026-04-16T09:00:00.000Z",
            modelLabel: "gpt-5-nano",
            sourceLabel: "proxy_test",
            usedLiveOpenAi: false
          },
          cache: {
            status: "fresh",
            cachedAt: "2026-04-16T09:00:00.000Z",
            freshness: "fresh",
            explanationVersion: "v1",
            generation: "fresh_fallback"
          }
        }
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    const response = await aiExplainPost(
      new Request("http://localhost:3000/api/ai/alerts/explain", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({ alertId: "alert-1" })
      })
    );

    expect(response.status).toBe(200);
    expect((await response.json()).ok).toBe(true);
  });

  it("preserves AI explanation feedback validation errors through the local bridge", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse(
        {
          ok: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "value is required",
            fieldErrors: { value: "Required" }
          }
        },
        422
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await aiExplainFeedbackPost(
      new Request("http://localhost:3000/api/ai/alerts/explain/feedback", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({ alertId: "alert-1" })
      })
    );

    expect(response.status).toBe(422);
    expect(await response.json()).toEqual({
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "value is required",
        fieldErrors: { value: "Required" }
      }
    });
  });

  it("preserves backend validation errors without flattening the payload", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse(
        {
          ok: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "assignedTo is required",
            fieldErrors: { assignedTo: "Required" }
          }
        },
        422
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await alertsCatchAllPost(
      new Request("http://localhost:3000/api/alerts/alert-1/assign", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({})
      })
    );

    expect(response.status).toBe(422);
    expect(await response.json()).toEqual({
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "assignedTo is required",
        fieldErrors: { assignedTo: "Required" }
      }
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

  it("forwards a bounded bearer token through the shared local proxy helper", async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      const headers = new Headers(init?.headers);

      expect(headers.get("authorization")).toBe("Bearer local-forwarded-token");
      expect(headers.get("x-aquapulse-auth-forwarded")).toBe("present");
      expect(headers.get("x-aquapulse-auth-forwarding-source")).toBe("env_token");

      return jsonResponse({ ok: true, data: { forwarded: true } });
    });
    vi.stubGlobal("fetch", fetchMock);

    const response = await proxyLocalApiRequest(
      new Request("http://localhost:3000/api/alerts/summary"),
      { backendBaseUrl: "http://localhost:4000" },
      {
        unavailableCode: "TEST_PROXY_UNAVAILABLE",
        unavailableMessage: () => "proxy unavailable"
      },
      {
        bearerToken: "local-forwarded-token",
        tokenCookieName: "aquapulse_auth_token"
      }
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, data: { forwarded: true } });
  });

  it("returns a developer-friendly 502 response when the backend is unavailable", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => {
      throw new Error("connect ECONNREFUSED");
    }));

    const response = await proxyAlertsApiRequest(
      new Request("http://localhost:3000/api/alerts"),
      {
        backendBaseUrl: "http://localhost:4000"
      }
    );

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({
      ok: false,
      error: {
        code: "ALERTS_LOCAL_PROXY_UNAVAILABLE",
        message:
          "Alerts local proxy could not reach http://localhost:4000. Start the API server or update AQUAPULSE_WEB_LOCAL_API_BACKEND_URL."
      }
    });
  });

  it("returns a developer-friendly 502 response when the AI alerts backend is unavailable", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => {
      throw new Error("connect ECONNREFUSED");
    }));

    const response = await proxyAiAlertsApiRequest(
      new Request("http://localhost:3000/api/ai/alerts/explain", {
        method: "POST"
      }),
      {
        backendBaseUrl: "http://localhost:4000"
      }
    );

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({
      ok: false,
      error: {
        code: "AI_ALERTS_LOCAL_PROXY_UNAVAILABLE",
        message:
          "AI alerts local proxy could not reach http://localhost:4000. Start the API server or update AQUAPULSE_WEB_LOCAL_API_BACKEND_URL."
      }
    });
  });
});
