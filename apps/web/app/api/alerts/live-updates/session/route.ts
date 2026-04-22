import { createAlertsLiveUpdatesBootstrapEnvelope } from "@web/server/alerts-live-updates-bootstrap";

export async function GET(request: Request) {
  const response = createAlertsLiveUpdatesBootstrapEnvelope(request);

  return Response.json(response, {
    headers: {
      "cache-control": "no-store"
    }
  });
}
