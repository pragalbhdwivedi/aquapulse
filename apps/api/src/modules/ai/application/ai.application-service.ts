import { Injectable } from "@nestjs/common";
import type {
  AiAlertsExplainResponse,
  AiDashboardQueryResponse,
  AiHandoverGenerateResponse,
  AiIncidentsDraftResponse,
  AiPondsSummarizeResponse,
  AiResponseRecord,
  AiTextRewriteResponse,
  ApiSuccessEnvelope,
  ListResponse
} from "@aquapulse/types";
import type {
  CreateAiDto,
  DashboardQueryDto,
  DraftIncidentDto,
  ExplainAlertDto,
  GenerateHandoverDto,
  QueryAiDto,
  RewriteTextDto,
  SummarizePondDto,
  UpdateAiDto
} from "../dto";

const aiRecord: AiResponseRecord = {
  id: "ai-response-1",
  createdAt: "2026-04-13T00:00:00.000Z",
  updatedAt: "2026-04-13T00:00:00.000Z",
  requestId: "ai-request-1",
  status: "draft",
  outputText: "Placeholder AI output",
  model: "gpt-placeholder"
};

@Injectable()
export class AiApplicationService {
  async create(_input: CreateAiDto): Promise<ApiSuccessEnvelope<AiResponseRecord>> { return { ok: true, data: aiRecord }; }
  async update(_id: string, _input: UpdateAiDto): Promise<ApiSuccessEnvelope<AiResponseRecord>> { return { ok: true, data: aiRecord }; }
  async list(_query: QueryAiDto): Promise<ApiSuccessEnvelope<ListResponse<AiResponseRecord>>> { return { ok: true, data: { items: [aiRecord], page: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 } } }; }
  async getById(_id: string): Promise<ApiSuccessEnvelope<AiResponseRecord>> { return { ok: true, data: aiRecord }; }
  async explainAlert(_input: ExplainAlertDto): Promise<ApiSuccessEnvelope<AiAlertsExplainResponse>> { return { ok: true, data: { explanation: "Placeholder AI explanation for an alert.", recommendations: ["Inspect aeration equipment.", "Repeat the reading."] } }; }
  async summarizePond(_input: SummarizePondDto): Promise<ApiSuccessEnvelope<AiPondsSummarizeResponse>> { return { ok: true, data: { summary: "Placeholder pond summary.", highlights: ["Water quality stable.", "One open alert."] } }; }
  async generateHandover(_input: GenerateHandoverDto): Promise<ApiSuccessEnvelope<AiHandoverGenerateResponse>> { return { ok: true, data: { summary: "Placeholder handover summary.", actionItems: ["Check alert queue.", "Confirm next feed run."] } }; }
  async rewriteText(input: RewriteTextDto): Promise<ApiSuccessEnvelope<AiTextRewriteResponse>> { return { ok: true, data: { rewrittenText: `[placeholder] ${input.text}` } }; }
  async queryDashboard(_input: DashboardQueryDto): Promise<ApiSuccessEnvelope<AiDashboardQueryResponse>> { return { ok: true, data: { answer: "Placeholder dashboard answer.", relatedMetrics: ["open_alerts", "active_ponds"] } }; }
  async draftIncident(_input: DraftIncidentDto): Promise<ApiSuccessEnvelope<AiIncidentsDraftResponse>> { return { ok: true, data: { draftTitle: "Placeholder incident draft", draftBody: "This is a placeholder incident draft." } }; }
}
