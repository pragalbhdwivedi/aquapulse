import type {
  ApiSuccessEnvelope,
  ListResponse,
  WaterQualityReading
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

describe("Water-quality opt-in HTTP runtime", () => {
  it("keeps default runtime mock-backed while allowing water-quality-only fetch HTTP mode when explicitly enabled", async () => {
    const requests: Array<{ method?: string; url: string; body?: unknown }> = [];
    const reading: WaterQualityReading = {
      id: "wq-1",
      pondId: "pond-1",
      recordedAt: "2026-04-21T10:00:00.000Z",
      temperatureC: 28.4,
      ph: 7.6,
      createdAt: "2026-04-21T10:00:00.000Z",
      updatedAt: "2026-04-21T10:00:00.000Z"
    };

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const body = typeof init?.body === "string" ? JSON.parse(init.body) : undefined;
      requests.push({ method: init?.method, url, body });

      if (url.endsWith("/api/water-quality?page=1&pageSize=20&pondId=pond-1")) {
        return jsonResponse<ApiSuccessEnvelope<ListResponse<WaterQualityReading>>>({
          ok: true,
          data: {
            items: [reading],
            page: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 }
          }
        });
      }

      if (url.endsWith("/api/water-quality/wq-1?id=wq-1") || url.endsWith("/api/water-quality/wq-1")) {
        return jsonResponse<ApiSuccessEnvelope<WaterQualityReading>>({
          ok: true,
          data: reading
        });
      }

      if (url.endsWith("/api/water-quality")) {
        return jsonResponse<ApiSuccessEnvelope<WaterQualityReading>>({
          ok: true,
          data: {
            ...reading,
            id: "wq-2",
            recordedAt: body?.recordedAt ?? reading.recordedAt
          }
        });
      }

      throw new Error(`Unhandled fetch request: ${url}`);
    });

    vi.stubGlobal("fetch", fetchMock);

    const defaultRepositories = createRepositoriesFromConfig({
      mode: "mock",
      enablePlaceholderHttp: false,
      enableFetchHttp: false,
      waterQualityMode: "inherit"
    });
    const httpRepositories = createRepositoriesFromConfig({
      mode: "mock",
      enablePlaceholderHttp: false,
      enableFetchHttp: true,
      waterQualityMode: "http"
    });

    const [defaultList, httpList, detail, created] = await Promise.all([
      defaultRepositories.waterQuality.listByPond("pond-1", { page: 1, pageSize: 20 }),
      httpRepositories.waterQuality.listByPond("pond-1", { page: 1, pageSize: 20 }),
      httpRepositories.waterQuality.getById("wq-1"),
      httpRepositories.waterQuality.create({
        pondId: "pond-1",
        recordedAt: "2026-04-21T10:30:00.000Z",
        temperatureC: 29.1,
        ph: 7.8
      })
    ]);

    expect(defaultList.data.items[0]?.pondId).toBe("pond-1");
    expect(httpList.data.items[0]?.id).toBe("wq-1");
    expect(detail.data.id).toBe("wq-1");
    expect(created.data.id).toBe("wq-2");
    expect(requests.some((request) => request.url.startsWith("/api/water-quality"))).toBe(true);
  });
});
