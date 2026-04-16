import type {
  AiActionDraftRecord,
  AiFeedbackRecord,
  AiPromptTemplateRecord,
  AiRequestRecord,
  AiResponseRecord,
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

export interface AiRepositoryPort {
  create(input: CreateAiDto): Promise<AiResponseRecord>;
  update(id: string, input: UpdateAiDto): Promise<AiResponseRecord>;
  getById(id: string): Promise<AiResponseRecord>;
  list(query: AiResponseLogQueryContract): Promise<ListResponse<AiResponseRecord>>;
  saveRequestRecord(record: AiRequestRecord): Promise<AiRequestRecord>;
  saveResponseRecord(record: AiResponseRecord): Promise<AiResponseRecord>;
  listRequests(query: AiRequestLogQueryContract): Promise<ListResponse<AiRequestRecord>>;
  saveFeedbackRecord(record: AiFeedbackRecord): Promise<AiFeedbackRecord>;
  listFeedback(query: AiFeedbackQueryContract): Promise<ListResponse<AiFeedbackRecord>>;
  getPromptTemplateByKey(key: string): Promise<AiPromptTemplateRecord | null>;
  listPromptTemplates(query: AiPromptTemplateQueryContract): Promise<ListResponse<AiPromptTemplateRecord>>;
  saveActionDraft(record: AiActionDraftRecord): Promise<AiActionDraftRecord>;
  listActionDrafts(query: AiActionDraftQueryContract): Promise<ListResponse<AiActionDraftRecord>>;
}
