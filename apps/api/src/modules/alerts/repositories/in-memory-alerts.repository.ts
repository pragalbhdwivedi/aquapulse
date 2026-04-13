import { Injectable } from "@nestjs/common";
import type { AlertSummary, ListResponse } from "@aquapulse/types";
import type { CreateAlertsDto, QueryAlertsDto, UpdateAlertsDto } from "../dto";
import type { AlertsRepositoryPort } from "../ports/alerts-repository.port";

const alert: AlertSummary = {
  id: "alert-1",
  createdAt: "2026-04-13T00:00:00.000Z",
  updatedAt: "2026-04-13T00:00:00.000Z",
  title: "Low dissolved oxygen warning",
  severity: "high",
  source: "water-quality",
  pondId: "pond-1",
  status: "open"
};

@Injectable()
export class InMemoryAlertsRepository implements AlertsRepositoryPort {
  async create(_input: CreateAlertsDto): Promise<AlertSummary> {
    return alert;
  }

  async update(_id: string, _input: UpdateAlertsDto): Promise<AlertSummary> {
    return alert;
  }

  async getById(_id: string): Promise<AlertSummary> {
    return alert;
  }

  async list(_query: QueryAlertsDto): Promise<ListResponse<AlertSummary>> {
    return { items: [alert], page: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 } };
  }

  async listOpen(): Promise<ListResponse<AlertSummary>> {
    return { items: [alert], page: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 } };
  }
}
