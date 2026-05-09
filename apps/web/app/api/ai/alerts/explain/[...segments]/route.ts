import { proxyAiAlertsApiRequest } from "@web/server/alerts-local-proxy";

export async function GET(request: Request) {
  return proxyAiAlertsApiRequest(request);
}

export async function POST(request: Request) {
  return proxyAiAlertsApiRequest(request);
}

export async function PATCH(request: Request) {
  return proxyAiAlertsApiRequest(request);
}
