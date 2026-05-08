import { Inject, Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import type {
  AiDashboardPriorityItem,
  AiDashboardQueryRequest,
  AiDashboardQueryResponse,
  AiDashboardSupportingFact,
  AiHandoverGenerateRequest,
  AiHandoverGenerateResponse,
  AiOperatorAttentionItem,
  AiOperatorAssistanceAuditMetadata,
  AiOperatorAssistanceMetadata,
  AiPondsSummarizeRequest,
  AiPondsSummarizeResponse,
  AiRequestRecord,
  AiResponseRecord,
  AlertSummary,
  FeedEntry,
  PondSummary,
  TaskSummary,
  WaterQualityReading
} from "@aquapulse/types";
import {
  aiDashboardAssistantResponseSchema,
  aiDailyFarmSummaryResponseSchema,
  aiShiftHandoverResponseSchema
} from "@aquapulse/validation";
import { AlertsApplicationService } from "../../alerts/application/alerts.application-service";
import { FeedApplicationService } from "../../feed/application/feed.application-service";
import { PondsApplicationService } from "../../ponds/application/ponds.application-service";
import { TasksApplicationService } from "../../tasks/application/tasks.application-service";
import { WaterQualityApplicationService } from "../../water-quality/application/water-quality.application-service";
import { readOperatorAssistanceRuntimeConfig } from "../config/operator-assistance.config";
import { AI_REPOSITORY, type AiRepositoryPort } from "../ports/ai-repository.port";
import {
  type DashboardAssistantPromptPayload,
  OpenAiOperatorAssistanceClient,
  type DailyFarmSummaryPromptPayload,
  type ShiftHandoverPromptPayload
} from "./openai-operator-assistance.client";

const MAX_CONTEXT_ITEMS = 6;
const ACTIVE_PONDS_PAGE_SIZE = 50;
const HISTORY_PAGE_SIZE = 30;

interface ContextWindow {
  readonly from?: string;
  readonly to?: string;
}

interface DomainContextSnapshot {
  readonly ponds: PondSummary[];
  readonly feedEntries: FeedEntry[];
  readonly tasks: TaskSummary[];
  readonly alerts: AlertSummary[];
  readonly waterQuality: WaterQualityReading[];
}

function sortNewestFirst<TItem extends { readonly updatedAt?: string; readonly createdAt?: string }>(
  items: readonly TItem[]
): TItem[] {
  return [...items].sort((left, right) => {
    const leftTimestamp = Date.parse(left.updatedAt ?? left.createdAt ?? "");
    const rightTimestamp = Date.parse(right.updatedAt ?? right.createdAt ?? "");
    return rightTimestamp - leftTimestamp;
  });
}

function pickTopStrings(items: readonly string[], limit = MAX_CONTEXT_ITEMS): string[] {
  return items.filter((item) => item.trim().length > 0).slice(0, limit);
}

function makeIsoDayStart(dateInput: string): string {
  const value = new Date(dateInput);
  value.setUTCHours(0, 0, 0, 0);
  return value.toISOString();
}

function makeIsoDayEnd(dateInput: string): string {
  const value = new Date(dateInput);
  value.setUTCHours(23, 59, 59, 999);
  return value.toISOString();
}

function isWithinWindow(timestamp: string | undefined, window: ContextWindow): boolean {
  if (!timestamp) {
    return false;
  }

  const value = Date.parse(timestamp);
  if (Number.isNaN(value)) {
    return false;
  }

  if (window.from && value < Date.parse(window.from)) {
    return false;
  }

  if (window.to && value > Date.parse(window.to)) {
    return false;
  }

  return true;
}

function buildAttentionItems(
  ponds: readonly PondSummary[],
  waterQuality: readonly WaterQualityReading[],
  alerts: readonly AlertSummary[],
  tasks: readonly TaskSummary[]
): AiOperatorAttentionItem[] {
  const pondNameById = new Map(ponds.map((pond) => [pond.id, pond.name]));
  const items: AiOperatorAttentionItem[] = [];

  for (const alert of alerts.filter((item) => item.status === "open").slice(0, MAX_CONTEXT_ITEMS)) {
    items.push({
      pondId: alert.pondId,
      pondName: alert.pondId ? pondNameById.get(alert.pondId) ?? `Pond ${alert.pondId}` : "Farm-wide issue",
      reason: `${alert.severity} ${alert.source} alert: ${alert.title}`,
      priority: alert.severity === "critical" || alert.severity === "high" ? "high" : "medium"
    });
  }

  for (const task of tasks.filter((item) => item.status !== "done" && item.status !== "cancelled").slice(0, MAX_CONTEXT_ITEMS)) {
    if (!task.pondId) {
      continue;
    }

    items.push({
      pondId: task.pondId,
      pondName: pondNameById.get(task.pondId) ?? `Pond ${task.pondId}`,
      reason: `Open task: ${task.title}`,
      priority: task.status === "in_progress" ? "medium" : "low"
    });
  }

  const latestReadingByPond = new Map<string, WaterQualityReading>();
  for (const reading of sortNewestFirst(waterQuality)) {
    if (!latestReadingByPond.has(reading.pondId)) {
      latestReadingByPond.set(reading.pondId, reading);
    }
  }

  for (const pond of ponds) {
    const latestReading = latestReadingByPond.get(pond.id);
    if (!latestReading) {
      items.push({
        pondId: pond.id,
        pondName: pond.name,
        reason: "No recent water-quality reading is available for this pond.",
        priority: "medium"
      });
      continue;
    }

    if (
      latestReading.temperatureC === undefined ||
      latestReading.ph === undefined
    ) {
      items.push({
        pondId: pond.id,
        pondName: pond.name,
        reason: "Recent water-quality reading is missing one or more critical values.",
        priority: "medium"
      });
    }
  }

  const deduped = new Map<string, AiOperatorAttentionItem>();
  for (const item of items) {
    const key = `${item.pondId ?? "farm"}:${item.reason}`;
    if (!deduped.has(key)) {
      deduped.set(key, item);
    }
  }

  return [...deduped.values()].slice(0, MAX_CONTEXT_ITEMS);
}

function buildMissingDataNotes(
  ponds: readonly PondSummary[],
  waterQuality: readonly WaterQualityReading[],
  feedEntries: readonly FeedEntry[]
): string[] {
  const waterQualityPonds = new Set(waterQuality.map((item) => item.pondId));
  const feedPonds = new Set(feedEntries.map((item) => item.pondId));
  const notes: string[] = [];

  for (const pond of ponds) {
    if (!waterQualityPonds.has(pond.id)) {
      notes.push(`${pond.name} has no recent water-quality reading in the selected window.`);
    }
    if (!feedPonds.has(pond.id)) {
      notes.push(`${pond.name} has no recent feed entry in the selected window.`);
    }
  }

  return notes.slice(0, MAX_CONTEXT_ITEMS);
}

function buildDailySummaryMetadata(
  generatedAt: string,
  modelLabel: string,
  usedLiveOpenAi: boolean
): AiOperatorAssistanceMetadata {
  return {
    taskLabel: "daily_farm_summary",
    advisoryOnly: true,
    mode: usedLiveOpenAi ? "openai_nano" : "fallback",
    generatedAt,
    modelLabel,
    sourceLabel: usedLiveOpenAi ? "openai_operator_assistance" : "deterministic_operator_assistance_fallback",
    usedLiveOpenAi,
    providerPath: usedLiveOpenAi ? "openai_responses_api" : "deterministic_fallback"
  };
}

function buildHandoverMetadata(
  generatedAt: string,
  modelLabel: string,
  usedLiveOpenAi: boolean
): AiOperatorAssistanceMetadata {
  return {
    taskLabel: "shift_handover_generate",
    advisoryOnly: true,
    mode: usedLiveOpenAi ? "openai_nano" : "fallback",
    generatedAt,
    modelLabel,
    sourceLabel: usedLiveOpenAi ? "openai_operator_assistance" : "deterministic_operator_assistance_fallback",
    usedLiveOpenAi,
    providerPath: usedLiveOpenAi ? "openai_responses_api" : "deterministic_fallback"
  };
}

function buildDashboardMetadata(
  generatedAt: string,
  modelLabel: string,
  usedLiveOpenAi: boolean
): AiOperatorAssistanceMetadata {
  return {
    taskLabel: "dashboard_assistant_query",
    advisoryOnly: true,
    mode: usedLiveOpenAi ? "openai_nano" : "fallback",
    generatedAt,
    modelLabel,
    sourceLabel: usedLiveOpenAi ? "openai_operator_assistance" : "deterministic_operator_assistance_fallback",
    usedLiveOpenAi,
    providerPath: usedLiveOpenAi ? "openai_responses_api" : "deterministic_fallback"
  };
}

function buildLatestReadingByPond(
  waterQuality: readonly WaterQualityReading[]
): Map<string, WaterQualityReading> {
  const latestReadingByPond = new Map<string, WaterQualityReading>();

  for (const reading of sortNewestFirst(waterQuality)) {
    if (!latestReadingByPond.has(reading.pondId)) {
      latestReadingByPond.set(reading.pondId, reading);
    }
  }

  return latestReadingByPond;
}

@Injectable()
export class OperatorAssistanceService {
  private readonly runtime = readOperatorAssistanceRuntimeConfig();
  private readonly openAiClient = new OpenAiOperatorAssistanceClient({
    config: this.runtime
  });

  constructor(
    @Inject(AI_REPOSITORY) private readonly aiRepository: AiRepositoryPort,
    private readonly pondsApplicationService: PondsApplicationService,
    private readonly waterQualityApplicationService: WaterQualityApplicationService,
    private readonly alertsApplicationService: AlertsApplicationService,
    private readonly feedApplicationService: FeedApplicationService,
    private readonly tasksApplicationService: TasksApplicationService
  ) {}

  getRuntimeSummary() {
    return {
      enabled: true,
      advisoryOnly: true as const,
      mode: this.runtime.configured ? "openai_nano" as const : "fallback" as const,
      configured: this.runtime.configured,
      modelLabel: this.runtime.modelLabel,
      providerPath: this.runtime.configured ? "openai_responses_api" as const : "deterministic_fallback" as const,
      fallbackActive: !this.runtime.configured,
      supportedTasks: ["daily_farm_summary", "shift_handover_generate", "dashboard_assistant_query"] as const,
      warnings: this.runtime.warnings
    };
  }

  async generateDailyFarmSummary(
    input: AiPondsSummarizeRequest
  ): Promise<AiPondsSummarizeResponse> {
    const generatedAt = new Date().toISOString();
    const requestRecord = await this.logRequest("daily_farm_summary", {
      ...input,
      generatedAt
    });
    const contextWindow = this.resolveDailySummaryWindow(input, generatedAt);
    const context = await this.loadContext({
      pondId: input.pondId,
      window: contextWindow
    });
    const promptPayload = this.buildDailySummaryPromptPayload(input, generatedAt, context);
    const attentionItems = buildAttentionItems(
      context.ponds,
      context.waterQuality,
      context.alerts,
      context.tasks
    );
    const missingDataNotes = input.includeMissingDataSignals === false
      ? []
      : buildMissingDataNotes(context.ponds, context.waterQuality, context.feedEntries);

    let response = this.buildDailySummaryFallback(
      generatedAt,
      attentionItems,
      missingDataNotes,
      context,
      promptPayload.scopeLabel
    );

    if (this.runtime.configured) {
      try {
        const openAiResponse = await this.openAiClient.generateDailyFarmSummary(promptPayload);
        if (openAiResponse) {
          response = {
            ...openAiResponse,
            metadata: buildDailySummaryMetadata(generatedAt, this.runtime.modelLabel, true),
            audit: response.audit
          };
        }
      } catch {
        // Stay on the deterministic fallback path.
      }
    }

    const responseRecord = await this.logResponse(requestRecord.id, this.runtime.modelLabel, response);
    const withAudit = {
      ...response,
      audit: this.buildAuditMetadata(generatedAt, requestRecord.id, responseRecord.id, !this.runtime.configured || response.metadata.mode === "fallback")
    };

    return aiDailyFarmSummaryResponseSchema.parse(withAudit);
  }

  async generateShiftHandover(
    input: AiHandoverGenerateRequest
  ): Promise<AiHandoverGenerateResponse> {
    const generatedAt = new Date().toISOString();
    const requestRecord = await this.logRequest("shift_handover_generate", {
      ...input,
      generatedAt
    });
    const contextWindow = this.resolveShiftWindow(input.shiftDate);
    const context = await this.loadContext({
      pondIds: input.pondIds,
      window: contextWindow
    });
    const attentionItems = buildAttentionItems(
      context.ponds,
      context.waterQuality,
      context.alerts,
      context.tasks
    );
    const promptPayload = this.buildShiftHandoverPromptPayload(input, context, attentionItems);

    let response = this.buildShiftHandoverFallback(
      generatedAt,
      input.shiftLabel ?? "Shift handover",
      attentionItems,
      context
    );

    if (this.runtime.configured) {
      try {
        const openAiResponse = await this.openAiClient.generateShiftHandover(promptPayload);
        if (openAiResponse) {
          response = {
            ...openAiResponse,
            metadata: buildHandoverMetadata(generatedAt, this.runtime.modelLabel, true),
            audit: response.audit
          };
        }
      } catch {
        // Stay on the deterministic fallback path.
      }
    }

    const responseRecord = await this.logResponse(requestRecord.id, this.runtime.modelLabel, response);
    const withAudit = {
      ...response,
      audit: this.buildAuditMetadata(generatedAt, requestRecord.id, responseRecord.id, !this.runtime.configured || response.metadata.mode === "fallback")
    };

    return aiShiftHandoverResponseSchema.parse(withAudit);
  }

  async generateDashboardAssistant(
    input: AiDashboardQueryRequest
  ): Promise<AiDashboardQueryResponse> {
    const generatedAt = new Date().toISOString();
    const requestRecord = await this.logRequest("dashboard_assistant_query", {
      ...input,
      generatedAt
    });
    const contextWindow = this.resolveDashboardWindow(input, generatedAt);
    const context = await this.loadContext({
      pondId: input.pondId,
      window: contextWindow
    });
    const attentionItems = buildAttentionItems(
      context.ponds,
      context.waterQuality,
      context.alerts,
      context.tasks
    );
    const missingDataNotes = buildMissingDataNotes(context.ponds, context.waterQuality, context.feedEntries);
    const promptPayload = this.buildDashboardPromptPayload(input, context, attentionItems, missingDataNotes, contextWindow);

    let response = this.buildDashboardFallback(
      input,
      generatedAt,
      context,
      attentionItems,
      missingDataNotes,
      promptPayload
    );

    if (this.runtime.configured) {
      try {
        const openAiResponse = await this.openAiClient.generateDashboardAssistant(promptPayload);
        if (openAiResponse) {
          response = {
            ...openAiResponse,
            metadata: buildDashboardMetadata(generatedAt, this.runtime.modelLabel, true),
            audit: response.audit
          };
        }
      } catch {
        // Stay on the deterministic fallback path.
      }
    }

    const responseRecord = await this.logResponse(requestRecord.id, this.runtime.modelLabel, response);
    const withAudit = {
      ...response,
      audit: this.buildAuditMetadata(
        generatedAt,
        requestRecord.id,
        responseRecord.id,
        !this.runtime.configured || response.metadata.mode === "fallback"
      )
    };

    return aiDashboardAssistantResponseSchema.parse(withAudit);
  }

  private async loadContext(input: {
    readonly pondId?: string;
    readonly pondIds?: readonly string[];
    readonly window: ContextWindow;
  }): Promise<DomainContextSnapshot> {
    const [pondsResponse, alertsResponse, tasksResponse, feedResponse, waterQualityResponse] = await Promise.all([
      this.pondsApplicationService.list({
        page: 1,
        pageSize: ACTIVE_PONDS_PAGE_SIZE,
        status: "active"
      }),
      this.alertsApplicationService.list({
        page: 1,
        pageSize: HISTORY_PAGE_SIZE,
        status: "open",
        pondId: input.pondId
      }),
      this.tasksApplicationService.list({
        page: 1,
        pageSize: HISTORY_PAGE_SIZE,
        pondId: input.pondId,
        status: "todo"
      }),
      this.feedApplicationService.list({
        page: 1,
        pageSize: HISTORY_PAGE_SIZE,
        pondId: input.pondId
      }),
      this.waterQualityApplicationService.list({
        page: 1,
        pageSize: HISTORY_PAGE_SIZE,
        pondId: input.pondId
      })
    ]);

    const pondFilter = new Set(
      input.pondIds && input.pondIds.length > 0
        ? input.pondIds
        : input.pondId
          ? [input.pondId]
          : pondsResponse.data.items.map((item) => item.id)
    );
    const ponds = pondsResponse.data.items.filter((item) => pondFilter.has(item.id));
    const filterByPond = <TItem extends { readonly pondId?: string }>(items: readonly TItem[]) =>
      items.filter((item) => !item.pondId || pondFilter.has(item.pondId));

    return {
      ponds,
      alerts: filterByPond(alertsResponse.data.items),
      tasks: filterByPond(tasksResponse.data.items),
      feedEntries: filterByPond(feedResponse.data.items).filter((item) => isWithinWindow(item.fedAt, input.window)),
      waterQuality: filterByPond(waterQualityResponse.data.items).filter((item) =>
        isWithinWindow(item.recordedAt, input.window)
      )
    };
  }

  private resolveDailySummaryWindow(
    input: AiPondsSummarizeRequest,
    generatedAt: string
  ): ContextWindow {
    if (input.dateRange?.from || input.dateRange?.to) {
      return {
        from: input.dateRange.from,
        to: input.dateRange.to
      };
    }

    const dateSource = input.generatedForDate ?? generatedAt;

    return {
      from: makeIsoDayStart(dateSource),
      to: makeIsoDayEnd(dateSource)
    };
  }

  private resolveShiftWindow(shiftDate: string): ContextWindow {
    return {
      from: makeIsoDayStart(shiftDate),
      to: makeIsoDayEnd(shiftDate)
    };
  }

  private resolveDashboardWindow(
    input: AiDashboardQueryRequest,
    generatedAt: string
  ): ContextWindow {
    if (input.dateRange?.from || input.dateRange?.to) {
      return {
        from: input.dateRange.from,
        to: input.dateRange.to
      };
    }

    return {
      from: makeIsoDayStart(generatedAt),
      to: makeIsoDayEnd(generatedAt)
    };
  }

  private buildDailySummaryPromptPayload(
    input: AiPondsSummarizeRequest,
    generatedAt: string,
    context: DomainContextSnapshot
  ): DailyFarmSummaryPromptPayload {
    const attentionItems = buildAttentionItems(context.ponds, context.waterQuality, context.alerts, context.tasks);
    const missingDataNotes = input.includeMissingDataSignals === false
      ? []
      : buildMissingDataNotes(context.ponds, context.waterQuality, context.feedEntries);
    const pondsPendingUpdates = context.ponds
      .filter((pond) => !context.waterQuality.some((reading) => reading.pondId === pond.id))
      .map((pond) => pond.name)
      .slice(0, MAX_CONTEXT_ITEMS);

    return {
      taskLabel: "daily_farm_summary",
      generatedForDate: input.generatedForDate ?? generatedAt,
      scopeLabel: input.pondId
        ? `Pond ${context.ponds[0]?.name ?? input.pondId}`
        : "Farm-wide daily summary",
      pondSnapshot: {
        totalActivePonds: context.ponds.length,
        pondsPendingUpdates,
        attentionPonds: attentionItems
      },
      alerts: {
        openCount: context.alerts.length,
        criticalCount: context.alerts.filter((item) => item.severity === "critical").length,
        topOpenIssues: pickTopStrings(context.alerts.map((item) => `${item.severity} ${item.title}`))
      },
      feed: {
        recentEntries: pickTopStrings(
          context.feedEntries.map(
            (item) => `${item.feedType} ${item.quantityKg}kg at ${item.fedAt}`
          )
        )
      },
      tasks: {
        openCount: context.tasks.length,
        pendingActions: pickTopStrings(context.tasks.map((item) => item.title))
      },
      waterQuality: {
        recentSignals: pickTopStrings(
          sortNewestFirst(context.waterQuality).map(
            (item) =>
              `${item.pondId} at ${item.recordedAt}: temp ${item.temperatureC ?? "n/a"}C, pH ${item.ph ?? "n/a"}`
          )
        ),
        missingDataNotes
      }
    };
  }

  private buildShiftHandoverPromptPayload(
    input: AiHandoverGenerateRequest,
    context: DomainContextSnapshot,
    attentionItems: AiOperatorAttentionItem[]
  ): ShiftHandoverPromptPayload {
    const completedThisShift = pickTopStrings(
      context.tasks
        .filter((item) => item.status === "done")
        .map((item) => `Completed task: ${item.title}`)
    );
    const pendingItems = pickTopStrings(
      context.tasks
        .filter((item) => item.status !== "done" && item.status !== "cancelled")
        .map((item) => `Pending task: ${item.title}`)
    );
    const watchItems = pickTopStrings([
      ...context.alerts.map((item) => `${item.severity} alert still open: ${item.title}`),
      ...context.waterQuality
        .filter((item) => item.temperatureC === undefined || item.ph === undefined)
        .map((item) => `Incomplete water-quality reading for ${item.pondId} at ${item.recordedAt}`)
    ]);

    return {
      taskLabel: "shift_handover_generate",
      shiftDate: input.shiftDate,
      shiftLabel: input.shiftLabel?.trim() || "Shift handover",
      scopeLabel:
        input.pondIds && input.pondIds.length > 0
          ? `${input.pondIds.length} selected ponds`
          : "Farm-wide shift handover",
      completedThisShift: input.includeCompletedItems === false ? [] : completedThisShift,
      pendingItems,
      priorityPonds: attentionItems,
      watchItems,
      openIssues: pickTopStrings(context.alerts.map((item) => item.title))
    };
  }

  private buildDashboardPromptPayload(
    input: AiDashboardQueryRequest,
    context: DomainContextSnapshot,
    attentionItems: AiOperatorAttentionItem[],
    missingDataNotes: readonly string[],
    window: ContextWindow
  ): DashboardAssistantPromptPayload {
    const latestReadingByPond = buildLatestReadingByPond(context.waterQuality);
    const waterQualityRisks = pickTopStrings(
      context.ponds.flatMap((pond) => {
        const latest = latestReadingByPond.get(pond.id);
        if (!latest) {
          return [`${pond.name} has no recent water-quality reading in the selected window.`];
        }

        const signals: string[] = [];
        if (latest.temperatureC !== undefined && (latest.temperatureC < 24 || latest.temperatureC > 31)) {
          signals.push(`${pond.name} temperature is ${latest.temperatureC}C at ${latest.recordedAt}.`);
        }
        if (latest.ph !== undefined && (latest.ph < 6.5 || latest.ph > 8.5)) {
          signals.push(`${pond.name} pH is ${latest.ph} at ${latest.recordedAt}.`);
        }
        if (latest.temperatureC === undefined || latest.ph === undefined) {
          signals.push(`${pond.name} has an incomplete reading at ${latest.recordedAt}.`);
        }
        return signals;
      })
    );

    const feedSignals = pickTopStrings([
      ...missingDataNotes.filter((note) => note.includes("feed entry")),
      ...sortNewestFirst(context.feedEntries).map(
        (item) => `${item.pondId} logged ${item.feedType} ${item.quantityKg}kg at ${item.fedAt}.`
      )
    ]);

    return {
      taskLabel: "dashboard_assistant_query",
      question: input.question,
      scopeLabel: input.pondId ? `Pond ${context.ponds[0]?.name ?? input.pondId}` : "Farm-wide dashboard assistant",
      timeWindowLabel:
        window.from && window.to ? `${window.from} to ${window.to}` : "current operational window",
      pondsNeedingAttention: attentionItems,
      openAlerts: {
        total: context.alerts.length,
        critical: context.alerts.filter((item) => item.severity === "critical").length,
        items: pickTopStrings(context.alerts.map((item) => `${item.severity} ${item.title}`))
      },
      pendingTasks: {
        total: context.tasks.filter((item) => item.status !== "done" && item.status !== "cancelled").length,
        items: pickTopStrings(
          context.tasks
            .filter((item) => item.status !== "done" && item.status !== "cancelled")
            .map((item) => item.title)
        )
      },
      waterQualityRisks,
      staleOrMissingUpdates: pickTopStrings(missingDataNotes),
      feedSignals
    };
  }

  private buildDailySummaryFallback(
    generatedAt: string,
    attentionItems: AiOperatorAttentionItem[],
    missingDataNotes: string[],
    context: DomainContextSnapshot,
    scopeLabel: string
  ): AiPondsSummarizeResponse {
    const headline = `${scopeLabel}: ${context.alerts.length} open alerts, ${context.tasks.length} pending tasks, ${attentionItems.length} ponds needing attention.`;
    const keyHighlights = pickTopStrings([
      `${context.ponds.length} active ponds were included in this summary.`,
      `${context.waterQuality.length} recent water-quality readings were considered.`,
      `${context.feedEntries.length} recent feed entries were included.`,
      `${context.tasks.length} open tasks are still pending.`
    ]);
    const openIssues = pickTopStrings(
      context.alerts.map((item) => `${item.severity} ${item.source} alert: ${item.title}`)
    );
    const pendingActions = pickTopStrings([
      ...context.tasks
        .filter((item) => item.status !== "done" && item.status !== "cancelled")
        .map((item) => item.title),
      ...attentionItems.map((item) => `${item.pondName}: ${item.reason}`)
    ]);

    return {
      summary: headline,
      highlights: keyHighlights,
      headline,
      keyHighlights,
      openIssues,
      pendingActions,
      pondsNeedingAttention: attentionItems,
      missingDataNotes,
      metadata: buildDailySummaryMetadata(generatedAt, this.runtime.modelLabel, false),
      audit: this.buildAuditMetadata(generatedAt, "pending", "pending", true)
    };
  }

  private buildShiftHandoverFallback(
    generatedAt: string,
    shiftLabel: string,
    attentionItems: AiOperatorAttentionItem[],
    context: DomainContextSnapshot
  ): AiHandoverGenerateResponse {
    const completedThisShift = pickTopStrings(
      context.feedEntries.map(
        (item) => `Feed recorded for ${item.pondId}: ${item.feedType} ${item.quantityKg}kg at ${item.fedAt}`
      )
    );
    const pendingItems = pickTopStrings(
      context.tasks
        .filter((item) => item.status !== "done" && item.status !== "cancelled")
        .map((item) => item.title)
    );
    const watchItems = pickTopStrings([
      ...context.alerts.map((item) => `${item.severity} alert open: ${item.title}`),
      ...attentionItems.map((item) => `${item.pondName}: ${item.reason}`)
    ]);
    const nextShiftNote = pendingItems.length > 0
      ? `Start with ${pendingItems[0]} and review ${attentionItems[0]?.pondName ?? "the highest-priority pond"} first.`
      : "Start by reviewing open alerts and confirming fresh readings for the top attention ponds.";
    const headline = `${shiftLabel}: ${pendingItems.length} pending items and ${attentionItems.length} priority ponds need follow-up.`;

    return {
      summary: headline,
      actionItems: pendingItems,
      headline,
      completedThisShift,
      pendingItems,
      priorityPonds: attentionItems,
      watchItems,
      nextShiftNote,
      metadata: buildHandoverMetadata(generatedAt, this.runtime.modelLabel, false),
      audit: this.buildAuditMetadata(generatedAt, "pending", "pending", true)
    };
  }

  private buildDashboardFallback(
    input: AiDashboardQueryRequest,
    generatedAt: string,
    context: DomainContextSnapshot,
    attentionItems: AiOperatorAttentionItem[],
    missingDataNotes: readonly string[],
    promptPayload: DashboardAssistantPromptPayload
  ): AiDashboardQueryResponse {
    const question = input.question.trim().toLowerCase();
    const pondNameById = new Map(context.ponds.map((pond) => [pond.id, pond.name]));
    const latestReadingByPond = buildLatestReadingByPond(context.waterQuality);
    const pendingTasks = context.tasks.filter((item) => item.status !== "done" && item.status !== "cancelled");
    const openCriticalAlerts = context.alerts.filter((item) => item.status === "open" && item.severity === "critical");
    const staleUpdatePonds = context.ponds.filter((pond) => !latestReadingByPond.has(pond.id));
    const waterQualityRiskItems = context.ponds.flatMap((pond) => {
      const latest = latestReadingByPond.get(pond.id);
      if (!latest) {
        return [];
      }

      const details: AiDashboardPriorityItem[] = [];
      if (latest.temperatureC !== undefined && (latest.temperatureC < 24 || latest.temperatureC > 31)) {
        details.push({
          pondId: pond.id,
          pondName: pond.name,
          label: `${pond.name} temperature risk`,
          detail: `Latest recorded temperature is ${latest.temperatureC}C at ${latest.recordedAt}.`,
          priority: "high"
        });
      }
      if (latest.ph !== undefined && (latest.ph < 6.5 || latest.ph > 8.5)) {
        details.push({
          pondId: pond.id,
          pondName: pond.name,
          label: `${pond.name} pH risk`,
          detail: `Latest recorded pH is ${latest.ph} at ${latest.recordedAt}.`,
          priority: "high"
        });
      }
      if (latest.temperatureC === undefined || latest.ph === undefined) {
        details.push({
          pondId: pond.id,
          pondName: pond.name,
          label: `${pond.name} incomplete reading`,
          detail: `Recent water-quality data is incomplete at ${latest.recordedAt}.`,
          priority: "medium"
        });
      }
      return details;
    });

    let headline = "Dashboard assistant: bounded operational read-only answer";
    let directAnswer = `Start with ${attentionItems[0]?.pondName ?? "the open operational queue"} and review the highest-priority alert and pending task first.`;
    let priorityItems: AiDashboardPriorityItem[] = attentionItems.map((item) => ({
      pondId: item.pondId,
      pondName: item.pondName,
      label: `${item.pondName} needs attention`,
      detail: item.reason,
      priority: item.priority
    }));
    let supportingFacts: AiDashboardSupportingFact[] = [
      {
        label: "Open alerts",
        detail: `${context.alerts.length} open alerts are in scope for this answer.`,
        severity: context.alerts.some((item) => item.severity === "critical") ? "high" : "medium"
      },
      {
        label: "Pending tasks",
        detail: `${pendingTasks.length} pending tasks remain in scope.`,
        severity: pendingTasks.length > 0 ? "medium" : "low"
      }
    ];
    let recommendedNextChecks = pickTopStrings([
      "Review the highest-severity open alert and confirm whether fresh readings are already available.",
      "Confirm pending tasks on the highest-priority ponds before the next round.",
      ...missingDataNotes
    ]);
    let missingInformationNote: string | undefined;

    if (question.includes("missed updates")) {
      headline = "Ponds missing recent updates";
      directAnswer =
        staleUpdatePonds.length > 0
          ? `${staleUpdatePonds.map((pond) => pond.name).join(", ")} missed recent water-quality updates in the selected window.`
          : "No active ponds are missing recent water-quality updates in the selected window.";
      priorityItems = staleUpdatePonds.map((pond) => ({
        pondId: pond.id,
        pondName: pond.name,
        label: `${pond.name} missing update`,
        detail: "No recent water-quality reading was available in the selected window.",
        priority: "high"
      }));
      supportingFacts = staleUpdatePonds.map((pond) => ({
        pondId: pond.id,
        pondName: pond.name,
        label: "Missing water-quality update",
        detail: `${pond.name} has no recent water-quality reading in scope.`,
        severity: "high"
      }));
      recommendedNextChecks = pickTopStrings([
        "Confirm whether a fresh water-quality reading should have been logged today.",
        "Check whether the pond also missed its feed record for the same window.",
        ...missingDataNotes
      ]);
    } else if (question.includes("critical alert")) {
      headline = "Ponds with open critical alerts";
      directAnswer =
        openCriticalAlerts.length > 0
          ? `Open critical alerts are currently affecting ${openCriticalAlerts.map((item) => pondNameById.get(item.pondId ?? "") ?? item.title).join(", ")}.`
          : "No open critical alerts were found in the bounded dashboard context.";
      priorityItems = openCriticalAlerts.map((alert) => ({
        pondId: alert.pondId,
        pondName: alert.pondId ? pondNameById.get(alert.pondId) : undefined,
        label: alert.title,
        detail: `${alert.source} alert remains open at ${alert.updatedAt}.`,
        priority: "high"
      }));
      supportingFacts = context.alerts.map((alert) => ({
        pondId: alert.pondId,
        pondName: alert.pondId ? pondNameById.get(alert.pondId) : undefined,
        label: `${alert.severity} alert`,
        detail: `${alert.title} is still ${alert.status}.`,
        severity: alert.severity === "critical" || alert.severity === "high" ? "high" : "medium"
      }));
      recommendedNextChecks = pickTopStrings([
        "Verify whether the latest alert condition still holds with a fresh manual check.",
        "Review linked pending tasks before the next operator round."
      ]);
    } else if (question.includes("pending task")) {
      headline = "Pending operator tasks";
      directAnswer =
        pendingTasks.length > 0
          ? `${pendingTasks.length} pending tasks still require follow-up, led by ${pendingTasks[0]?.title}.`
          : "No pending tasks are currently open in the bounded dashboard context.";
      priorityItems = pendingTasks.map((task) => ({
        pondId: task.pondId,
        pondName: task.pondId ? pondNameById.get(task.pondId) : undefined,
        label: task.title,
        detail: `Task status is ${task.status}.`,
        priority: task.status === "in_progress" ? "high" : "medium"
      }));
      supportingFacts = pendingTasks.map((task) => ({
        pondId: task.pondId,
        pondName: task.pondId ? pondNameById.get(task.pondId) : undefined,
        label: "Pending task",
        detail: `${task.title} is still ${task.status}.`,
        severity: task.status === "in_progress" ? "high" : "medium"
      }));
      recommendedNextChecks = pickTopStrings([
        "Confirm whether any pending task overlaps with an open alert.",
        "Prioritize tasks tied to ponds already flagged for attention."
      ]);
    } else if (
      question.includes("low do") ||
      question.includes("poor reading") ||
      question.includes("poor readings")
    ) {
      headline = "Recent water-quality risk signals";
      directAnswer =
        waterQualityRiskItems.length > 0
          ? `${waterQualityRiskItems[0]?.pondName ?? "One pond"} has the strongest recent water-quality risk signal in the selected window.`
          : "No strong pH or temperature anomalies were found in the bounded dashboard context.";
      priorityItems = waterQualityRiskItems;
      supportingFacts = waterQualityRiskItems.map((item) => ({
        pondId: item.pondId,
        pondName: item.pondName,
        label: item.label,
        detail: item.detail,
        severity: item.priority
      }));
      recommendedNextChecks = pickTopStrings([
        "Repeat the latest reading on the highest-risk pond before taking any operational action.",
        "Check whether the same pond also has open alerts or pending tasks."
      ]);
      if (question.includes("low do")) {
        missingInformationNote =
          "Dissolved oxygen is not part of the bounded v1 dashboard assistant context yet, so this answer used available temperature, pH, alert, and task signals only.";
      }
    } else if (question.includes("summarize")) {
      headline = "Important operational issues today";
      directAnswer = `The main issues today are ${context.alerts.length} open alerts, ${pendingTasks.length} pending tasks, and ${attentionItems.length} ponds needing attention.`;
      supportingFacts = [
        ...context.alerts.map((alert) => ({
          pondId: alert.pondId,
          pondName: alert.pondId ? pondNameById.get(alert.pondId) : undefined,
          label: `${alert.severity} alert`,
          detail: alert.title,
          severity:
            alert.severity === "critical" || alert.severity === "high"
              ? ("high" as const)
              : ("medium" as const)
        })),
        ...missingDataNotes.map((note) => ({
          label: "Missing data signal",
          detail: note,
          severity: "medium" as const
        }))
      ].slice(0, MAX_CONTEXT_ITEMS);
    }

    priorityItems = priorityItems.slice(0, MAX_CONTEXT_ITEMS);
    supportingFacts = supportingFacts.slice(0, MAX_CONTEXT_ITEMS);
    const relatedMetrics = pickTopStrings([
      "open_alerts",
      openCriticalAlerts.length > 0 ? "critical_alerts" : "",
      pendingTasks.length > 0 ? "pending_tasks" : "",
      staleUpdatePonds.length > 0 ? "ponds_missing_updates" : "",
      waterQualityRiskItems.length > 0 ? "water_quality_risk_signals" : "",
      promptPayload.feedSignals.some((item) => item.includes("no recent feed entry")) ? "feed_missing_entries" : ""
    ]);

    return {
      headline,
      directAnswer,
      priorityItems,
      supportingFacts,
      recommendedNextChecks,
      missingInformationNote,
      answer: directAnswer,
      relatedMetrics,
      metadata: buildDashboardMetadata(generatedAt, this.runtime.modelLabel, false),
      audit: this.buildAuditMetadata(generatedAt, "pending", "pending", true)
    };
  }

  private buildAuditMetadata(
    generatedAt: string,
    requestId: string,
    responseId: string,
    fallbackUsed: boolean
  ): AiOperatorAssistanceAuditMetadata {
    return {
      requestId,
      responseId,
      requestLoggedAt: generatedAt,
      responseLoggedAt: generatedAt,
      fallbackUsed
    };
  }

  private async logRequest(
    requestType: AiRequestRecord["requestType"],
    inputPayload: Record<string, unknown>
  ): Promise<AiRequestRecord> {
    const generatedAt = new Date().toISOString();
    return this.aiRepository.saveRequestRecord({
      id: randomUUID(),
      createdAt: generatedAt,
      updatedAt: generatedAt,
      requestType,
      inputPayload,
      status: "completed"
    });
  }

  private async logResponse(
    requestId: string,
    modelLabel: string,
    payload: AiPondsSummarizeResponse | AiHandoverGenerateResponse | AiDashboardQueryResponse
  ): Promise<AiResponseRecord> {
    const generatedAt = new Date().toISOString();
    return this.aiRepository.saveResponseRecord({
      id: randomUUID(),
      createdAt: generatedAt,
      updatedAt: generatedAt,
      requestId,
      status: "completed",
      outputText: JSON.stringify(payload),
      model: modelLabel
    });
  }
}
