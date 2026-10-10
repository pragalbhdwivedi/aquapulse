import {
  proxyLocalApiRequest,
  readLocalApiProxyConfig,
} from "./local-api-proxy";
export async function proxyFarmingRequest(request: Request) {
  if (request.method !== "GET") {
    const origin = request.headers.get("origin");
    // Next may use its internal listen host in request.url. The HTTP authority
    // retains the browser-facing host (for example 127.0.0.1 versus localhost).
    const expectedHost =
      request.headers.get("host") || new URL(request.url).host;
    let matches = !origin;
    try {
      if (origin)
        matches =
          new URL(origin).host === expectedHost &&
          ["http:", "https:"].includes(new URL(origin).protocol);
    } catch {
      matches = false;
    }
    if (!matches || request.headers.get("sec-fetch-site") === "cross-site")
      return Response.json(
        { message: "Cross-origin farming writes are denied." },
        { status: 403 },
      );
  }
  const response = await proxyLocalApiRequest(
    request,
    readLocalApiProxyConfig(),
    {
      unavailableCode: "FARM_API_UNAVAILABLE",
      unavailableMessage: () =>
        "Farming API is unavailable. Captured records remain in the device outbox.",
      routePrefixHeaderValue: "farming",
    },
  );
  response.headers.set("Cache-Control", "no-store");
  return response;
}
