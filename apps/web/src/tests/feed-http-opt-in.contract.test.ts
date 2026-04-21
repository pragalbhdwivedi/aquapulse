import type {
  ApiSuccessEnvelope,
  FeedEntry,
  ListResponse
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

describe("Feed opt-in HTTP runtime", () => {
  it("keeps default runtime mock-backed while allowing feed-only fetch HTTP mode when explicitly enabled", async () => {
    const requests: Array<{ method?: string; url: string; body?: unknown }> = [];
    const entry: FeedEntry = {
      id: "feed-1",
      pondId: "pond-1",
      batchId: "batch-1",
      feedType: "Starter Feed",
      quantityKg: 18,
      fedAt: "2026-04-21T10:00:00.000Z",
      createdAt: "2026-04-21T10:00:00.000Z",
      updatedAt: "2026-04-21T10:00:00.000Z"
    };

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method ?? (input instanceof Request ? input.method : undefined);
      let body: Record<string, unknown> | undefined;

      if (typeof init?.body === "string") {
        body = JSON.parse(init.body) as Record<string, unknown>;
      } else if (input instanceof Request) {
        const rawBody = await input.clone().text();
        body = rawBody ? (JSON.parse(rawBody) as Record<string, unknown>) : undefined;
      }

      requests.push({ method, url, body });

      if (url.endsWith("/api/feed?page=1&pageSize=20&pondId=pond-1")) {
        return jsonResponse<ApiSuccessEnvelope<ListResponse<FeedEntry>>>({
          ok: true,
          data: {
            items: [entry],
            page: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 }
          }
        });
      }

      if (url.endsWith("/api/feed/feed-1?id=feed-1") || url.endsWith("/api/feed/feed-1")) {
        return jsonResponse<ApiSuccessEnvelope<FeedEntry>>({
          ok: true,
          data: entry
        });
      }

      if (url.endsWith("/api/feed/feed-2") && method === "PATCH") {
        return jsonResponse<ApiSuccessEnvelope<FeedEntry>>({
          ok: true,
          data: {
            ...entry,
            id: "feed-2",
            feedType: (body?.feedType as string | undefined) ?? "Finisher Feed",
            quantityKg: (body?.quantityKg as number | undefined) ?? 46,
            updatedAt: "2026-04-21T11:00:00.000Z"
          }
        });
      }

      if (url.endsWith("/api/feed")) {
        return jsonResponse<ApiSuccessEnvelope<FeedEntry>>({
          ok: true,
          data: {
            ...entry,
            id: "feed-2",
            feedType: body?.feedType ?? entry.feedType,
            quantityKg: body?.quantityKg ?? entry.quantityKg,
            fedAt: body?.fedAt ?? entry.fedAt,
            createdAt: body?.fedAt ?? entry.createdAt,
            updatedAt: body?.fedAt ?? entry.updatedAt
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
      feedMode: "inherit"
    });
    const httpRepositories = createRepositoriesFromConfig({
      mode: "mock",
      enablePlaceholderHttp: false,
      enableFetchHttp: true,
      feedMode: "http"
    });

    const [defaultList, httpList, detail, created, updated] = await Promise.all([
      defaultRepositories.feed.list({ page: 1, pageSize: 20, pondId: "pond-1" }),
      httpRepositories.feed.list({ page: 1, pageSize: 20, pondId: "pond-1" }),
      httpRepositories.feed.getById("feed-1"),
      httpRepositories.feed.create({
        pondId: "pond-1",
        batchId: "batch-1",
        feedType: "Grower Feed",
        quantityKg: 42,
        fedAt: "2026-04-21T10:30:00.000Z"
      }),
      httpRepositories.feed.update("feed-2", {
        feedType: "Finisher Feed",
        quantityKg: 46
      })
    ]);

    expect(defaultList.data.items[0]?.pondId).toBe("pond-1");
    expect(httpList.data.items[0]?.id).toBe("feed-1");
    expect(detail.data.id).toBe("feed-1");
    expect(created.data.id).toBe("feed-2");
    expect(updated.data.feedType).toBe("Finisher Feed");
    expect(requests.some((request) => request.url.startsWith("/api/feed"))).toBe(true);
  });
});
