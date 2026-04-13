import { Inject, Injectable } from "@nestjs/common";
import type { AlertSummary, ApiSuccessEnvelope, ListResponse } from "@aquapulse/types";
import type { CreateAlertsDto, QueryAlertsDto, UpdateAlertsDto } from "../dto";
import { ALERTS_REPOSITORY, type AlertsRepositoryPort } from "../ports/alerts-repository.port";

@Injectable()
export class AlertsApplicationService {
  constructor(
    @Inject(ALERTS_REPOSITORY) private readonly alertsRepository: AlertsRepositoryPort
  ) {}

  async create(_input: CreateAlertsDto): Promise<ApiSuccessEnvelope<AlertSummary>> { return { ok: true, data: await this.alertsRepository.create(_input) }; }
  async update(_id: string, _input: UpdateAlertsDto): Promise<ApiSuccessEnvelope<AlertSummary>> { return { ok: true, data: await this.alertsRepository.update(_id, _input) }; }
  async list(_query: QueryAlertsDto): Promise<ApiSuccessEnvelope<ListResponse<AlertSummary>>> { return { ok: true, data: await this.alertsRepository.list(_query) }; }
  async getById(_id: string): Promise<ApiSuccessEnvelope<AlertSummary>> { return { ok: true, data: await this.alertsRepository.getById(_id) }; }
}
