import type {
  AiApprovalNoteDraftResponse,
  AiDashboardQueryResponse,
  AiHandoverGenerateResponse,
  AiIncidentRewriteResponse,
  AiPondsSummarizeResponse
} from "@aquapulse/types";
import {
  aiApprovalNoteDraftResponseSchema,
  aiDashboardAssistantResponseSchema,
  aiDailyFarmSummaryResponseSchema,
  aiIncidentRewriteResponseSchema,
  aiShiftHandoverResponseSchema
} from "@aquapulse/validation";
import type { OperatorAssistanceRuntimeConfig } from "../config/operator-assistance.config";

const aiDailyFarmSummaryContentSchema = aiDailyFarmSummaryResponseSchema.omit({
  metadata: true,
  audit: true
});

const aiShiftHandoverContentSchema = aiShiftHandoverResponseSchema.omit({
  metadata: true,
  audit: true
});

const aiDashboardAssistantContentSchema = aiDashboardAssistantResponseSchema.omit({
  metadata: true,
  audit: true
});

const aiIncidentRewriteContentSchema = aiIncidentRewriteResponseSchema.omit({
  metadata: true,
  audit: true
});

const aiApprovalNoteDraftContentSchema = aiApprovalNoteDraftResponseSchema.omit({
  metadata: true,
  audit: true
});

export interface DailyFarmSummaryPromptPayload {
  readonly taskLabel: "daily_farm_summary";
  readonly generatedForDate: string;
  readonly scopeLabel: string;
  readonly pondSnapshot: {
    readonly totalActivePonds: number;
    readonly pondsPendingUpdates: string[];
    readonly attentionPonds: Array<{
      readonly pondId?: string;
      readonly pondName: string;
      readonly priority: "low" | "medium" | "high";
      readonly reason: string;
    }>;
  };
  readonly alerts: {
    readonly openCount: number;
    readonly criticalCount: number;
    readonly topOpenIssues: string[];
  };
  readonly feed: {
    readonly recentEntries: string[];
  };
  readonly tasks: {
    readonly openCount: number;
    readonly pendingActions: string[];
  };
  readonly waterQuality: {
    readonly recentSignals: string[];
    readonly missingDataNotes: string[];
  };
}

export interface ShiftHandoverPromptPayload {
  readonly taskLabel: "shift_handover_generate";
  readonly shiftDate: string;
  readonly shiftLabel: string;
  readonly scopeLabel: string;
  readonly completedThisShift: string[];
  readonly pendingItems: string[];
  readonly priorityPonds: Array<{
    readonly pondId?: string;
    readonly pondName: string;
    readonly priority: "low" | "medium" | "high";
    readonly reason: string;
  }>;
  readonly watchItems: string[];
  readonly openIssues: string[];
}

export interface DashboardAssistantPromptPayload {
  readonly taskLabel: "dashboard_assistant_query";
  readonly question: string;
  readonly scopeLabel: string;
  readonly timeWindowLabel: string;
  readonly pondsNeedingAttention: Array<{
    readonly pondId?: string;
    readonly pondName: string;
    readonly priority: "low" | "medium" | "high";
    readonly reason: string;
  }>;
  readonly openAlerts: {
    readonly total: number;
    readonly critical: number;
    readonly items: string[];
  };
  readonly pendingTasks: {
    readonly total: number;
    readonly items: string[];
  };
  readonly waterQualityRisks: string[];
  readonly staleOrMissingUpdates: string[];
  readonly feedSignals: string[];
}

export interface IncidentRewritePromptPayload {
  readonly taskLabel: "incident_rewrite";
  readonly originalText: string;
  readonly tone: "operator" | "formal" | "management" | "audit";
  readonly outputMode: "english_only" | "bilingual";
  readonly linkedRecordLabel?: string;
}

export interface ApprovalNoteDraftPromptPayload {
  readonly taskLabel: "approval_note_draft";
  readonly recordType: "alert" | "task" | "incident";
  readonly recordId?: string;
  readonly recordLabel: string;
  readonly mode: "closure_note" | "escalation_justification" | "needs_review" | "pending_verification";
  readonly outputMode: "english_only" | "bilingual";
  readonly statusLabel?: string;
  readonly severityLabel?: string;
  readonly promptNote?: string;
  readonly recentTimeline: string[];
}

interface OpenAiOperatorAssistanceClientOptions {
  readonly config: OperatorAssistanceRuntimeConfig;
  readonly fetchImpl?: typeof fetch;
}

function extractTextFromResponsePayload(payload: unknown): string | undefined {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "output_text" in payload &&
    typeof (payload as { output_text?: unknown }).output_text === "string"
  ) {
    return (payload as { output_text: string }).output_text;
  }

  if (
    typeof payload === "object" &&
    payload !== null &&
    "output" in payload &&
    Array.isArray((payload as { output?: unknown[] }).output)
  ) {
    for (const item of (payload as { output: unknown[] }).output) {
      if (
        typeof item === "object" &&
        item !== null &&
        "content" in item &&
        Array.isArray((item as { content?: unknown[] }).content)
      ) {
        for (const contentItem of (item as { content: unknown[] }).content) {
          if (
            typeof contentItem === "object" &&
            contentItem !== null &&
            "text" in contentItem &&
            typeof (contentItem as { text?: unknown }).text === "string"
          ) {
            return (contentItem as { text: string }).text;
          }
        }
      }
    }
  }

  return undefined;
}

export class OpenAiOperatorAssistanceClient {
  private readonly config: OperatorAssistanceRuntimeConfig;
  private readonly fetchImpl: typeof fetch;

  constructor(options: OpenAiOperatorAssistanceClientOptions) {
    this.config = options.config;
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  async generateDailyFarmSummary(
    context: DailyFarmSummaryPromptPayload
  ): Promise<Omit<AiPondsSummarizeResponse, "metadata" | "audit"> | null> {
    const parsed = await this.execute("daily_farm_summary", context);
    if (!parsed) {
      return null;
    }

    return aiDailyFarmSummaryContentSchema.parse(parsed);
  }

  async generateShiftHandover(
    context: ShiftHandoverPromptPayload
  ): Promise<Omit<AiHandoverGenerateResponse, "metadata" | "audit"> | null> {
    const parsed = await this.execute("shift_handover_generate", context);
    if (!parsed) {
      return null;
    }

    return aiShiftHandoverContentSchema.parse(parsed);
  }

  async generateDashboardAssistant(
    context: DashboardAssistantPromptPayload
  ): Promise<Omit<AiDashboardQueryResponse, "metadata" | "audit"> | null> {
    const parsed = await this.execute("dashboard_assistant_query", context);
    if (!parsed) {
      return null;
    }

    return aiDashboardAssistantContentSchema.parse(parsed);
  }

  async generateIncidentRewrite(
    context: IncidentRewritePromptPayload
  ): Promise<Omit<AiIncidentRewriteResponse, "metadata" | "audit"> | null> {
    const parsed = await this.execute("incident_rewrite", context);
    if (!parsed) {
      return null;
    }

    return aiIncidentRewriteContentSchema.parse(parsed);
  }

  async generateApprovalNoteDraft(
    context: ApprovalNoteDraftPromptPayload
  ): Promise<Omit<AiApprovalNoteDraftResponse, "metadata" | "audit"> | null> {
    const parsed = await this.execute("approval_note_draft", context);
    if (!parsed) {
      return null;
    }

    return aiApprovalNoteDraftContentSchema.parse(parsed);
  }

  private async execute(
    taskLabel:
      | "daily_farm_summary"
      | "shift_handover_generate"
      | "dashboard_assistant_query"
      | "incident_rewrite"
      | "approval_note_draft",
    payload:
      | DailyFarmSummaryPromptPayload
      | ShiftHandoverPromptPayload
      | DashboardAssistantPromptPayload
      | IncidentRewritePromptPayload
      | ApprovalNoteDraftPromptPayload
  ): Promise<Record<string, unknown> | null> {
    if (!this.config.configured || !this.config.apiKey) {
      return null;
    }

    const response = await this.fetchImpl(`${this.config.baseUrl}/responses`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${this.config.apiKey}`
      },
      body: JSON.stringify({
        model: this.config.modelLabel,
        input: [
          {
            role: "system",
            content: [
              {
                type: "input_text",
                text:
                  "You generate advisory aquaculture operator assistance output. Stay read-only, do not suggest closing alerts automatically, do not change finance, inventory, thresholds, or treatment approvals, and return JSON only."
              }
            ]
          },
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: JSON.stringify({
                  taskLabel,
                  instruction:
                    "Return JSON only with the exact requested fields. Keep the result concise, operator-friendly, and grounded only in the provided context.",
                  payload
                })
              }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI operator assistance request failed with status ${response.status}.`);
    }

    const responsePayload = (await response.json()) as unknown;
    const rawText = extractTextFromResponsePayload(responsePayload);

    if (!rawText) {
      throw new Error("OpenAI operator assistance response did not include parseable text output.");
    }

    return JSON.parse(rawText) as Record<string, unknown>;
  }
}
