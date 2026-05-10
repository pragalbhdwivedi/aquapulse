import { ForbiddenException, Inject, Injectable, NotFoundException } from "@nestjs/common";
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
import { createForbiddenResponse, createNotFoundResponse } from "../../../common/api/response-mapper";
import { PondReadAuthorizationService } from "../../pond-responsibility/application/pond-read-authorization.service";
import type { CreateAlertsDto, UpdateAlertsDto } from "../dto";
import { AlertsLiveUpdatesService } from "../live-updates/alerts-live-updates.service";
import { ALERTS_REPOSITORY, type AlertsRepositoryPort } from "../ports/alerts-repository.port";
import type { AlertsListQueryContract } from "../query-contracts/alerts-query.contract";

interface AlertAssignmentRequesterScope {
  readonly id: string;
  readonly provider: "keycloak" | "local";
}

function shouldScopeAlertsByAssignment(
  requester: AlertAssignmentRequesterScope | undefined
): requester is AlertAssignmentRequesterScope & { readonly provider: "keycloak" } {
  return requester?.provider === "keycloak" && requester.id.trim().length > 0;
}

@Injectable()
export class AlertsApplicationService {
  constructor(
    @Inject(ALERTS_REPOSITORY) private readonly alertsRepository: AlertsRepositoryPort,
    private readonly liveUpdatesService: AlertsLiveUpdatesService = {
      emit: () => undefined
    } as unknown as AlertsLiveUpdatesService,
    private readonly pondReadAuthorizationService: PondReadAuthorizationService = new PondReadAuthorizationService({
      canReadPond: async () => true,
      listActiveByUserId: async () => [],
      hasActiveResponsibility: async () => true
    } as never)
  ) {}

  async create(
    _input: CreateAlertsDto,
    requester?: AlertAssignmentRequesterScope
  ): Promise<ApiSuccessEnvelope<AlertSummary>> {
    if (_input.pondId) {
      const canReadPond = await this.pondReadAuthorizationService.canReadPond(requester, _input.pondId);

      if (!canReadPond) {
        throw new ForbiddenException(createForbiddenResponse().error);
      }
    }

    const alert = await this.alertsRepository.create(_input);
    await this.emitSingleAlertEvent("alert_created", alert, ["title", "severity", "source", "status"]);
    return { ok: true, data: alert };
  }

  async update(
    _id: string,
    _input: UpdateAlertsDto,
    requester?: AlertAssignmentRequesterScope
  ): Promise<ApiSuccessEnvelope<AlertSummary>> {
    await this.assertAlertVisibleToRequester(_id, requester);
    const currentAlert = await this.alertsRepository.getById(_id);

    if (_input.pondId && _input.pondId !== currentAlert.pondId) {
      const canReadPond = await this.pondReadAuthorizationService.canReadPond(requester, _input.pondId);

      if (!canReadPond) {
        throw new ForbiddenException(createForbiddenResponse().error);
      }
    }

    const alert = await this.alertsRepository.update(_id, _input);
    await this.emitSingleAlertEvent("alert_updated", alert, Object.keys(_input));
    return { ok: true, data: alert };
  }

  async acknowledge(
    _id: string,
    _input: AlertLifecycleActionRequest,
    requester?: AlertAssignmentRequesterScope
  ): Promise<ApiSuccessEnvelope<AlertSummary>> {
    await this.assertAlertVisibleToRequester(_id, requester);
    const alert = await this.alertsRepository.acknowledge(_id, _input);
    await this.emitSingleAlertEvent("alert_lifecycle_changed", alert, ["status", "latestNote"]);
    return { ok: true, data: alert };
  }

  async bulkAcknowledge(
    _input: AlertBulkLifecycleActionRequest,
    requester?: AlertAssignmentRequesterScope
  ): Promise<ApiSuccessEnvelope<AlertBulkActionResult>> {
    await this.assertAlertsVisibleToRequester(_input.alertIds, requester);
    const result = await this.alertsRepository.bulkAcknowledge(_input);
    await this.emitBulkAlertEvent(result, ["status", "latestNote"]);
    return { ok: true, data: result };
  }

  async resolve(
    _id: string,
    _input: AlertLifecycleActionRequest,
    requester?: AlertAssignmentRequesterScope
  ): Promise<ApiSuccessEnvelope<AlertSummary>> {
    await this.assertAlertVisibleToRequester(_id, requester);
    const alert = await this.alertsRepository.resolve(_id, _input);
    await this.emitSingleAlertEvent("alert_lifecycle_changed", alert, ["status", "latestNote"]);
    return { ok: true, data: alert };
  }

  async bulkResolve(
    _input: AlertBulkLifecycleActionRequest,
    requester?: AlertAssignmentRequesterScope
  ): Promise<ApiSuccessEnvelope<AlertBulkActionResult>> {
    await this.assertAlertsVisibleToRequester(_input.alertIds, requester);
    const result = await this.alertsRepository.bulkResolve(_input);
    await this.emitBulkAlertEvent(result, ["status", "latestNote"]);
    return { ok: true, data: result };
  }

  async assign(
    _id: string,
    _input: AlertAssignActionRequest,
    requester?: AlertAssignmentRequesterScope
  ): Promise<ApiSuccessEnvelope<AlertSummary>> {
    await this.assertAlertVisibleToRequester(_id, requester);
    const alert = await this.alertsRepository.assign(_id, _input);
    await this.emitSingleAlertEvent("alert_lifecycle_changed", alert, ["assignedTo", "latestNote"]);
    return { ok: true, data: alert };
  }

  async bulkAssign(
    _input: AlertBulkAssignActionRequest,
    requester?: AlertAssignmentRequesterScope
  ): Promise<ApiSuccessEnvelope<AlertBulkActionResult>> {
    await this.assertAlertsVisibleToRequester(_input.alertIds, requester);
    const result = await this.alertsRepository.bulkAssign(_input);
    await this.emitBulkAlertEvent(result, ["assignedTo", "latestNote"]);
    return { ok: true, data: result };
  }

  async unassign(
    _id: string,
    _input: AlertUnassignActionRequest,
    requester?: AlertAssignmentRequesterScope
  ): Promise<ApiSuccessEnvelope<AlertSummary>> {
    await this.assertAlertVisibleToRequester(_id, requester);
    const alert = await this.alertsRepository.unassign(_id, _input);
    await this.emitSingleAlertEvent("alert_lifecycle_changed", alert, ["assignedTo", "latestNote"]);
    return { ok: true, data: alert };
  }

  async setReviewState(
    _id: string,
    _input: AlertReviewStateActionRequest,
    requester?: AlertAssignmentRequesterScope
  ): Promise<ApiSuccessEnvelope<AlertSummary>> {
    await this.assertAlertVisibleToRequester(_id, requester);
    const alert = await this.alertsRepository.setReviewState(_id, _input);
    await this.emitSingleAlertEvent("alert_lifecycle_changed", alert, [
      "reviewState",
      "reviewLabel",
      "latestNote"
    ]);
    return { ok: true, data: alert };
  }

  async bulkSetReviewState(
    _input: AlertBulkReviewStateActionRequest,
    requester?: AlertAssignmentRequesterScope
  ): Promise<ApiSuccessEnvelope<AlertBulkActionResult>> {
    await this.assertAlertsVisibleToRequester(_input.alertIds, requester);
    const result = await this.alertsRepository.bulkSetReviewState(_input);
    await this.emitBulkAlertEvent(result, ["reviewState", "reviewLabel", "latestNote"]);
    return { ok: true, data: result };
  }

  async attachExplanation(
    _id: string,
    _input: AlertExplanationAttachmentRequest,
    requester?: AlertAssignmentRequesterScope
  ): Promise<ApiSuccessEnvelope<AlertSummary>> {
    await this.assertAlertVisibleToRequester(_id, requester);
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
  async list(
    _query: AlertsListQueryContract,
    requester?: AlertAssignmentRequesterScope
  ): Promise<ApiSuccessEnvelope<ListResponse<AlertSummary>>> {
    const scopedQuery: AlertsListQueryContract = shouldScopeAlertsByAssignment(requester)
      ? {
          ..._query,
          assignedTo: requester.id
        }
      : _query;
    return { ok: true, data: await this.alertsRepository.list(scopedQuery) };
  }
  async summary(
    _query: AlertsListQueryContract,
    requester?: AlertAssignmentRequesterScope
  ): Promise<ApiSuccessEnvelope<AlertQueueSummary>> {
    const scopedQuery: AlertsListQueryContract = shouldScopeAlertsByAssignment(requester)
      ? {
          ..._query,
          assignedTo: requester.id
        }
      : _query;
    return { ok: true, data: await this.alertsRepository.summary(scopedQuery) };
  }
  async getById(
    _id: string,
    requester?: AlertAssignmentRequesterScope
  ): Promise<ApiSuccessEnvelope<AlertSummary>> {
    await this.assertAlertVisibleToRequester(_id, requester);
    return { ok: true, data: await this.alertsRepository.getById(_id) };
  }

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

  private async assertAlertsVisibleToRequester(
    alertIds: readonly string[],
    requester?: AlertAssignmentRequesterScope
  ) {
    if (!shouldScopeAlertsByAssignment(requester)) {
      return;
    }

    await Promise.all(alertIds.map((alertId) => this.assertAlertVisibleToRequester(alertId, requester)));
  }

  private async assertAlertVisibleToRequester(
    alertId: string,
    requester?: AlertAssignmentRequesterScope
  ) {
    if (!shouldScopeAlertsByAssignment(requester)) {
      return;
    }

    const visibleAlerts = await this.alertsRepository.list({
      page: 1,
      pageSize: 1,
      alertId,
      assignedTo: requester.id
    });

    if (visibleAlerts.items.length === 0) {
      throw new NotFoundException(createNotFoundResponse("Alert").error);
    }
  }
}
