import { afterEach, describe, expect, it, vi } from "vitest";
import { GET as bootstrapGet } from "../../app/api/alerts/live-updates/session/route";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json"
    }
  });
}

describe("Alerts live updates bootstrap route", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("proxies the bounded live-updates bootstrap request through the local alerts bridge", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        expect(String(input)).toBe("http://localhost:4000/api/alerts/live-updates/session");
        expect(init?.method).toBe("GET");

        const headers = new Headers(init?.headers);
        expect(headers.get("x-aquapulse-local-proxy")).toBeNull();

        return jsonResponse({
          ok: true,
          data: {
            requested: true,
            enabled: true,
            subscriptionTransport: "local_proxy_bootstrap",
            credentialMode: "ephemeral_ticket",
            targetLabel: "/api/alerts/live-updates/session",
            webSocketUrl: "ws://localhost:4000/ws/alerts?subscription_ticket=test-ticket",
            ticketIssued: true,
            ticketExpiresAt: "2026-04-22T10:00:45.000Z",
            subscriptionAuthState: "authenticated",
            authMode: "keycloak",
            forwardedAuthPresent: true,
            forwardingSource: "env_token",
            warnings: []
          }
        });
      })
    );

    const response = await bootstrapGet(
      new Request("http://localhost:3000/api/alerts/live-updates/session")
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("x-aquapulse-local-proxy")).toBe("local");
    expect(await response.json()).toEqual({
      ok: true,
      data: {
        requested: true,
        enabled: true,
        subscriptionTransport: "local_proxy_bootstrap",
        credentialMode: "ephemeral_ticket",
        targetLabel: "/api/alerts/live-updates/session",
        webSocketUrl: "ws://localhost:4000/ws/alerts?subscription_ticket=test-ticket",
        ticketIssued: true,
        ticketExpiresAt: "2026-04-22T10:00:45.000Z",
        subscriptionAuthState: "authenticated",
        authMode: "keycloak",
        forwardedAuthPresent: true,
        forwardingSource: "env_token",
        warnings: []
      }
    });
  });
});
