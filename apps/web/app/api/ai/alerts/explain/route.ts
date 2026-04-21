import { proxyAiAlertsApiRequest } from "@web/server/alerts-local-proxy";

export async function POST(request: Request) {
  return proxyAiAlertsApiRequest(request);
}
