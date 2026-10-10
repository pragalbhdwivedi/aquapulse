import { afterEach, describe, expect, it, vi } from "vitest";
import { proxyFarmingRequest } from "../server/farming-proxy";
afterEach(() => vi.unstubAllGlobals());
describe("farming same-origin proxy", () => {
  it("supports browser authority when Next uses a different internal host", async () => {
    const fetchImpl = vi.fn(async () => Response.json({ ok: true, data: {} }));
    vi.stubGlobal("fetch", fetchImpl);
    const response = await proxyFarmingRequest(
      new Request("http://localhost:3000/api/farming/activities", {
        method: "POST",
        headers: { host: "127.0.0.1:3000", origin: "http://127.0.0.1:3000" },
        body: "{}",
      }),
    );
    expect(response.status).toBe(200);
    expect(fetchImpl).toHaveBeenCalledOnce();
    expect(response.headers.get("cache-control")).toBe("no-store");
  });
  it("blocks cross-site writes before the API is called", async () => {
    const fetchImpl = vi.fn();
    vi.stubGlobal("fetch", fetchImpl);
    const response = await proxyFarmingRequest(
      new Request("http://localhost:3000/api/farming/activities", {
        method: "POST",
        headers: { origin: "https://attacker.example" },
        body: "{}",
      }),
    );
    expect(response.status).toBe(403);
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
