import type {
  ApiSuccessEnvelope,
  ListResponse,
  PondSummary
} from "@aquapulse/types";
import { describe, expect, it, vi } from "vitest";
import { createRepositoriesFromConfig } from "../repositories";

function jsonResponse<TBody>(body: TBody) {
  return {
    status: 200,
    async json() {
      return body;
    }
  } as Response;
}

describe("Ponds opt-in HTTP runtime", () => {
  it("keeps default runtime mock-backed while allowing ponds-only fetch HTTP mode when explicitly enabled", async () => {
    const requests: Array<{ method?: string; url: string }> = [];
    const pond: PondSummary = {
      id: "pond-1",
      name: "North Nursery",
      code: "NN-01",
      farmId: "farm-1",
      kind: "pond",
      status: "active",
      createdAt: "2026-04-21T10:00:00.000Z",
      updatedAt: "2026-04-21T10:00:00.000Z"
    };

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method ?? (input instanceof Request ? input.method : undefined);
      requests.push({ method, url });

      if (url.endsWith("/api/ponds?page=1&pageSize=20&status=active")) {
        return jsonResponse<ApiSuccessEnvelope<ListResponse<PondSummary>>>({
          ok: true,
          data: {
            items: [pond],
            page: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 }
          }
        });
      }

      if (url.endsWith("/api/ponds/pond-1?id=pond-1") || url.endsWith("/api/ponds/pond-1")) {
        return jsonResponse<ApiSuccessEnvelope<PondSummary>>({
          ok: true,
          data: pond
        });
      }

      throw new Error(`Unhandled fetch request: ${url}`);
    });

    vi.stubGlobal("fetch", fetchMock);

    const defaultRepositories = createRepositoriesFromConfig({
      mode: "mock",
      enablePlaceholderHttp: false,
      enableFetchHttp: false,
      pondsMode: "inherit"
    });
    const httpRepositories = createRepositoriesFromConfig({
      mode: "mock",
      enablePlaceholderHttp: false,
      enableFetchHttp: true,
      pondsMode: "http"
    });

    const [defaultList, httpList, detail] = await Promise.all([
      defaultRepositories.ponds.list({ page: 1, pageSize: 20, status: "active" }),
      httpRepositories.ponds.list({ page: 1, pageSize: 20, status: "active" }),
      httpRepositories.ponds.getById("pond-1")
    ]);

    expect(defaultList.data.items[0]?.id).toBe("pond-1");
    expect(httpList.data.items[0]?.id).toBe("pond-1");
    expect(detail.data.id).toBe("pond-1");
    expect(requests.some((request) => request.url.startsWith("/api/ponds"))).toBe(true);
  });
});
