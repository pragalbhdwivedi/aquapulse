import { Inject, Injectable } from "@nestjs/common";
import type {
  AlertAssignActionRequest,
  AlertBulkActionResult,
  AlertBulkAssignActionRequest,
  AlertBulkLifecycleActionRequest,
  AlertBulkReviewStateActionRequest,
  AlertExplanationAttachmentRequest,
  AlertLifecycleActionRequest,
  AlertQueueSummary,
  AlertReviewStateActionRequest,
  AlertSavedViewCreateRequest,
  AlertSavedViewDefinition,
  AlertSummary,
  AlertUnassignActionRequest,
  ApiSuccessEnvelope,
  ListResponse,
  OperationalAlertDecision
} from "@aquapulse/types";
import { findMatchingOperationalAlert } from "@aquapulse/types";
import type { CreateAlertsDto, UpdateAlertsDto } from "../dto";
import { AlertsLiveUpdatesService } from "../live-updates/alerts-live-updates.service";
import { ALERTS_REPOSITORY, type AlertsRepositoryPort } from "../ports/alerts-repository.port";
import type { AlertsListQueryContract } from "../query-contracts/alerts-query.contract";

@Injectable()
export class AlertsApplicationService {
  constructor(
    @Inject(ALERTS_REPOSITORY) private readonly alertsRepository: AlertsRepositoryPort,
    private readonly liveUpdatesService: AlertsLiveUpdatesService = {
      emit: () => undefined
    } as unknown as AlertsLiveUpdatesService
  ) {}

  async create(_input: CreateAlertsDto): Promise<ApiSuccessEnvelope<AlertSummary>> {
    const alert = await this.alertsRepository.create(_input);
    await this.emitSingleAlertEvent("alert_created", alert, ["title", "severity", "source", "status"]);
    return { ok: true, data: alert };
  }

  async update(_id: string, _input: UpdateAlertsDto): Promise<ApiSuccessEnvelope<AlertSummary>> {
    const alert = await this.alertsRepository.update(_id, _input);
    await this.emitSingleAlertEvent("alert_updated", alert, Object.keys(_input));
    return { ok: true, data: alert };
  }

  async acknowledge(_id: string, _input: AlertLifecycleActionRequest): Promise<ApiSuccessEnvelope<AlertSummary>> {
    const alert = await this.alertsRepository.acknowledge(_id, _input);
    await this.emitSingleAlertEvent("alert_lifecycle_changed", alert, ["status", "latestNote"]);
    return { ok: true, data: alert };
  }

  async bulkAcknowledge(
    _input: AlertBulkLifecycleActionRequest
  ): Promise<ApiSuccessEnvelope<AlertBulkActionResult>> {
    const result = await this.alertsRepository.bulkAcknowledge(_input);
    await this.emitBulkAlertEvent(result, ["status", "latestNote"]);
    return { ok: true, data: result };
  }

  async resolve(_id: string, _input: AlertLifecycleActionRequest): Promise<ApiSuccessEnvelope<AlertSummary>> {
    const alert = await this.alertsRepository.resolve(_id, _input);
    await this.emitSingleAlertEvent("alert_lifecycle_changed", alert, ["status", "latestNote"]);
    return { ok: true, data: alert };
  }

  async bulkResolve(
    _input: AlertBulkLifecycleActionRequest
  ): Promise<ApiSuccessEnvelope<AlertBulkActionResult>> {
    const result = await this.alertsRepository.bulkResolve(_input);
    await this.emitBulkAlertEvent(result, ["status", "latestNote"]);
    return { ok: true, data: result };
  }

  async assign(_id: string, _input: AlertAssignActionRequest): Promise<ApiSuccessEnvelope<AlertSummary>> {
    const alert = await this.alertsRepository.assign(_id, _input);
    await this.emitSingleAlertEvent("alert_lifecycle_changed", alert, ["assignedTo", "latestNote"]);
    return { ok: true, data: alert };
  }

  async bulkAssign(
    _input: AlertBulkAssignActionRequest
  ): Promise<ApiSuccessEnvelope<AlertBulkActionResult>> {
    const result = await this.alertsRepository.bulkAssign(_input);
    await this.emitBulkAlertEvent(result, ["assignedTo", "latestNote"]);
    return { ok: true, data: result };
  }

  async unassign(_id: string, _input: AlertUnassignActionRequest): Promise<ApiSuccessEnvelope<AlertSummary>> {
    const alert = await this.alertsRepository.unassign(_id, _input);
    await this.emitSingleAlertEvent("alert_lifecycle_changed", alert, ["assignedTo", "latestNote"]);
    return { ok: true, data: alert };
  }

  async setReviewState(
    _id: string,
    _input: AlertReviewStateActionRequest
  ): Promise<ApiSuccessEnvelope<AlertSummary>> {
    const alert = await this.alertsRepository.setReviewState(_id, _input);
    await this.emitSingleAlertEvent("alert_lifecycle_changed", alert, [
      "reviewState",
      "reviewLabel",
      "latestNote"
    ]);
    return { ok: true, data: alert };
  }

  async bulkSetReviewState(
    _input: AlertBulkReviewStateActionRequest
  ): Promise<ApiSuccessEnvelope<AlertBulkActionResult>> {
    const result = await this.alertsRepository.bulkSetReviewState(_input);
    await this.emitBulkAlertEvent(result, ["reviewState", "reviewLabel", "latestNote"]);
    return { ok: true, data: result };
  }

  async attachExplanation(
    _id: string,
    _input: AlertExplanationAttachmentRequest
  ): Promise<ApiSuccessEnvelope<AlertSummary>> {
    const alert = await this.alertsRepository.attachExplanation(_id, _input);
    await this.emitSingleAlertEvent("alert_updated", alert, ["latestNote", "actionHistory"]);
    return { ok: true, data: alert };
  }
  async listSavedViews(): Promise<ApiSuccessEnvelope<AlertSavedViewDefinition[]>> {
    return { ok: true, data: await this.alertsRepository.listSavedViews() };
  }
  async saveSavedView(
    _input: AlertSavedViewCreateRequest
  ): Promise<ApiSuccessEnvelope<AlertSavedViewDefinition[]>> {
    return { ok: true, data: await this.alertsRepository.saveSavedView(_input) };
  }
  async removeSavedView(_id: string): Promise<ApiSuccessEnvelope<AlertSavedViewDefinition[]>> {
    return { ok: true, data: await this.alertsRepository.removeSavedView(_id) };
  }
  async list(_query: AlertsListQueryContract): Promise<ApiSuccessEnvelope<ListResponse<AlertSummary>>> { return { ok: true, data: await this.alertsRepository.list(_query) }; }
  async summary(_query: AlertsListQueryContract): Promise<ApiSuccessEnvelope<AlertQueueSummary>> {
    return { ok: true, data: await this.alertsRepository.summary(_query) };
  }
  async getById(_id: string): Promise<ApiSuccessEnvelope<AlertSummary>> { return { ok: true, data: await this.alertsRepository.getById(_id) }; }

  async upsertOperationalDecision(
    decision: OperationalAlertDecision
  ): Promise<ApiSuccessEnvelope<AlertSummary>> {
    const openAlerts = await this.alertsRepository.listOpen();
    const existing = findMatchingOperationalAlert(openAlerts.items, decision);

    if (existing) {
      const alert = await this.alertsRepository.update(existing.id, {
        title: decision.title,
        severity: decision.severity,
        source: decision.source,
        pondId: decision.pondId,
        status: decision.status,
        latestNote: decision.summary
      });
      await this.emitSingleAlertEvent("alert_updated", alert, [
        "title",
        "severity",
        "status",
        "latestNote"
      ]);
      return {
        ok: true,
        data: alert
      };
    }

    const alert = await this.alertsRepository.create({
      title: decision.title,
      severity: decision.severity,
      source: decision.source,
      pondId: decision.pondId,
      status: decision.status,
      latestNote: decision.summary
    });
    await this.emitSingleAlertEvent("alert_created", alert, [
      "title",
      "severity",
      "source",
      "status",
      "latestNote"
    ]);

    return {
      ok: true,
      data: alert
    };
  }

  private async emitSingleAlertEvent(
    eventType: "alert_created" | "alert_updated" | "alert_lifecycle_changed",
    alert: AlertSummary,
    changedFields: string[]
  ) {
    this.liveUpdatesService.emit({
      source: "alerts",
      eventType,
      timestamp: new Date().toISOString(),
      alertId: alert.id,
      changedFields,
      alert: {
        id: alert.id,
        status: alert.status,
        severity: alert.severity,
        assignedTo: alert.assignedTo,
        reviewState: alert.reviewState,
        updatedAt: alert.updatedAt
      },
      summary: await this.readSummarySnapshot()
    });
  }

  private async emitBulkAlertEvent(result: AlertBulkActionResult, changedFields: string[]) {
    this.liveUpdatesService.emit({
      source: "alerts",
      eventType: "alert_bulk_action_completed",
      timestamp: new Date().toISOString(),
      alertIds: result.updatedAlerts.map((alert) => alert.id),
      totalUpdated: result.totalUpdated,
      changedFields,
      summary: await this.readSummarySnapshot()
    });
  }

  private async readSummarySnapshot(): Promise<AlertQueueSummary | undefined> {
    try {
      return await this.alertsRepository.summary({ page: 1, pageSize: 20 });
    } catch {
      return undefined;
    }
  }
}
