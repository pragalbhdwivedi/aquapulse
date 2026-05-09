import { proxyFeedApiRequest } from "@web/server/feed-local-proxy";

export async function GET(request: Request) {
  return proxyFeedApiRequest(request);
}

export async function POST(request: Request) {
  return proxyFeedApiRequest(request);
}

export async function PATCH(request: Request) {
  return proxyFeedApiRequest(request);
}
