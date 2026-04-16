import { Inject, Injectable } from "@nestjs/common";
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
import { AI_REPOSITORY, type AiRepositoryPort } from "../ports/ai-repository.port";
import type { AiResponseLogQueryContract } from "../query-contracts/ai-query.contract";
import { AlertExplanationService } from "../services/alert-explanation.service";

@Injectable()
export class AiApplicationService {
  constructor(
    @Inject(AI_REPOSITORY) private readonly aiRepository: AiRepositoryPort,
    private readonly alertExplanationService?: AlertExplanationService
  ) {}

  async create(_input: CreateAiDto): Promise<ApiSuccessEnvelope<AiResponseRecord>> { return { ok: true, data: await this.aiRepository.create(_input) }; }
  async update(_id: string, _input: UpdateAiDto): Promise<ApiSuccessEnvelope<AiResponseRecord>> { return { ok: true, data: await this.aiRepository.update(_id, _input) }; }
  async list(_query: AiResponseLogQueryContract): Promise<ApiSuccessEnvelope<ListResponse<AiResponseRecord>>> { return { ok: true, data: await this.aiRepository.list(_query) }; }
  async getById(_id: string): Promise<ApiSuccessEnvelope<AiResponseRecord>> { return { ok: true, data: await this.aiRepository.getById(_id) }; }
  async explainAlert(_input: ExplainAlertDto): Promise<ApiSuccessEnvelope<AiAlertsExplainResponse>> {
    if (this.alertExplanationService) {
      return { ok: true, data: await this.alertExplanationService.explainAlert(_input) };
    }

    return {
      ok: true,
      data: {
        summary: "Placeholder AI explanation for an alert.",
        explanation: "Placeholder AI explanation for an alert.",
        recommendations: ["Inspect aeration equipment.", "Repeat the reading."],
        likelyCauses: [],
        recommendedChecks: [],
        suggestedActions: [],
        confidenceNote: "Confidence is limited because no alert explanation service was attached.",
        advisoryDisclaimer:
          "Advisory only. AquaPulse will not mutate alerts from explanation output.",
        metadata: {
          mode: "fallback",
          advisoryOnly: true,
          generatedAt: "2026-04-16T00:00:00.000Z",
          modelLabel: "gpt-5-nano",
          sourceLabel: "application_service_placeholder",
          usedLiveOpenAi: false
        },
        cache: {
          status: "fresh",
          cachedAt: "2026-04-16T00:00:00.000Z",
          freshness: "fresh",
          explanationVersion: "v1"
        }
      }
    };
  }
  async summarizePond(_input: SummarizePondDto): Promise<ApiSuccessEnvelope<AiPondsSummarizeResponse>> { return { ok: true, data: { summary: "Placeholder pond summary.", highlights: ["Water quality stable.", "One open alert."] } }; }
  async generateHandover(_input: GenerateHandoverDto): Promise<ApiSuccessEnvelope<AiHandoverGenerateResponse>> { return { ok: true, data: { summary: "Placeholder handover summary.", actionItems: ["Check alert queue.", "Confirm next feed run."] } }; }
  async rewriteText(input: RewriteTextDto): Promise<ApiSuccessEnvelope<AiTextRewriteResponse>> { return { ok: true, data: { rewrittenText: `[placeholder] ${input.text}` } }; }
  async queryDashboard(_input: DashboardQueryDto): Promise<ApiSuccessEnvelope<AiDashboardQueryResponse>> { return { ok: true, data: { answer: "Placeholder dashboard answer.", relatedMetrics: ["open_alerts", "active_ponds"] } }; }
  async draftIncident(_input: DraftIncidentDto): Promise<ApiSuccessEnvelope<AiIncidentsDraftResponse>> { return { ok: true, data: { draftTitle: "Placeholder incident draft", draftBody: "This is a placeholder incident draft." } }; }
}
