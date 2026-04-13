import { Injectable } from "@nestjs/common";
import type {
  AiActionDraftRecord,
  AiFeedbackRecord,
  AiPromptTemplateRecord,
  AiRequestRecord,
  AiResponseRecord,
  ListResponse
} from "@aquapulse/types";
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
  readonly input_payload: Record<string, unknown>;
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

function mapAiRequestRowToDomain(row: AiRequestRow): AiRequestRecord {
  return {
    id: row.id,
    requestType: row.request_type,
    requestedBy: row.requested_by,
    inputPayload: row.input_payload,
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

@Injectable()
export class PostgresAiRepository implements AiRepositoryPort {
  async create(_input: CreateAiDto): Promise<AiResponseRecord> {
    return mapAiResponseRowToDomain({
      id: "ai-response-1",
      request_id: "ai-request-1",
      status: "draft",
      output_text: "Placeholder AI output",
      model: "gpt-placeholder",
      created_at: "2026-04-13T00:00:00.000Z",
      updated_at: "2026-04-13T00:00:00.000Z"
    });
  }

  async update(_id: string, _input: UpdateAiDto): Promise<AiResponseRecord> {
    return this.create({} as CreateAiDto);
  }

  async getById(_id: string): Promise<AiResponseRecord> {
    return this.create({} as CreateAiDto);
  }

  async list(_query: AiResponseLogQueryContract): Promise<ListResponse<AiResponseRecord>> {
    return { items: [await this.getById("ai-response-1")], page: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 } };
  }

  async saveRequestRecord(record: AiRequestRecord): Promise<AiRequestRecord> {
    return record;
  }

  async saveResponseRecord(record: AiResponseRecord): Promise<AiResponseRecord> {
    return record;
  }

  async listRequests(_query: AiRequestLogQueryContract): Promise<ListResponse<AiRequestRecord>> {
    return {
      items: [mapAiRequestRowToDomain({
        id: "ai-request-1",
        request_type: "dashboard_query",
        requested_by: "user-1",
        input_payload: { question: "What needs attention today?" },
        status: "completed",
        created_at: "2026-04-13T00:00:00.000Z",
        updated_at: "2026-04-13T00:00:00.000Z"
      })],
      page: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 }
    };
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
}
