import { afterEach, describe, expect, it, vi } from "vitest";
import { GET as authSessionGet } from "../../app/api/auth/session/route";
import { proxyAuthApiRequest, readAuthLocalProxyConfig } from "../server/auth-local-proxy";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json"
    }
  });
}

describe("Auth local API proxy", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("uses the same safe default backend target as the other local bridges", () => {
    const config = readAuthLocalProxyConfig({});

    expect(config.backendBaseUrl).toBe("http://localhost:4000");
  });

  it("proxies current-session requests through the Next route bridge", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      expect(String(input)).toBe("http://localhost:4000/api/auth/session");
      expect(init?.method).toBe("GET");

      return jsonResponse({
        ok: true,
        data: {
          requestedMode: "local",
          effectiveMode: "local",
          availabilityState: "local_user",
          authSource: "local_default_user",
          sessionPresent: true,
          protectedReadSliceLabel: "alerts_list_read",
          protectedReadSliceEnforced: false,
          secondaryProtectedReadSliceLabel: "alerts_detail_read",
          secondaryProtectedReadSliceEnforced: false,
          tertiaryProtectedReadSliceLabel: "alerts_summary_read",
          tertiaryProtectedReadSliceEnforced: false,
          protectedOperatorSliceLabel: "alerts_lifecycle_actions",
          protectedOperatorSliceEnforced: false,
          secondaryProtectedSliceLabel: "alerts_triage_actions",
          secondaryProtectedSliceEnforced: false,
          tertiaryProtectedSliceLabel: "alerts_bulk_actions",
          tertiaryProtectedSliceEnforced: false,
          quaternaryProtectedSliceLabel: "alerts_saved_view_mutations",
          quaternaryProtectedSliceEnforced: false,
          nonAlertsOperatorAccessSummaryLabel: "non_alert_operator_update_access",
          nonAlertsOperatorAccessSummaryEnforced: false,
          nonAlertsReadAccessSummaryLabel: "non_alert_read_access",
          nonAlertsReadAccessSummaryEnforced: false,
          nonAlertsProtectedReadSliceLabel: "water_quality_detail_read",
          nonAlertsProtectedReadSliceEnforced: false,
          secondaryNonAlertsProtectedReadSliceLabel: "feed_detail_read",
          secondaryNonAlertsProtectedReadSliceEnforced: false,
          nonAlertsProtectedSliceLabel: "tasks_update",
          nonAlertsProtectedSliceEnforced: false,
          secondaryNonAlertsProtectedSliceLabel: "feed_update",
          secondaryNonAlertsProtectedSliceEnforced: false,
          tertiaryNonAlertsProtectedSliceLabel: "ponds_update",
          tertiaryNonAlertsProtectedSliceEnforced: false,
          quaternaryNonAlertsProtectedSliceLabel: "water_quality_create",
          quaternaryNonAlertsProtectedSliceEnforced: false,
          quinaryNonAlertsProtectedSliceLabel: "water_quality_update",
          quinaryNonAlertsProtectedSliceEnforced: false,
          senaryNonAlertsProtectedSliceLabel: "feed_create",
          senaryNonAlertsProtectedSliceEnforced: false,
          septenaryNonAlertsProtectedSliceLabel: "tasks_create",
          septenaryNonAlertsProtectedSliceEnforced: false,
          octonaryNonAlertsProtectedSliceLabel: "ponds_create",
          octonaryNonAlertsProtectedSliceEnforced: false,
          verificationState: "local_bypass",
          warnings: []
        }
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    const response = await authSessionGet(
      new Request("http://localhost:3000/api/auth/session")
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("x-aquapulse-auth-forwarded")).toBe("absent");
    expect(response.headers.get("x-aquapulse-auth-forwarding-source")).toBe("none");
    expect((await response.json()).data.availabilityState).toBe("local_user");
  });

  it("returns a clear 502 response when the backend auth session endpoint is unavailable", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => {
      throw new Error("connect ECONNREFUSED");
    }));

    const response = await proxyAuthApiRequest(
      new Request("http://localhost:3000/api/auth/session"),
      {
        backendBaseUrl: "http://localhost:4000"
      }
    );

    expect(response.status).toBe(502);
    expect(response.headers.get("x-aquapulse-auth-forwarded")).toBe("absent");
    expect(response.headers.get("x-aquapulse-auth-forwarding-source")).toBe("none");
    expect(await response.json()).toEqual({
      ok: false,
      error: {
        code: "AUTH_LOCAL_PROXY_UNAVAILABLE",
        message:
          "Auth local proxy could not reach http://localhost:4000. Start the API server or update AQUAPULSE_WEB_LOCAL_API_BACKEND_URL."
      }
    });
  });
});
