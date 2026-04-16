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
import { ALERTS_REPOSITORY, type AlertsRepositoryPort } from "../ports/alerts-repository.port";
import type { AlertsListQueryContract } from "../query-contracts/alerts-query.contract";

@Injectable()
export class AlertsApplicationService {
  constructor(
    @Inject(ALERTS_REPOSITORY) private readonly alertsRepository: AlertsRepositoryPort
  ) {}

  async create(_input: CreateAlertsDto): Promise<ApiSuccessEnvelope<AlertSummary>> { return { ok: true, data: await this.alertsRepository.create(_input) }; }
  async update(_id: string, _input: UpdateAlertsDto): Promise<ApiSuccessEnvelope<AlertSummary>> { return { ok: true, data: await this.alertsRepository.update(_id, _input) }; }
  async acknowledge(_id: string, _input: AlertLifecycleActionRequest): Promise<ApiSuccessEnvelope<AlertSummary>> {
    return { ok: true, data: await this.alertsRepository.acknowledge(_id, _input) };
  }
  async bulkAcknowledge(
    _input: AlertBulkLifecycleActionRequest
  ): Promise<ApiSuccessEnvelope<AlertBulkActionResult>> {
    return { ok: true, data: await this.alertsRepository.bulkAcknowledge(_input) };
  }
  async resolve(_id: string, _input: AlertLifecycleActionRequest): Promise<ApiSuccessEnvelope<AlertSummary>> {
    return { ok: true, data: await this.alertsRepository.resolve(_id, _input) };
  }
  async bulkResolve(
    _input: AlertBulkLifecycleActionRequest
  ): Promise<ApiSuccessEnvelope<AlertBulkActionResult>> {
    return { ok: true, data: await this.alertsRepository.bulkResolve(_input) };
  }
  async assign(_id: string, _input: AlertAssignActionRequest): Promise<ApiSuccessEnvelope<AlertSummary>> {
    return { ok: true, data: await this.alertsRepository.assign(_id, _input) };
  }
  async bulkAssign(
    _input: AlertBulkAssignActionRequest
  ): Promise<ApiSuccessEnvelope<AlertBulkActionResult>> {
    return { ok: true, data: await this.alertsRepository.bulkAssign(_input) };
  }
  async unassign(_id: string, _input: AlertUnassignActionRequest): Promise<ApiSuccessEnvelope<AlertSummary>> {
    return { ok: true, data: await this.alertsRepository.unassign(_id, _input) };
  }
  async setReviewState(
    _id: string,
    _input: AlertReviewStateActionRequest
  ): Promise<ApiSuccessEnvelope<AlertSummary>> {
    return { ok: true, data: await this.alertsRepository.setReviewState(_id, _input) };
  }
  async bulkSetReviewState(
    _input: AlertBulkReviewStateActionRequest
  ): Promise<ApiSuccessEnvelope<AlertBulkActionResult>> {
    return { ok: true, data: await this.alertsRepository.bulkSetReviewState(_input) };
  }
  async attachExplanation(
    _id: string,
    _input: AlertExplanationAttachmentRequest
  ): Promise<ApiSuccessEnvelope<AlertSummary>> {
    return { ok: true, data: await this.alertsRepository.attachExplanation(_id, _input) };
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
      return {
        ok: true,
        data: await this.alertsRepository.update(existing.id, {
          title: decision.title,
          severity: decision.severity,
          source: decision.source,
          pondId: decision.pondId,
          status: decision.status,
          latestNote: decision.summary
        })
      };
    }

    return {
      ok: true,
      data: await this.alertsRepository.create({
        title: decision.title,
        severity: decision.severity,
        source: decision.source,
        pondId: decision.pondId,
        status: decision.status,
        latestNote: decision.summary
      })
    };
  }
}
