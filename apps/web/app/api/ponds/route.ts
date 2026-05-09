import { proxyPondsApiRequest } from "@web/server/ponds-local-proxy";

export async function GET(request: Request) {
  return proxyPondsApiRequest(request);
}

export async function POST(request: Request) {
  return proxyPondsApiRequest(request);
}

export async function PATCH(request: Request) {
  return proxyPondsApiRequest(request);
}
