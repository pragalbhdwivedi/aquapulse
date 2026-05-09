import { createRecordingConnectionFactory, createTestDatabaseConfig } from "@aquapulse/database";
import { describe, expect, it } from "vitest";
import type { AiRequestRecord, AiResponseRecord } from "@aquapulse/types";
import { PostgresAiRepository } from "../modules/ai/adapters/postgres-ai.repository";

describe("AI persistence foundation", () => {
  it("persists AI request and response records through the postgres repository seam", async () => {
    const recordedQueries: Array<{ statement: string; params: readonly unknown[] }> = [];
    const requests = new Map<string, {
      id: string;
      request_type: AiRequestRecord["requestType"];
      requested_by?: string;
      input_payload: Record<string, unknown> | string | null;
      status: AiRequestRecord["status"];
      created_at: string;
      updated_at: string;
    }>();
    const responses = new Map<string, {
      id: string;
      request_id: string;
      status: AiResponseRecord["status"];
      output_text: string;
      model: string;
      created_at: string;
      updated_at: string;
    }>();

    const repository = PostgresAiRepository.forTesting({
      connectionFactory: createRecordingConnectionFactory(recordedQueries, {
        resolveRows(statement, params) {
          const normalized = statement.replace(/\s+/g, " ").trim().toLowerCase();

          if (normalized.startsWith("insert into ai_requests")) {
            requests.set(params[0] as string, {
              id: params[0] as string,
              request_type: params[1] as AiRequestRecord["requestType"],
              requested_by: (params[2] as string | null) ?? undefined,
              input_payload: typeof params[3] === "string" ? JSON.parse(params[3] as string) : (params[3] as Record<string, unknown> | null),
              status: params[4] as AiRequestRecord["status"],
              created_at: params[5] as string,
              updated_at: params[6] as string
            });
            return [];
          }

          if (normalized.startsWith("insert into ai_responses")) {
            responses.set(params[0] as string, {
              id: params[0] as string,
              request_id: params[1] as string,
              status: params[2] as AiResponseRecord["status"],
              output_text: params[3] as string,
              model: params[4] as string,
              created_at: params[5] as string,
              updated_at: params[6] as string
            });
            return [];
          }

          if (normalized.includes("from ai_requests")) {
            return [...requests.values()].map((row) => ({
              ...row,
              total_count: requests.size
            })) as never[];
          }

          if (normalized.includes("from ai_responses where id =")) {
            const row = responses.get(params[0] as string);
            return row ? [row] : [];
          }

          if (normalized.includes("from ai_responses")) {
            return [...responses.values()].map((row) => ({
              ...row,
              total_count: responses.size
            })) as never[];
          }

          return [];
        }
      }),
      databaseConfig: createTestDatabaseConfig()
    });

    const requestRecord: AiRequestRecord = {
      id: "ai-request-runtime-1",
      requestType: "incident_draft",
      requestedBy: "operator-1",
      inputPayload: { linkedAlertId: "alert-1", rawOperatorNotes: "Low oxygen observed" },
      status: "completed",
      createdAt: "2026-05-09T12:10:00.000Z",
      updatedAt: "2026-05-09T12:10:00.000Z"
    };
    const responseRecord: AiResponseRecord = {
      id: "ai-response-runtime-1",
      requestId: requestRecord.id,
      status: "completed",
      outputText: JSON.stringify({
        headline: "Incident draft for North Pond 1",
        metadata: {
          mode: "fallback",
          advisoryOnly: true,
          providerPath: "deterministic_fallback",
          usedLiveOpenAi: false
        }
      }),
      model: "gpt-5-nano",
      createdAt: "2026-05-09T12:10:03.000Z",
      updatedAt: "2026-05-09T12:10:03.000Z"
    };

    await repository.saveRequestRecord(requestRecord);
    await repository.saveResponseRecord(responseRecord);

    const [listedResponses, listedRequests, detail] = await Promise.all([
      repository.list({ page: 1, pageSize: 20, requestId: requestRecord.id }),
      repository.listRequests({ page: 1, pageSize: 20, requestType: "incident_draft" }),
      repository.getById("ai-response-runtime-1")
    ]);

    expect(listedResponses.items[0]?.id).toBe("ai-response-runtime-1");
    expect(listedRequests.items[0]?.id).toBe("ai-request-runtime-1");
    expect(detail.requestId).toBe("ai-request-runtime-1");
    expect(requests.get("ai-request-runtime-1")?.requested_by).toBe("operator-1");
    expect(responses.get("ai-response-runtime-1")?.model).toBe("gpt-5-nano");
    expect(recordedQueries.some((query) => query.statement.includes("insert into ai_requests"))).toBe(true);
    expect(recordedQueries.some((query) => query.statement.includes("insert into ai_responses"))).toBe(true);
  });
});
