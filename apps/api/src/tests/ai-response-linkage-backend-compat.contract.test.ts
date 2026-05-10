import { describe, expect, it } from "vitest";
import type { AiRequestRecord, AiResponseRecord, ListResponse } from "@aquapulse/types";
import { AiApplicationService } from "../modules/ai/application/ai.application-service";
import type { AlertExplanationFeedbackPersistenceRecord } from "../modules/ai/ports/ai-repository.port";
import { InMemoryAiRepository } from "../modules/ai/repositories/in-memory-ai.repository";
import { AlertExplanationService } from "../modules/ai/services/alert-explanation.service";
import { AlertsApplicationService } from "../modules/alerts/application/alerts.application-service";
import { InMemoryAlertsRepository } from "../modules/alerts/repositories/in-memory-alerts.repository";
import type { AiResponseLogQueryContract } from "../modules/ai/query-contracts/ai-query.contract";

const liveUpdatesStub = {
  emit: () => undefined
} as const;

class RecordingInMemoryAiRepository extends InMemoryAiRepository {
  readonly savedRequestRecords: AiRequestRecord[] = [];
  readonly savedResponseRecords: AiResponseRecord[] = [];
  readonly savedAlertExplanationFeedbackRecords: AlertExplanationFeedbackPersistenceRecord[] = [];

  override async saveRequestRecord(record: AiRequestRecord): Promise<AiRequestRecord> {
    this.savedRequestRecords.push(record);
    return super.saveRequestRecord(record);
  }

  override async saveResponseRecord(record: AiResponseRecord): Promise<AiResponseRecord> {
    this.savedResponseRecords.push(record);
    return super.saveResponseRecord(record);
  }

  override async saveAlertExplanationFeedbackRecord(
    record: AlertExplanationFeedbackPersistenceRecord
  ): Promise<AlertExplanationFeedbackPersistenceRecord> {
    this.savedAlertExplanationFeedbackRecords.push(record);
    return super.saveAlertExplanationFeedbackRecord(record);
  }

  override async getById(id: string): Promise<AiResponseRecord> {
    return this.savedResponseRecords.find((record) => record.id === id) ?? super.getById(id);
  }

  override async list(query: AiResponseLogQueryContract): Promise<ListResponse<AiResponseRecord>> {
    const base = await super.list(query);
    const combined = [...this.savedResponseRecords, ...base.items].filter((item, index, items) => {
      if (items.findIndex((candidate) => candidate.id === item.id) !== index) {
        return false;
      }

      if (query.requestId && item.requestId !== query.requestId) {
        return false;
      }

      if (query.requestedBy) {
        const request = this.savedRequestRecords.find((record) => record.id === item.requestId);
        if (request && request.requestedBy !== query.requestedBy) {
          return false;
        }
      }

      return true;
    });

    return {
      items: combined,
      page: {
        page: query.page ?? 1,
        pageSize: query.pageSize ?? combined.length,
        totalItems: combined.length,
        totalPages: 1
      }
    };
  }
}

class FailingResponseLinkageRepository extends RecordingInMemoryAiRepository {
  override async saveResponseRecord(_record: AiResponseRecord): Promise<AiResponseRecord> {
    throw new Error("response persistence unavailable");
  }
}

function createAlertExplanationAppService(repository: RecordingInMemoryAiRepository) {
  const alertsService = new AlertsApplicationService(
    new InMemoryAlertsRepository(),
    liveUpdatesStub as never
  );
  const explanationService = new AlertExplanationService(alertsService);

  return new AiApplicationService(
    repository,
    explanationService,
    undefined,
    alertsService
  );
}

describe("AI response linkage backend compatibility", () => {
  it("returns an optional aiResponseId when durable alert explanation persistence succeeds", async () => {
    const repository = new RecordingInMemoryAiRepository();
    const service = createAlertExplanationAppService(repository);

    const response = await service.explainAlert(
      {
        alertId: "alert-1",
        includeRecommendations: true
      },
      { id: "user-1", provider: "keycloak" }
    );

    expect(response.data.aiResponseId).toBeTruthy();
    expect(repository.savedRequestRecords[0]?.requestType).toBe("alerts_explain");
    expect(repository.savedRequestRecords[0]?.requestedBy).toBe("user-1");
    expect(repository.savedResponseRecords[0]?.id).toBe(response.data.aiResponseId);
    expect(repository.savedResponseRecords[0]?.requestId).toBe(repository.savedRequestRecords[0]?.id);
  });

  it("keeps alert explanation responses compatible when durable linkage is unavailable", async () => {
    const repository = new FailingResponseLinkageRepository();
    const service = createAlertExplanationAppService(repository);

    const response = await service.explainAlert(
      {
        alertId: "alert-1"
      },
      { id: "user-1", provider: "keycloak" }
    );

    expect(response.data.explanation.length).toBeGreaterThan(0);
    expect(response.data.aiResponseId).toBeUndefined();
    expect(repository.savedRequestRecords).toHaveLength(1);
  });

  it("preserves frontend compatibility by accepting a nested aiResponseId from the explanation payload", async () => {
    const repository = new RecordingInMemoryAiRepository();
    const service = createAlertExplanationAppService(repository);
    const requester = { id: "user-1", provider: "keycloak" } as const;

    const explanation = await service.explainAlert(
      {
        alertId: "alert-1",
        includeRecommendations: true
      },
      requester
    );

    const feedback = await service.submitAlertExplanationFeedback(
      {
        alertId: "alert-1",
        value: "useful",
        explanation: explanation.data
      },
      requester
    );

    expect(feedback.data.alertId).toBe("alert-1");
    expect(repository.savedAlertExplanationFeedbackRecords[0]?.aiResponseId).toBe(
      explanation.data.aiResponseId
    );
    expect(repository.savedAlertExplanationFeedbackRecords[0]?.aiRequestId).toBe(
      repository.savedRequestRecords[0]?.id
    );
  });
});
