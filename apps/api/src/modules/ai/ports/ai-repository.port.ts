import type {
  AiAlertsExplainResponse,
  AiActionDraftRecord,
  AiFeedbackRecord,
  AiPromptTemplateRecord,
  AiRequestRecord,
  AiResponseRecord,
  AlertExplanationFeedbackRecord,
  ListResponse
} from "@aquapulse/types";
import type { CreateAiDto, UpdateAiDto } from "../dto";
import type {
  AiActionDraftQueryContract,
  AiFeedbackQueryContract,
  AiPromptTemplateQueryContract,
  AiRequestLogQueryContract,
  AiResponseLogQueryContract
} from "../query-contracts/ai-query.contract";

export const AI_REPOSITORY = Symbol("AI_REPOSITORY");

export interface AlertExplanationFeedbackPersistenceRecord {
  readonly id: string;
  readonly alertId: string;
  readonly aiResponseId?: string;
  readonly aiRequestId?: string;
  readonly submittedBy?: string;
  readonly value: AlertExplanationFeedbackRecord["value"];
  readonly note?: string;
  readonly explanation?: AiAlertsExplainResponse;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface AiRepositoryPort {
  create(input: CreateAiDto): Promise<AiResponseRecord>;
  update(id: string, input: UpdateAiDto): Promise<AiResponseRecord>;
  getById(id: string): Promise<AiResponseRecord>;
  list(query: AiResponseLogQueryContract): Promise<ListResponse<AiResponseRecord>>;
  saveRequestRecord(record: AiRequestRecord): Promise<AiRequestRecord>;
  saveResponseRecord(record: AiResponseRecord): Promise<AiResponseRecord>;
  listRequests(query: AiRequestLogQueryContract): Promise<ListResponse<AiRequestRecord>>;
  saveFeedbackRecord(record: AiFeedbackRecord): Promise<AiFeedbackRecord>;
  saveAlertExplanationFeedbackRecord(
    record: AlertExplanationFeedbackPersistenceRecord
  ): Promise<AlertExplanationFeedbackPersistenceRecord>;
  listFeedback(query: AiFeedbackQueryContract): Promise<ListResponse<AiFeedbackRecord>>;
  getPromptTemplateByKey(key: string): Promise<AiPromptTemplateRecord | null>;
  listPromptTemplates(query: AiPromptTemplateQueryContract): Promise<ListResponse<AiPromptTemplateRecord>>;
  saveActionDraft(record: AiActionDraftRecord): Promise<AiActionDraftRecord>;
  listActionDrafts(query: AiActionDraftQueryContract): Promise<ListResponse<AiActionDraftRecord>>;
}
