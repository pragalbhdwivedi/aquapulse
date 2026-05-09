import { Injectable } from "@nestjs/common";
import {
  AQUAPULSE_SCHEMA_TABLES,
  PostgresDatabaseConnectionFactory,
  type DatabaseClient,
  type DatabaseConfig,
  type DatabaseConnectionFactory
} from "@aquapulse/database";
import type {
  AiActionDraftRecord,
  AiFeedbackRecord,
  AiPromptTemplateRecord,
  AiRequestRecord,
  AiResponseRecord,
  ListResponse
} from "@aquapulse/types";
import { readApiDatabaseRuntimeConfig } from "../../../common/config/database-runtime.config";
import type { CreateAiDto, UpdateAiDto } from "../dto";
import type { AiRepositoryPort } from "../ports/ai-repository.port";
import type {
  AiActionDraftQueryContract,
  AiFeedbackQueryContract,
  AiPromptTemplateQueryContract,
  AiRequestLogQueryContract,
  AiResponseLogQueryContract
} from "../query-contracts/ai-query.contract";

interface AiRequestRow {
  readonly id: string;
  readonly request_type: AiRequestRecord["requestType"];
  readonly requested_by?: string;
  readonly input_payload: Record<string, unknown> | string | null;
  readonly status: AiRequestRecord["status"];
  readonly created_at: string;
  readonly updated_at: string;
}

interface AiResponseRow {
  readonly id: string;
  readonly request_id: string;
  readonly status: AiResponseRecord["status"];
  readonly output_text: string;
  readonly model: string;
  readonly created_at: string;
  readonly updated_at: string;
}

interface AiResponseListRow extends AiResponseRow {
  readonly total_count: number;
}

interface AiRequestListRow extends AiRequestRow {
  readonly total_count: number;
}

interface AiFeedbackRow {
  readonly id: string;
  readonly response_id: string;
  readonly rating: AiFeedbackRecord["rating"];
  readonly comment?: string;
  readonly submitted_by?: string;
  readonly created_at: string;
  readonly updated_at: string;
}

interface AiPromptTemplateRow {
  readonly id: string;
  readonly key: string;
  readonly label: string;
  readonly prompt_text: string;
  readonly version: number;
  readonly status: AiPromptTemplateRecord["status"];
  readonly created_at: string;
  readonly updated_at: string;
}

interface AiActionDraftRow {
  readonly id: string;
  readonly response_id: string;
  readonly resource_type: string;
  readonly resource_id?: string;
  readonly title: string;
  readonly body: string;
  readonly status: AiActionDraftRecord["status"];
  readonly created_at: string;
  readonly updated_at: string;
}

export interface PostgresAiRepositoryDependencies {
  readonly connectionFactory?: DatabaseConnectionFactory;
  readonly databaseConfig?: DatabaseConfig;
}

function normalizeInputPayload(
  inputPayload: AiRequestRow["input_payload"]
): Record<string, unknown> {
  if (typeof inputPayload === "string") {
    try {
      const parsed = JSON.parse(inputPayload) as unknown;
      if (typeof parsed === "object" && parsed !== null) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      return {};
    }
  }

  if (typeof inputPayload === "object" && inputPayload !== null) {
    return inputPayload;
  }

  return {};
}

function mapAiRequestRowToDomain(row: AiRequestRow): AiRequestRecord {
  return {
    id: row.id,
    requestType: row.request_type,
    requestedBy: row.requested_by,
    inputPayload: normalizeInputPayload(row.input_payload),
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapAiResponseRowToDomain(row: AiResponseRow): AiResponseRecord {
  return {
    id: row.id,
    requestId: row.request_id,
    status: row.status,
    outputText: row.output_text,
    model: row.model,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapAiFeedbackRowToDomain(row: AiFeedbackRow): AiFeedbackRecord {
  return {
    id: row.id,
    responseId: row.response_id,
    rating: row.rating,
    comment: row.comment,
    submittedBy: row.submitted_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapAiPromptTemplateRowToDomain(row: AiPromptTemplateRow): AiPromptTemplateRecord {
  return {
    id: row.id,
    key: row.key,
    label: row.label,
    promptText: row.prompt_text,
    version: row.version,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapAiActionDraftRowToDomain(row: AiActionDraftRow): AiActionDraftRecord {
  return {
    id: row.id,
    responseId: row.response_id,
    resourceType: row.resource_type,
    resourceId: row.resource_id,
    title: row.title,
    body: row.body,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function createPlaceholderAiRequestRow(overrides: Partial<AiRequestRow> = {}): AiRequestRow {
  return {
    id: "ai-request-1",
    request_type: "dashboard_assistant_query",
    requested_by: "user-1",
    input_payload: { question: "What needs attention today?" },
    status: "completed",
    created_at: "2026-05-09T06:20:00.000Z",
    updated_at: "2026-05-09T06:20:00.000Z",
    ...overrides
  };
}

function createPlaceholderAiResponseRow(overrides: Partial<AiResponseRow> = {}): AiResponseRow {
  return {
    id: "ai-response-1",
    request_id: "ai-request-1",
    status: "completed",
    output_text: JSON.stringify({
      headline: "Dashboard assistant",
      directAnswer: "Start with North Pond 1.",
      metadata: {
        mode: "fallback",
        advisoryOnly: true,
        providerPath: "deterministic_fallback",
        usedLiveOpenAi: false
      }
    }),
    model: "gpt-5-nano",
    created_at: "2026-05-09T06:20:05.000Z",
    updated_at: "2026-05-09T06:20:05.000Z",
    ...overrides
  };
}

function mapAiRequestRecordToRow(record: AiRequestRecord): AiRequestRow {
  return {
    id: record.id,
    request_type: record.requestType,
    requested_by: record.requestedBy,
    input_payload: record.inputPayload,
    status: record.status,
    created_at: record.createdAt,
    updated_at: record.updatedAt
  };
}

function mapAiResponseRecordToRow(record: AiResponseRecord): AiResponseRow {
  return {
    id: record.id,
    request_id: record.requestId,
    status: record.status,
    output_text: record.outputText,
    model: record.model,
    created_at: record.createdAt,
    updated_at: record.updatedAt
  };
}

function paginateFallback<TItem>(
  items: readonly TItem[],
  page: number,
  pageSize: number
): ListResponse<TItem> {
  const start = (page - 1) * pageSize;
  const pagedItems = items.slice(start, start + pageSize);
  return {
    items: pagedItems,
    page: {
      page,
      pageSize,
      totalItems: items.length,
      totalPages: Math.max(1, Math.ceil(items.length / pageSize))
    }
  };
}

@Injectable()
export class PostgresAiRepository implements AiRepositoryPort {
  private connectionFactory: DatabaseConnectionFactory = new PostgresDatabaseConnectionFactory();
  private databaseConfig: DatabaseConfig = readApiDatabaseRuntimeConfig().database;

  private readonly fallbackRequests = new Map<string, AiRequestRecord>([
    ["ai-request-1", mapAiRequestRowToDomain(createPlaceholderAiRequestRow())]
  ]);

  private readonly fallbackResponses = new Map<string, AiResponseRecord>([
    ["ai-response-1", mapAiResponseRowToDomain(createPlaceholderAiResponseRow())]
  ]);

  static forTesting(
    overrides: PostgresAiRepositoryDependencies = {}
  ): PostgresAiRepository {
    const repository = new PostgresAiRepository();
    repository.connectionFactory = overrides.connectionFactory ?? repository.connectionFactory;
    repository.databaseConfig = overrides.databaseConfig ?? repository.databaseConfig;
    return repository;
  }

  async create(input: CreateAiDto): Promise<AiResponseRecord> {
    const now = new Date().toISOString();
    const responseId = input.id?.trim() || `ai-response-created-${Date.now()}`;
    const requestId = `ai-request-created-${responseId}`;

    await this.saveRequestRecord({
      id: requestId,
      requestType: "dashboard_assistant_query",
      requestedBy: "system",
      inputPayload: {
        source: "ai_api_create",
        note: "Placeholder create pathway preserved for bounded AI persistence foundation."
      },
      status: "completed",
      createdAt: now,
      updatedAt: now
    });

    return this.saveResponseRecord({
      id: responseId,
      requestId,
      status: "draft",
      outputText: "Placeholder AI output",
      model: "gpt-placeholder",
      createdAt: now,
      updatedAt: now
    });
  }

  async update(id: string, _input: UpdateAiDto): Promise<AiResponseRecord> {
    const existing = await this.getById(id);
    const updatedRecord: AiResponseRecord = {
      ...existing,
      updatedAt: new Date().toISOString()
    };

    return this.saveResponseRecord(updatedRecord);
  }

  async getById(id: string): Promise<AiResponseRecord> {
    try {
      const client = await this.getClient();
      try {
        const result = await client.query<AiResponseRow>(
          `
            select id, request_id, status, output_text, model, created_at, updated_at
            from ${AQUAPULSE_SCHEMA_TABLES.aiResponses}
            where id = $1
          `,
          [id]
        );

        return result.rows[0]
          ? mapAiResponseRowToDomain(result.rows[0])
          : this.fallbackResponses.get(id) ?? mapAiResponseRowToDomain(createPlaceholderAiResponseRow({ id }));
      } finally {
        await client.dispose();
      }
    } catch {
      return this.fallbackResponses.get(id) ?? mapAiResponseRowToDomain(createPlaceholderAiResponseRow({ id }));
    }
  }

  async list(query: AiResponseLogQueryContract): Promise<ListResponse<AiResponseRecord>> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const filters: string[] = [];
    const params: unknown[] = [];
    const needsRequestJoin = Boolean(query.requestedBy);

    if (query.requestId) {
      params.push(query.requestId);
      filters.push(`responses.request_id = $${params.length}`);
    }

    if (query.status) {
      params.push(query.status);
      filters.push(`responses.status = $${params.length}`);
    }

    if (query.model) {
      params.push(query.model);
      filters.push(`responses.model = $${params.length}`);
    }

    if (query.requestedBy) {
      params.push(query.requestedBy);
      filters.push(`requests.requested_by = $${params.length}`);
    }

    const whereClause = filters.length > 0 ? `where ${filters.join(" and ")}` : "";
    params.push(pageSize);
    params.push((page - 1) * pageSize);
    const limitParam = `$${params.length - 1}`;
    const offsetParam = `$${params.length}`;

    try {
      const client = await this.getClient();
      try {
        const result = await client.query<AiResponseListRow>(
          `
            select
              responses.id,
              responses.request_id,
              responses.status,
              responses.output_text,
              responses.model,
              responses.created_at,
              responses.updated_at,
              count(*) over()::int as total_count
            from ${AQUAPULSE_SCHEMA_TABLES.aiResponses} responses
            ${needsRequestJoin ? `inner join ${AQUAPULSE_SCHEMA_TABLES.aiRequests} requests on requests.id = responses.request_id` : ""}
            ${whereClause}
            order by responses.created_at desc, responses.id desc
            limit ${limitParam}
            offset ${offsetParam}
          `,
          params
        );

        const items = result.rows.map(mapAiResponseRowToDomain);
        const totalItems = result.rows[0]?.total_count ?? 0;
        return {
          items,
          page: {
            page,
            pageSize,
            totalItems,
            totalPages: Math.max(1, Math.ceil(Math.max(totalItems, 1) / pageSize))
          }
        };
      } finally {
        await client.dispose();
      }
    } catch {
      const items = [...this.fallbackResponses.values()].filter((item) => {
        if (query.requestId && item.requestId !== query.requestId) {
          return false;
        }
        if (query.status && item.status !== query.status) {
          return false;
        }
        if (query.model && item.model !== query.model) {
          return false;
        }
        if (query.requestedBy) {
          const request = this.fallbackRequests.get(item.requestId);
          if (request?.requestedBy !== query.requestedBy) {
            return false;
          }
        }
        return true;
      });

      return paginateFallback(items, page, pageSize);
    }
  }

  async saveRequestRecord(record: AiRequestRecord): Promise<AiRequestRecord> {
    const row = mapAiRequestRecordToRow(record);
    this.fallbackRequests.set(record.id, record);

    try {
      const client = await this.getClient();
      try {
        await client.query(
          `
            insert into ${AQUAPULSE_SCHEMA_TABLES.aiRequests} (
              id,
              request_type,
              requested_by,
              input_payload,
              status,
              created_at,
              updated_at
            ) values ($1, $2, $3, $4::jsonb, $5, $6, $7)
            on conflict (id) do update set
              request_type = excluded.request_type,
              requested_by = excluded.requested_by,
              input_payload = excluded.input_payload,
              status = excluded.status,
              updated_at = excluded.updated_at
          `,
          [
            row.id,
            row.request_type,
            row.requested_by ?? null,
            JSON.stringify(row.input_payload ?? {}),
            row.status,
            row.created_at,
            row.updated_at
          ]
        );
      } finally {
        await client.dispose();
      }
    } catch {
      return record;
    }

    return record;
  }

  async saveResponseRecord(record: AiResponseRecord): Promise<AiResponseRecord> {
    const row = mapAiResponseRecordToRow(record);
    this.fallbackResponses.set(record.id, record);

    try {
      const client = await this.getClient();
      try {
        await client.query(
          `
            insert into ${AQUAPULSE_SCHEMA_TABLES.aiResponses} (
              id,
              request_id,
              status,
              output_text,
              model,
              created_at,
              updated_at
            ) values ($1, $2, $3, $4, $5, $6, $7)
            on conflict (id) do update set
              request_id = excluded.request_id,
              status = excluded.status,
              output_text = excluded.output_text,
              model = excluded.model,
              updated_at = excluded.updated_at
          `,
          [
            row.id,
            row.request_id,
            row.status,
            row.output_text,
            row.model,
            row.created_at,
            row.updated_at
          ]
        );
      } finally {
        await client.dispose();
      }
    } catch {
      return record;
    }

    return record;
  }

  async listRequests(query: AiRequestLogQueryContract): Promise<ListResponse<AiRequestRecord>> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const filters: string[] = [];
    const params: unknown[] = [];

    if (query.requestType) {
      params.push(query.requestType);
      filters.push(`request_type = $${params.length}`);
    }

    if (query.requestedBy) {
      params.push(query.requestedBy);
      filters.push(`requested_by = $${params.length}`);
    }

    if (query.status) {
      params.push(query.status);
      filters.push(`status = $${params.length}`);
    }

    const whereClause = filters.length > 0 ? `where ${filters.join(" and ")}` : "";
    params.push(pageSize);
    params.push((page - 1) * pageSize);
    const limitParam = `$${params.length - 1}`;
    const offsetParam = `$${params.length}`;

    try {
      const client = await this.getClient();
      try {
        const result = await client.query<AiRequestListRow>(
          `
            select
              id,
              request_type,
              requested_by,
              input_payload,
              status,
              created_at,
              updated_at,
              count(*) over()::int as total_count
            from ${AQUAPULSE_SCHEMA_TABLES.aiRequests}
            ${whereClause}
            order by created_at desc, id desc
            limit ${limitParam}
            offset ${offsetParam}
          `,
          params
        );

        const items = result.rows.map(mapAiRequestRowToDomain);
        const totalItems = result.rows[0]?.total_count ?? 0;
        return {
          items,
          page: {
            page,
            pageSize,
            totalItems,
            totalPages: Math.max(1, Math.ceil(Math.max(totalItems, 1) / pageSize))
          }
        };
      } finally {
        await client.dispose();
      }
    } catch {
      const items = [...this.fallbackRequests.values()].filter((item) => {
        if (query.requestType && item.requestType !== query.requestType) {
          return false;
        }
        if (query.requestedBy && item.requestedBy !== query.requestedBy) {
          return false;
        }
        if (query.status && item.status !== query.status) {
          return false;
        }
        return true;
      });

      return paginateFallback(items, page, pageSize);
    }
  }

  async saveFeedbackRecord(record: AiFeedbackRecord): Promise<AiFeedbackRecord> {
    return record;
  }

  async listFeedback(_query: AiFeedbackQueryContract): Promise<ListResponse<AiFeedbackRecord>> {
    return {
      items: [mapAiFeedbackRowToDomain({
        id: "ai-feedback-1",
        response_id: "ai-response-1",
        rating: "positive",
        comment: "Useful summary",
        submitted_by: "user-1",
        created_at: "2026-04-13T00:00:00.000Z",
        updated_at: "2026-04-13T00:00:00.000Z"
      })],
      page: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 }
    };
  }

  async getPromptTemplateByKey(key: string): Promise<AiPromptTemplateRecord | null> {
    if (key !== "dashboard.summary") {
      return null;
    }

    return mapAiPromptTemplateRowToDomain({
      id: "ai-template-1",
      key: "dashboard.summary",
      label: "Dashboard Summary",
      prompt_text: "Summarize the day's highest-priority issues.",
      version: 1,
      status: "active",
      created_at: "2026-04-13T00:00:00.000Z",
      updated_at: "2026-04-13T00:00:00.000Z"
    });
  }

  async listPromptTemplates(_query: AiPromptTemplateQueryContract): Promise<ListResponse<AiPromptTemplateRecord>> {
    const template = await this.getPromptTemplateByKey("dashboard.summary");
    return {
      items: template ? [template] : [],
      page: { page: 1, pageSize: 20, totalItems: template ? 1 : 0, totalPages: 1 }
    };
  }

  async saveActionDraft(record: AiActionDraftRecord): Promise<AiActionDraftRecord> {
    return record;
  }

  async listActionDrafts(_query: AiActionDraftQueryContract): Promise<ListResponse<AiActionDraftRecord>> {
    return {
      items: [mapAiActionDraftRowToDomain({
        id: "ai-action-draft-1",
        response_id: "ai-response-1",
        resource_type: "alert",
        resource_id: "alert-1",
        title: "Inspect aeration equipment",
        body: "Inspect the aeration equipment around pond 1.",
        status: "draft",
        created_at: "2026-04-13T00:00:00.000Z",
        updated_at: "2026-04-13T00:00:00.000Z"
      })],
      page: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 }
    };
  }

  private async getClient(): Promise<DatabaseClient> {
    return this.connectionFactory.create(this.databaseConfig);
  }
}

export const POSTGRES_AI_IMPLEMENTATION_PLAN = {
  readMethods: ["getById", "list", "listRequests"],
  writeMethods: ["create", "update", "saveRequestRecord", "saveResponseRecord"],
  rowSources: ["ai_requests", "ai_responses"],
  queryNotes: [
    "persist bounded advisory-only request and response logs without widening runtime contracts",
    "keep history reads ordered newest-first and filtered by the existing repository contract"
  ],
  mappingNotes: [
    "map ai_requests and ai_responses independently into shared request/response log records",
    "leave feedback, prompt templates, and action drafts on the existing placeholder-backed path"
  ]
} as const;
