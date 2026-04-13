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

const aiRecord: AiResponseRecord = {
  id: "ai-response-1",
  createdAt: "2026-04-13T00:00:00.000Z",
  updatedAt: "2026-04-13T00:00:00.000Z",
  requestId: "ai-request-1",
  status: "draft",
  outputText: "Placeholder AI output",
  model: "gpt-placeholder"
};

const aiRequest: AiRequestRecord = {
  id: "ai-request-1",
  createdAt: "2026-04-13T00:00:00.000Z",
  updatedAt: "2026-04-13T00:00:00.000Z",
  requestType: "dashboard_query",
  requestedBy: "user-1",
  inputPayload: { question: "What needs attention today?" },
  status: "completed"
};

const aiFeedback: AiFeedbackRecord = {
  id: "ai-feedback-1",
  createdAt: "2026-04-13T00:00:00.000Z",
  updatedAt: "2026-04-13T00:00:00.000Z",
  responseId: "ai-response-1",
  rating: "positive",
  comment: "Useful summary",
  submittedBy: "user-1"
};

const aiPromptTemplate: AiPromptTemplateRecord = {
  id: "ai-template-1",
  createdAt: "2026-04-13T00:00:00.000Z",
  updatedAt: "2026-04-13T00:00:00.000Z",
  key: "dashboard.summary",
  label: "Dashboard Summary",
  promptText: "Summarize the day's highest-priority issues.",
  version: 1,
  status: "active"
};

const aiActionDraft: AiActionDraftRecord = {
  id: "ai-action-draft-1",
  createdAt: "2026-04-13T00:00:00.000Z",
  updatedAt: "2026-04-13T00:00:00.000Z",
  responseId: "ai-response-1",
  resourceType: "alert",
  resourceId: "alert-1",
  title: "Inspect aeration equipment",
  body: "Inspect the aeration equipment around pond 1.",
  status: "draft"
};

@Injectable()
export class InMemoryAiRepository implements AiRepositoryPort {
  async create(_input: CreateAiDto): Promise<AiResponseRecord> {
    return aiRecord;
  }

  async update(_id: string, _input: UpdateAiDto): Promise<AiResponseRecord> {
    return aiRecord;
  }

  async getById(_id: string): Promise<AiResponseRecord> {
    return aiRecord;
  }

  async list(_query: AiResponseLogQueryContract): Promise<ListResponse<AiResponseRecord>> {
    return { items: [aiRecord], page: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 } };
  }

  async saveRequestRecord(record: AiRequestRecord): Promise<AiRequestRecord> {
    return record;
  }

  async saveResponseRecord(record: AiResponseRecord): Promise<AiResponseRecord> {
    return record;
  }

  async listRequests(_query: AiRequestLogQueryContract): Promise<ListResponse<AiRequestRecord>> {
    return { items: [aiRequest], page: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 } };
  }

  async saveFeedbackRecord(record: AiFeedbackRecord): Promise<AiFeedbackRecord> {
    return record;
  }

  async listFeedback(_query: AiFeedbackQueryContract): Promise<ListResponse<AiFeedbackRecord>> {
    return { items: [aiFeedback], page: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 } };
  }

  async getPromptTemplateByKey(key: string): Promise<AiPromptTemplateRecord | null> {
    return key === aiPromptTemplate.key ? aiPromptTemplate : null;
  }

  async listPromptTemplates(_query: AiPromptTemplateQueryContract): Promise<ListResponse<AiPromptTemplateRecord>> {
    return { items: [aiPromptTemplate], page: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 } };
  }

  async saveActionDraft(record: AiActionDraftRecord): Promise<AiActionDraftRecord> {
    return record;
  }

  async listActionDrafts(_query: AiActionDraftQueryContract): Promise<ListResponse<AiActionDraftRecord>> {
    return { items: [aiActionDraft], page: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 } };
  }
}
