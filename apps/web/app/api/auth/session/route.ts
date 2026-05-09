import { proxyAuthApiRequest } from "@web/server/auth-local-proxy";

export async function GET(request: Request) {
  return proxyAuthApiRequest(request);
}
