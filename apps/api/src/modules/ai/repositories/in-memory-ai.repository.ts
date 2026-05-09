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

const aiRequests: AiRequestRecord[] = [
  {
    id: "ai-request-1",
    createdAt: "2026-05-09T06:00:00.000Z",
    updatedAt: "2026-05-09T06:00:00.000Z",
    requestType: "daily_farm_summary",
    requestedBy: "user-1",
    inputPayload: { generatedForDate: "2026-05-09T00:00:00.000Z", outputMode: "bilingual" },
    status: "completed"
  },
  {
    id: "ai-request-2",
    createdAt: "2026-05-09T06:10:00.000Z",
    updatedAt: "2026-05-09T06:10:00.000Z",
    requestType: "shift_handover_generate",
    requestedBy: "user-1",
    inputPayload: { shiftDate: "2026-05-09T00:00:00.000Z", shiftLabel: "Morning shift" },
    status: "completed"
  },
  {
    id: "ai-request-3",
    createdAt: "2026-05-09T06:20:00.000Z",
    updatedAt: "2026-05-09T06:20:00.000Z",
    requestType: "dashboard_assistant_query",
    requestedBy: "user-1",
    inputPayload: { question: "What needs attention first today?" },
    status: "completed"
  },
  {
    id: "ai-request-4",
    createdAt: "2026-05-09T06:30:00.000Z",
    updatedAt: "2026-05-09T06:30:00.000Z",
    requestType: "incident_rewrite",
    requestedBy: "user-1",
    inputPayload: { linkedRecordId: "alert-1", linkedRecordType: "alert" },
    status: "completed"
  },
  {
    id: "ai-request-5",
    createdAt: "2026-05-09T06:40:00.000Z",
    updatedAt: "2026-05-09T06:40:00.000Z",
    requestType: "incident_draft",
    requestedBy: "user-1",
    inputPayload: { linkedAlertId: "alert-1", linkedTaskId: "task-1", linkedPondId: "pond-1" },
    status: "completed"
  },
  {
    id: "ai-request-6",
    createdAt: "2026-05-09T06:50:00.000Z",
    updatedAt: "2026-05-09T06:50:00.000Z",
    requestType: "approval_note_draft",
    requestedBy: "user-1",
    inputPayload: { recordType: "alert", recordId: "alert-1", mode: "needs_review" },
    status: "completed"
  },
  {
    id: "ai-request-7",
    createdAt: "2026-05-09T07:00:00.000Z",
    updatedAt: "2026-05-09T07:00:00.000Z",
    requestType: "dashboard_assistant_query",
    requestedBy: "user-2",
    inputPayload: { question: "Which ponds missed updates today?" },
    status: "completed"
  }
];

const aiResponses: AiResponseRecord[] = [
  {
    id: "ai-response-1",
    createdAt: "2026-05-09T06:00:05.000Z",
    updatedAt: "2026-05-09T06:00:05.000Z",
    requestId: "ai-request-1",
    status: "completed",
    outputText: JSON.stringify({
      headline: "Farm-wide daily summary",
      summary: "Two ponds need follow-up today.",
      metadata: {
        mode: "fallback",
        advisoryOnly: true,
        providerPath: "deterministic_fallback",
        usedLiveOpenAi: false
      }
    }),
    model: "gpt-5-nano"
  },
  {
    id: "ai-response-2",
    createdAt: "2026-05-09T06:10:05.000Z",
    updatedAt: "2026-05-09T06:10:05.000Z",
    requestId: "ai-request-2",
    status: "completed",
    outputText: JSON.stringify({
      headline: "Morning shift handover",
      nextShiftNote: "Start with the open alert queue.",
      metadata: {
        mode: "fallback",
        advisoryOnly: true,
        providerPath: "deterministic_fallback",
        usedLiveOpenAi: false
      }
    }),
    model: "gpt-5-nano"
  },
  {
    id: "ai-response-3",
    createdAt: "2026-05-09T06:20:05.000Z",
    updatedAt: "2026-05-09T06:20:05.000Z",
    requestId: "ai-request-3",
    status: "completed",
    outputText: JSON.stringify({
      headline: "Dashboard assistant",
      directAnswer: "Start with North Pond 1.",
      metadata: {
        mode: "openai_nano",
        advisoryOnly: true,
        providerPath: "openai_responses_api",
        usedLiveOpenAi: true
      }
    }),
    model: "gpt-5.4"
  },
  {
    id: "ai-response-4",
    createdAt: "2026-05-09T06:30:05.000Z",
    updatedAt: "2026-05-09T06:30:05.000Z",
    requestId: "ai-request-4",
    status: "completed",
    outputText: JSON.stringify({
      rewrittenEnglish: "Operator note: Oxygen warning was rechecked.",
      metadata: {
        mode: "fallback",
        advisoryOnly: true,
        providerPath: "deterministic_fallback",
        usedLiveOpenAi: false
      }
    }),
    model: "gpt-5-nano"
  },
  {
    id: "ai-response-5",
    createdAt: "2026-05-09T06:40:05.000Z",
    updatedAt: "2026-05-09T06:40:05.000Z",
    requestId: "ai-request-5",
    status: "completed",
    outputText: JSON.stringify({
      headline: "Incident draft for North Pond 1",
      incidentSummary: "Oxygen warning was observed and rechecked.",
      draftEnglish: "Operator note: Oxygen warning was observed and rechecked.",
      metadata: {
        mode: "fallback",
        advisoryOnly: true,
        providerPath: "deterministic_fallback",
        usedLiveOpenAi: false
      }
    }),
    model: "gpt-5-nano"
  },
  {
    id: "ai-response-6",
    createdAt: "2026-05-09T06:50:05.000Z",
    updatedAt: "2026-05-09T06:50:05.000Z",
    requestId: "ai-request-6",
    status: "completed",
    outputText: JSON.stringify({
      headline: "Approval note draft",
      draftNote: "Needs supervisor review before approval.",
      metadata: {
        mode: "fallback",
        advisoryOnly: true,
        providerPath: "deterministic_fallback",
        usedLiveOpenAi: false
      }
    }),
    model: "gpt-5-nano"
  },
  {
    id: "ai-response-7",
    createdAt: "2026-05-09T07:00:05.000Z",
    updatedAt: "2026-05-09T07:00:05.000Z",
    requestId: "ai-request-7",
    status: "completed",
    outputText: JSON.stringify({
      headline: "Other operator dashboard assistant",
      directAnswer: "South Pond 2 missed a reading update.",
      metadata: {
        mode: "fallback",
        advisoryOnly: true,
        providerPath: "deterministic_fallback",
        usedLiveOpenAi: false
      }
    }),
    model: "gpt-5-nano"
  }
];

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

function paginate<TItem>(items: readonly TItem[], page = 1, pageSize = 20): ListResponse<TItem> {
  const start = (page - 1) * pageSize;
  const sliced = items.slice(start, start + pageSize);
  return {
    items: sliced,
    page: {
      page,
      pageSize,
      totalItems: items.length,
      totalPages: Math.max(1, Math.ceil(items.length / pageSize))
    }
  };
}

@Injectable()
export class InMemoryAiRepository implements AiRepositoryPort {
  async create(_input: CreateAiDto): Promise<AiResponseRecord> {
    return aiResponses[0]!;
  }

  async update(_id: string, _input: UpdateAiDto): Promise<AiResponseRecord> {
    return aiResponses[0]!;
  }

  async getById(id: string): Promise<AiResponseRecord> {
    return aiResponses.find((item) => item.id === id) ?? aiResponses[0]!;
  }

  async list(query: AiResponseLogQueryContract): Promise<ListResponse<AiResponseRecord>> {
    const items = aiResponses.filter(
      (item) => {
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
          const request = aiRequests.find((requestItem) => requestItem.id === item.requestId);
          if (request?.requestedBy !== query.requestedBy) {
            return false;
          }
        }

        return true;
      }
    );

    return paginate(items, query.page, query.pageSize);
  }

  async saveRequestRecord(record: AiRequestRecord): Promise<AiRequestRecord> {
    return record;
  }

  async saveResponseRecord(record: AiResponseRecord): Promise<AiResponseRecord> {
    return record;
  }

  async listRequests(query: AiRequestLogQueryContract): Promise<ListResponse<AiRequestRecord>> {
    const items = aiRequests.filter(
      (item) =>
        (!query.requestType || item.requestType === query.requestType) &&
        (!query.requestedBy || item.requestedBy === query.requestedBy) &&
        (!query.status || item.status === query.status)
    );

    return paginate(items, query.page, query.pageSize);
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
