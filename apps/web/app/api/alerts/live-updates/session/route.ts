import { proxyAlertsApiRequest } from "@web/server/alerts-local-proxy";

export async function GET(request: Request) {
  return proxyAlertsApiRequest(request);
}
