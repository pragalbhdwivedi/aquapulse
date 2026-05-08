import { Inject, Injectable } from "@nestjs/common";
import type {
  AiApprovalNoteDraftResponse,
  AiAlertsExplainResponse,
  AiDashboardQueryResponse,
  AiHandoverGenerateResponse,
  AiIncidentsDraftResponse,
  AiPondsSummarizeResponse,
  AlertExplanationFeedbackRecord,
  AiResponseRecord,
  AiTextRewriteResponse,
  ApiSuccessEnvelope,
  ListResponse
} from "@aquapulse/types";
import type {
  CreateAiDto,
  ApprovalNoteDraftDto,
  DashboardQueryDto,
  DraftIncidentDto,
  AlertExplanationFeedbackDto,
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
import { OperatorAssistanceService } from "../services/operator-assistance.service";

@Injectable()
export class AiApplicationService {
  constructor(
    @Inject(AI_REPOSITORY) private readonly aiRepository: AiRepositoryPort,
    private readonly alertExplanationService?: AlertExplanationService,
    private readonly operatorAssistanceService?: OperatorAssistanceService
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
        headline: "Placeholder AI explanation for an alert.",
        summary: "Placeholder AI explanation for an alert.",
        explanation: "Placeholder AI explanation for an alert.",
        explanationHindi:
          _input.outputMode === "bilingual"
            ? "Hindi draft: Placeholder AI explanation for an alert."
            : undefined,
        recommendations: ["Inspect aeration equipment.", "Repeat the reading."],
        likelyCauses: [],
        likelyFactors: [],
        recommendedChecks: [],
        immediateChecks: [],
        suggestedActions: [],
        escalationConsiderations: ["Escalate only after fresh verification if the alert condition remains high severity."],
        observedFacts: ["The placeholder explanation only sees the requested alert identifier."],
        confidenceNote: "Confidence is limited because no alert explanation service was attached.",
        advisoryDisclaimer:
          "Advisory only. AquaPulse will not mutate alerts from explanation output.",
        missingInformationNote: "No attached alert explanation service was available, so the response stayed on the bounded fallback placeholder path.",
        metadata: {
          mode: "fallback",
          advisoryOnly: true,
          generatedAt: "2026-04-16T00:00:00.000Z",
          modelLabel: "gpt-5-nano",
          sourceLabel: "application_service_placeholder",
          usedLiveOpenAi: false,
          providerPath: "deterministic_fallback",
          output: {
            outputMode: _input.outputMode ?? "english_only",
            primaryLanguage: "english",
            bilingual: _input.outputMode === "bilingual",
            tone: _input.tone ?? "operator"
          }
        },
        cache: {
          status: "fresh",
          cachedAt: "2026-04-16T00:00:00.000Z",
          freshness: "fresh",
          explanationVersion: "v1",
          generation: "fresh_fallback"
        }
      }
    };
  }
  async submitAlertExplanationFeedback(
    _input: AlertExplanationFeedbackDto
  ): Promise<ApiSuccessEnvelope<AlertExplanationFeedbackRecord>> {
    if (this.alertExplanationService) {
      return { ok: true, data: await this.alertExplanationService.submitFeedback(_input) };
    }

    return {
      ok: true,
      data: {
        alertId: _input.alertId,
        value: _input.value,
        note: _input.note?.trim() || undefined,
        submittedAt: "2026-04-16T00:00:00.000Z",
        generation: _input.explanation.cache.generation,
        sourceMode: _input.explanation.metadata.mode
      }
    };
  }
  async summarizePond(_input: SummarizePondDto): Promise<ApiSuccessEnvelope<AiPondsSummarizeResponse>> {
    if (this.operatorAssistanceService) {
      return { ok: true, data: await this.operatorAssistanceService.generateDailyFarmSummary(_input) };
    }

    return {
      ok: true,
      data: {
        summary: "Fallback daily farm summary is available, but no operator assistance service was attached.",
        summaryHindi:
          _input.outputMode === "bilingual"
            ? "Hindi draft: Fallback daily farm summary is available, but no operator assistance service was attached."
            : undefined,
        highlights: ["No operator-assistance service is attached.", "The bounded fallback path stayed active."],
        headline: "Fallback daily farm summary is available, but no operator assistance service was attached.",
        headlineHindi:
          _input.outputMode === "bilingual"
            ? "Hindi draft: Fallback daily farm summary is available, but no operator assistance service was attached."
            : undefined,
        keyHighlights: ["No operator-assistance service is attached.", "The bounded fallback path stayed active."],
        openIssues: [],
        pendingActions: [],
        pondsNeedingAttention: [],
        missingDataNotes: [],
        metadata: {
          taskLabel: "daily_farm_summary",
          advisoryOnly: true,
          generatedAt: "2026-05-08T00:00:00.000Z",
          mode: "fallback",
          modelLabel: "gpt-5-nano",
          sourceLabel: "application_service_placeholder",
          usedLiveOpenAi: false,
          providerPath: "deterministic_fallback",
          output: {
            outputMode: _input.outputMode ?? "english_only",
            primaryLanguage: "english",
            bilingual: _input.outputMode === "bilingual",
            tone: _input.tone ?? "operator"
          }
        },
        audit: {
          requestId: "placeholder-request",
          responseId: "placeholder-response",
          requestLoggedAt: "2026-05-08T00:00:00.000Z",
          responseLoggedAt: "2026-05-08T00:00:00.000Z",
          fallbackUsed: true
        }
      }
    };
  }
  async generateHandover(_input: GenerateHandoverDto): Promise<ApiSuccessEnvelope<AiHandoverGenerateResponse>> {
    if (this.operatorAssistanceService) {
      return { ok: true, data: await this.operatorAssistanceService.generateShiftHandover(_input) };
    }

    return {
      ok: true,
      data: {
        summary: "Fallback shift handover is available, but no operator assistance service was attached.",
        summaryHindi:
          _input.outputMode === "bilingual"
            ? "Hindi draft: Fallback shift handover is available, but no operator assistance service was attached."
            : undefined,
        actionItems: ["Review open issues manually."],
        headline: "Fallback shift handover is available, but no operator assistance service was attached.",
        headlineHindi:
          _input.outputMode === "bilingual"
            ? "Hindi draft: Fallback shift handover is available, but no operator assistance service was attached."
            : undefined,
        completedThisShift: [],
        pendingItems: ["Review open issues manually."],
        priorityPonds: [],
        watchItems: [],
        nextShiftNote: "Start with the open issues queue and confirm fresh readings manually.",
        nextShiftNoteHindi:
          _input.outputMode === "bilingual"
            ? "Hindi draft: Start with the open issues queue and confirm fresh readings manually."
            : undefined,
        metadata: {
          taskLabel: "shift_handover_generate",
          advisoryOnly: true,
          generatedAt: "2026-05-08T00:00:00.000Z",
          mode: "fallback",
          modelLabel: "gpt-5-nano",
          sourceLabel: "application_service_placeholder",
          usedLiveOpenAi: false,
          providerPath: "deterministic_fallback",
          output: {
            outputMode: _input.outputMode ?? "english_only",
            primaryLanguage: "english",
            bilingual: _input.outputMode === "bilingual",
            tone: _input.tone ?? "operator"
          }
        },
        audit: {
          requestId: "placeholder-request",
          responseId: "placeholder-response",
          requestLoggedAt: "2026-05-08T00:00:00.000Z",
          responseLoggedAt: "2026-05-08T00:00:00.000Z",
          fallbackUsed: true
        }
      }
    };
  }
  async rewriteText(input: RewriteTextDto): Promise<ApiSuccessEnvelope<AiTextRewriteResponse>> {
    if (this.operatorAssistanceService) {
      return { ok: true, data: await this.operatorAssistanceService.rewriteIncident(input) };
    }

    return {
      ok: true,
      data: {
        originalText: input.originalText,
        rewrittenEnglish: input.originalText.trim(),
        rewrittenHindi:
          input.outputMode === "bilingual"
            ? `हिंदी मसौदा: ${input.originalText.trim()}`
            : undefined,
        tone: input.tone,
        missingInformationNote:
          input.originalText.trim().length < 12
            ? "The source note is very short, so the rewrite may still need manual clarification."
            : undefined,
        metadata: {
          taskLabel: "incident_rewrite",
          advisoryOnly: true,
          generatedAt: "2026-05-08T00:00:00.000Z",
          mode: "fallback",
          modelLabel: "gpt-5-nano",
          sourceLabel: "application_service_placeholder",
          usedLiveOpenAi: false,
          providerPath: "deterministic_fallback",
          output: {
            outputMode: input.outputMode ?? "english_only",
            primaryLanguage: "english",
            bilingual: input.outputMode === "bilingual",
            tone: input.tone
          }
        },
        audit: {
          requestId: "placeholder-request",
          responseId: "placeholder-response",
          requestLoggedAt: "2026-05-08T00:00:00.000Z",
          responseLoggedAt: "2026-05-08T00:00:00.000Z",
          fallbackUsed: true
        }
      }
    };
  }
  async queryDashboard(_input: DashboardQueryDto): Promise<ApiSuccessEnvelope<AiDashboardQueryResponse>> {
    if (this.operatorAssistanceService) {
      return { ok: true, data: await this.operatorAssistanceService.generateDashboardAssistant(_input) };
    }

    return {
      ok: true,
      data: {
        headline: "Fallback dashboard assistant is available, but no operator assistance service was attached.",
        headlineHindi:
          _input.outputMode === "bilingual"
            ? "Hindi draft: Fallback dashboard assistant is available, but no operator assistance service was attached."
            : undefined,
        directAnswer:
          "Review the open alert queue and pending tasks manually because no operator assistance service is attached.",
        directAnswerHindi:
          _input.outputMode === "bilingual"
            ? "Hindi draft: Review the open alert queue and pending tasks manually because no operator assistance service is attached."
            : undefined,
        priorityItems: [],
        supportingFacts: [],
        recommendedNextChecks: ["Review the open alert queue manually.", "Confirm fresh pond readings manually."],
        answer:
          "Review the open alert queue and pending tasks manually because no operator assistance service is attached.",
        relatedMetrics: ["open_alerts", "pending_tasks"],
        metadata: {
          taskLabel: "dashboard_assistant_query",
          advisoryOnly: true,
          generatedAt: "2026-05-08T00:00:00.000Z",
          mode: "fallback",
          modelLabel: "gpt-5-nano",
          sourceLabel: "application_service_placeholder",
          usedLiveOpenAi: false,
          providerPath: "deterministic_fallback",
          output: {
            outputMode: _input.outputMode ?? "english_only",
            primaryLanguage: "english",
            bilingual: _input.outputMode === "bilingual",
            tone: _input.tone ?? "operator"
          }
        },
        audit: {
          requestId: "placeholder-request",
          responseId: "placeholder-response",
          requestLoggedAt: "2026-05-08T00:00:00.000Z",
          responseLoggedAt: "2026-05-08T00:00:00.000Z",
          fallbackUsed: true
        }
      }
    };
  }
  async draftIncident(_input: DraftIncidentDto): Promise<ApiSuccessEnvelope<AiIncidentsDraftResponse>> { return { ok: true, data: { draftTitle: "Placeholder incident draft", draftBody: "This is a placeholder incident draft." } }; }
  async draftApprovalNote(
    input: ApprovalNoteDraftDto
  ): Promise<ApiSuccessEnvelope<AiApprovalNoteDraftResponse>> {
    if (this.operatorAssistanceService) {
      return { ok: true, data: await this.operatorAssistanceService.generateApprovalNoteDraft(input) };
    }

    return {
      ok: true,
      data: {
        headline: "Fallback approval note draft is available, but no operator assistance service was attached.",
        draftNote:
          "Pending manual review. Verify the linked operational context before using this draft in any approval or escalation workflow.",
        draftNoteHindi:
          input.outputMode === "bilingual"
            ? "मैनुअल समीक्षा लंबित है। किसी भी अनुमोदन या एस्केलेशन उपयोग से पहले संबंधित संदर्भ की पुष्टि करें।"
            : undefined,
        rationaleSummary: "No operator assistance service was attached, so the bounded fallback draft stayed active.",
        suggestedNextChecks: ["Review the linked record manually.", "Confirm the latest status before using this draft."],
        reviewRequired: true,
        metadata: {
          taskLabel: "approval_note_draft",
          advisoryOnly: true,
          generatedAt: "2026-05-08T00:00:00.000Z",
          mode: "fallback",
          modelLabel: "gpt-5-nano",
          sourceLabel: "application_service_placeholder",
          usedLiveOpenAi: false,
          providerPath: "deterministic_fallback",
          output: {
            outputMode: input.outputMode ?? "english_only",
            primaryLanguage: "english",
            bilingual: input.outputMode === "bilingual",
            tone: input.tone ?? "formal"
          }
        },
        audit: {
          requestId: "placeholder-request",
          responseId: "placeholder-response",
          requestLoggedAt: "2026-05-08T00:00:00.000Z",
          responseLoggedAt: "2026-05-08T00:00:00.000Z",
          fallbackUsed: true
        }
      }
    };
  }
}
