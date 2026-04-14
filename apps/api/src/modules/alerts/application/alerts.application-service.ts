import { Inject, Injectable } from "@nestjs/common";
import type {
  AlertSummary,
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
  async list(_query: AlertsListQueryContract): Promise<ApiSuccessEnvelope<ListResponse<AlertSummary>>> { return { ok: true, data: await this.alertsRepository.list(_query) }; }
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
          status: decision.status
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
        status: decision.status
      })
    };
  }
}
