import { proxyWaterQualityApiRequest } from "@web/server/water-quality-local-proxy";

export async function GET(request: Request) {
  return proxyWaterQualityApiRequest(request);
}

export async function POST(request: Request) {
  return proxyWaterQualityApiRequest(request);
}

export async function PATCH(request: Request) {
  return proxyWaterQualityApiRequest(request);
}
