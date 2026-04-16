import { proxyAlertsApiRequest } from "@web/server/alerts-local-proxy";

export async function GET(request: Request) {
  return proxyAlertsApiRequest(request);
}

export async function POST(request: Request) {
  return proxyAlertsApiRequest(request);
}

export async function PATCH(request: Request) {
  return proxyAlertsApiRequest(request);
}
