import type { AiIncidentsDraftRequest, AiIncidentsDraftResponse, AlertSeverity } from "@aquapulse/types";

export class DraftIncidentDto implements AiIncidentsDraftRequest { incidentSummary!: string; severity!: AlertSeverity; }
export class DraftIncidentResponseDto implements AiIncidentsDraftResponse { draftTitle!: string; draftBody!: string; }
