import type {
  AiHistoryReuseDestination,
  AiHistoryReusePrefillPayload,
  AiResponseRecord
} from "@aquapulse/types";

function parseHistoryOutput(outputText: string): Record<string, unknown> | undefined {
  try {
    const parsed = JSON.parse(outputText) as unknown;
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : undefined;
  } catch {
    return undefined;
  }
}

function getStringField(record: Record<string, unknown> | undefined, key: string): string | undefined {
  const value = record?.[key];
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function buildPrefillPayload(
  item: AiResponseRecord,
  sourceTaskType: NonNullable<AiResponseRecord["requestType"]>,
  destinationType: AiHistoryReuseDestination,
  text: string
): AiHistoryReusePrefillPayload {
  const base = {
    sourceHistoryId: item.id,
    sourceTaskType,
    destinationType,
    sourceCreatedAt: item.createdAt,
    relatedRecordIds: item.relatedRecordIds,
    advisoryOnly: true as const
  };

  switch (destinationType) {
    case "incident_rewrite":
      return {
        ...base,
        destinationType,
        originalText: text
      };
    case "incident_draft":
      return {
        ...base,
        destinationType,
        rawOperatorNotes: text
      };
    case "approval_note_draft":
      return {
        ...base,
        destinationType,
        promptNote: text
      };
  }
}

export function getAiHistoryReusePrefill(
  item: AiResponseRecord
): AiHistoryReusePrefillPayload | undefined {
  const parsed = parseHistoryOutput(item.outputText);

  switch (item.requestType) {
    case "incident_rewrite": {
      const text =
        getStringField(parsed, "originalText") ??
        getStringField(parsed, "rewrittenEnglish") ??
        item.outputPreview;
      return text ? buildPrefillPayload(item, "incident_rewrite", "incident_rewrite", text) : undefined;
    }
    case "incident_draft": {
      const text =
        getStringField(parsed, "draftEnglish") ??
        getStringField(parsed, "incidentSummary") ??
        item.outputPreview;
      return text ? buildPrefillPayload(item, "incident_draft", "incident_draft", text) : undefined;
    }
    case "approval_note_draft": {
      const text =
        getStringField(parsed, "draftNote") ??
        getStringField(parsed, "headline") ??
        item.outputPreview;
      return text
        ? buildPrefillPayload(item, "approval_note_draft", "approval_note_draft", text)
        : undefined;
    }
    default:
      return undefined;
  }
}

export function encodeAiHistoryReusePrefill(
  prefill: AiHistoryReusePrefillPayload
): URLSearchParams {
  const params = new URLSearchParams({
    reuseDestination: prefill.destinationType,
    reuseSourceHistoryId: prefill.sourceHistoryId
  });

  if (prefill.destinationType === "incident_rewrite") {
    params.set("rewriteText", prefill.originalText);
  } else if (prefill.destinationType === "incident_draft") {
    params.set("incidentNotes", prefill.rawOperatorNotes);
  } else {
    params.set("approvalPrompt", prefill.promptNote);
  }

  return params;
}
