import { Inject, Injectable, NotFoundException, Optional } from "@nestjs/common";
import type {
  AiApprovalNoteDraftResponse,
  AiAlertsExplainResponse,
  AiDashboardQueryResponse,
  AiHandoverGenerateResponse,
  AiIncidentsDraftResponse,
  AiPondsSummarizeResponse,
  AiRequestRecord,
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
import { createNotFoundResponse } from "../../../common/api/response-mapper";
import { AlertsApplicationService } from "../../alerts/application/alerts.application-service";

interface AiHistoryRequesterScope {
  readonly id: string;
  readonly provider: "keycloak" | "local";
}

function shouldScopeAiHistoryByRequester(
  requester: AiHistoryRequesterScope | undefined
): requester is AiHistoryRequesterScope & { readonly provider: "keycloak" } {
  return requester?.provider === "keycloak" && requester.id.trim().length > 0;
}

function parseAiOutputText(outputText: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(outputText) as unknown;
    if (typeof parsed === "object" && parsed !== null) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    // Keep the bounded history view readable even when older records are plain text.
  }

  return null;
}

function toProviderMode(
  parsedOutput: Record<string, unknown> | null
): AiResponseRecord["providerMode"] {
  const metadata = parsedOutput?.metadata;
  if (typeof metadata !== "object" || metadata === null) {
    return "unknown";
  }

  if ("usedLiveOpenAi" in metadata && (metadata as { usedLiveOpenAi?: unknown }).usedLiveOpenAi === true) {
    return "provider_backed";
  }

  if ("mode" in metadata) {
    return (metadata as { mode?: unknown }).mode === "fallback" ? "fallback" : "provider_backed";
  }

  return "unknown";
}

function toProviderPath(
  parsedOutput: Record<string, unknown> | null
): AiResponseRecord["providerPath"] {
  const metadata = parsedOutput?.metadata;
  if (typeof metadata !== "object" || metadata === null) {
    return undefined;
  }

  const providerPath = (metadata as { providerPath?: unknown }).providerPath;
  return providerPath === "deterministic_fallback" || providerPath === "openai_responses_api"
    ? providerPath
    : undefined;
}

function toOutputPreview(parsedOutput: Record<string, unknown> | null, outputText: string): string {
  const previewCandidateKeys = [
    "headline",
    "summary",
    "directAnswer",
    "incidentSummary",
    "draftEnglish",
    "draftNote",
    "rewrittenEnglish",
    "explanation"
  ] as const;

  for (const key of previewCandidateKeys) {
    const value = parsedOutput?.[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }

  return outputText.trim().slice(0, 220);
}

function toRelatedRecordIds(
  requestRecord: AiRequestRecord | undefined
): string[] | undefined {
  if (!requestRecord) {
    return undefined;
  }

  const payload = requestRecord.inputPayload;
  const values = [
    payload.alertId,
    payload.recordId,
    payload.linkedRecordId,
    payload.linkedAlertId,
    payload.linkedTaskId,
    payload.linkedPondId,
    payload.pondId,
    payload.taskId
  ].filter((value): value is string => typeof value === "string" && value.trim().length > 0);

  return values.length > 0 ? [...new Set(values)] : undefined;
}

function enrichAiResponseRecord(
  record: AiResponseRecord,
  requestRecord: AiRequestRecord | undefined
): AiResponseRecord {
  const parsedOutput = parseAiOutputText(record.outputText);
  const advisoryOnly = parsedOutput?.metadata;
  return {
    ...record,
    requestType: requestRecord?.requestType,
    providerMode: toProviderMode(parsedOutput),
    providerPath: toProviderPath(parsedOutput),
    outputPreview: toOutputPreview(parsedOutput, record.outputText),
    relatedRecordIds: toRelatedRecordIds(requestRecord),
    advisoryOnly:
      typeof advisoryOnly === "object" &&
      advisoryOnly !== null &&
      "advisoryOnly" in advisoryOnly &&
      (advisoryOnly as { advisoryOnly?: unknown }).advisoryOnly === true
        ? true
        : undefined
  };
}

function filterAiHistoryRecord(
  record: AiResponseRecord,
  query: AiResponseLogQueryContract
): boolean {
  if (query.requestId && record.requestId !== query.requestId) {
    return false;
  }
  if (query.status && record.status !== query.status) {
    return false;
  }
  if (query.model && record.model !== query.model) {
    return false;
  }
  if (query.requestType && record.requestType !== query.requestType) {
    return false;
  }
  if (query.providerMode && record.providerMode !== query.providerMode) {
    return false;
  }
  if (query.relatedRecordId && !record.relatedRecordIds?.includes(query.relatedRecordId)) {
    return false;
  }
  if (query.createdAfter && Date.parse(record.createdAt) < Date.parse(query.createdAfter)) {
    return false;
  }
  if (query.createdBefore && Date.parse(record.createdAt) > Date.parse(query.createdBefore)) {
    return false;
  }
  if (query.search) {
    const haystack = `${record.outputPreview ?? ""} ${record.outputText} ${record.requestType ?? ""}`.toLowerCase();
    if (!haystack.includes(query.search.toLowerCase())) {
      return false;
    }
  }
  return true;
}

@Injectable()
export class AiApplicationService {
  constructor(
    @Inject(AI_REPOSITORY) private readonly aiRepository: AiRepositoryPort,
    private readonly alertExplanationService?: AlertExplanationService,
    private readonly operatorAssistanceService?: OperatorAssistanceService,
    @Optional() private readonly alertsApplicationService?: AlertsApplicationService
  ) {}

  async create(_input: CreateAiDto): Promise<ApiSuccessEnvelope<AiResponseRecord>> { return { ok: true, data: await this.aiRepository.create(_input) }; }
  async update(_id: string, _input: UpdateAiDto): Promise<ApiSuccessEnvelope<AiResponseRecord>> { return { ok: true, data: await this.aiRepository.update(_id, _input) }; }
  async list(
    query: AiResponseLogQueryContract,
    requester?: AiHistoryRequesterScope
  ): Promise<ApiSuccessEnvelope<ListResponse<AiResponseRecord>>> {
    const scopedQuery: AiResponseLogQueryContract = shouldScopeAiHistoryByRequester(requester)
      ? {
          ...query,
          requestedBy: requester.id
        }
      : query;
    const baseQuery = {
      ...scopedQuery,
      page: 1,
      pageSize: Math.max(scopedQuery.pageSize ?? 20, 100)
    };
    const [responses, requests] = await Promise.all([
      this.aiRepository.list(baseQuery),
      this.aiRepository.listRequests({
        page: 1,
        pageSize: baseQuery.pageSize,
        requestedBy: scopedQuery.requestedBy
      })
    ]);
    const requestMap = new Map(requests.items.map((item) => [item.id, item]));
    const filteredItems = responses.items
      .map((item) => enrichAiResponseRecord(item, requestMap.get(item.requestId)))
      .filter((item) => filterAiHistoryRecord(item, scopedQuery));
    const page = scopedQuery.page ?? 1;
    const pageSize = scopedQuery.pageSize ?? 20;
    const pagedItems = filteredItems.slice((page - 1) * pageSize, page * pageSize);

    return {
      ok: true,
      data: {
        items: pagedItems,
        page: {
          page,
          pageSize,
          totalItems: filteredItems.length,
          totalPages: Math.max(1, Math.ceil(filteredItems.length / pageSize))
        }
      }
    };
  }
  async getById(
    id: string,
    requester?: AiHistoryRequesterScope
  ): Promise<ApiSuccessEnvelope<AiResponseRecord>> {
    const record = await this.aiRepository.getById(id);
    if (shouldScopeAiHistoryByRequester(requester)) {
      const visibleRecords = await this.aiRepository.list({
        page: 1,
        pageSize: 1,
        requestId: record.requestId,
        requestedBy: requester.id
      });

      if (visibleRecords.items.length === 0) {
        throw new NotFoundException(createNotFoundResponse("AI history record").error);
      }
    }
    const requests = await this.aiRepository.listRequests({
      page: 1,
      pageSize: 100,
      requestedBy: shouldScopeAiHistoryByRequester(requester) ? requester.id : undefined
    });
    const requestRecord = requests.items.find((item) => item.id === record.requestId);
    return { ok: true, data: enrichAiResponseRecord(record, requestRecord) };
  }
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
    _input: AlertExplanationFeedbackDto,
    requester?: AiHistoryRequesterScope
  ): Promise<ApiSuccessEnvelope<AlertExplanationFeedbackRecord>> {
    await this.assertLinkedAlertVisibleForFeedback(_input.alertId, requester);

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

  private async assertLinkedAlertVisibleForFeedback(
    alertId: string,
    requester?: AiHistoryRequesterScope
  ): Promise<void> {
    if (!shouldScopeAiHistoryByRequester(requester) || !this.alertsApplicationService) {
      return;
    }

    await this.alertsApplicationService.getById(alertId, requester);
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
  async draftIncident(input: DraftIncidentDto): Promise<ApiSuccessEnvelope<AiIncidentsDraftResponse>> {
    if (this.operatorAssistanceService) {
      return { ok: true, data: await this.operatorAssistanceService.generateIncidentDraft(input) };
    }

    const tone = input.tone ?? "operator";
    const outputMode = input.outputMode ?? "english_only";
    const draftEnglish = `${input.rawOperatorNotes.trim() || "No operator note was supplied."} This draft remains advisory-only and still needs supervisor review before it is used in any incident workflow.`;

    return {
      ok: true,
      data: {
        headline: "Fallback incident draft is available, but no operator assistance service was attached.",
        incidentSummary:
          "The incident draft stayed on the bounded fallback path because no operator assistance service was attached.",
        keyFacts: [
          input.rawOperatorNotes.trim() ? `Source note: ${input.rawOperatorNotes.trim()}` : "No operator note was supplied.",
          input.severity ? `Severity hint: ${input.severity}.` : "No severity hint was supplied."
        ],
        likelyImpact:
          "Operator review is still required before this wording is used in any critical incident workflow.",
        immediateActionsSuggested: [
          "Confirm the factual details against the linked operational record before using this draft.",
          "Keep the final incident record under human review."
        ],
        escalationNeed:
          "Escalate only after an operator or supervisor verifies that the underlying condition and evidence justify it.",
        draftEnglish,
        draftHindi:
          outputMode === "bilingual"
            ? `Hindi draft: ${draftEnglish}`
            : undefined,
        missingInformationNote:
          input.rawOperatorNotes.trim().length < 24
            ? "The source note is brief, so the fallback draft stayed general."
            : undefined,
        metadata: {
          taskLabel: "incident_draft",
          advisoryOnly: true,
          generatedAt: "2026-05-09T00:00:00.000Z",
          mode: "fallback",
          modelLabel: "gpt-5-nano",
          sourceLabel: "application_service_placeholder",
          usedLiveOpenAi: false,
          providerPath: "deterministic_fallback",
          output: {
            outputMode,
            primaryLanguage: "english",
            bilingual: outputMode === "bilingual",
            tone
          }
        },
        audit: {
          requestId: "placeholder-request",
          responseId: "placeholder-response",
          requestLoggedAt: "2026-05-09T00:00:00.000Z",
          responseLoggedAt: "2026-05-09T00:00:00.000Z",
          fallbackUsed: true
        }
      }
    };
  }
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
