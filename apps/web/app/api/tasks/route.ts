import { proxyTasksApiRequest } from "@web/server/tasks-local-proxy";

export async function GET(request: Request) {
  return proxyTasksApiRequest(request);
}

export async function POST(request: Request) {
  return proxyTasksApiRequest(request);
}

export async function PATCH(request: Request) {
  return proxyTasksApiRequest(request);
}
