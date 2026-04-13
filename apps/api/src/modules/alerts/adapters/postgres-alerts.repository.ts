import { Injectable } from "@nestjs/common";
import {
  PlaceholderDatabaseConnectionFactory,
  alertRowMapper,
  createPlaceholderAlertRow,
  type AlertRow,
  type CompiledQueryPlan,
  type DatabaseConfig,
  type DatabaseConnectionFactory
} from "@aquapulse/database";
import type { AlertSummary, ListResponse } from "@aquapulse/types";
import { readApiDatabaseRuntimeConfig } from "../../../common/config/database-runtime.config";
import type { CreateAlertsDto, UpdateAlertsDto } from "../dto";
import type { AlertsRepositoryPort } from "../ports/alerts-repository.port";
import type { AlertsListQueryContract } from "../query-contracts/alerts-query.contract";

export interface PostgresAlertsRepositoryDependencies {
  readonly connectionFactory?: DatabaseConnectionFactory;
  readonly databaseConfig?: DatabaseConfig;
}

export function buildAlertByIdQueryPlan(id: string): CompiledQueryPlan {
  return {
    key: "alerts.getById",
    statement: "alerts.getById",
    params: [id],
    filters: { id }
  };
}

export function buildAlertsListQueryPlan(query: AlertsListQueryContract): CompiledQueryPlan {
  return {
    key: "alerts.list",
    statement: "alerts.list",
    params: [
      query.page,
      query.pageSize,
      query.pondId ?? null,
      query.severity ?? null,
      query.status ?? null,
      query.source ?? null,
      query.search ?? null
    ],
    pagination: { page: query.page, pageSize: query.pageSize },
    filters: {
      pondId: query.pondId,
      severity: query.severity,
      status: query.status,
      source: query.source,
      search: query.search
    },
    sort: query.sort
  };
}

export function buildOpenAlertsQueryPlan(): CompiledQueryPlan {
  return {
    key: "alerts.listOpen",
    statement: "alerts.listOpen",
    params: [],
    filters: { status: "open" }
  };
}

@Injectable()
export class PostgresAlertsRepository implements AlertsRepositoryPort {
  private connectionFactory: DatabaseConnectionFactory = new PlaceholderDatabaseConnectionFactory();
  private databaseConfig: DatabaseConfig = readApiDatabaseRuntimeConfig().database;

  static forTesting(
    overrides: PostgresAlertsRepositoryDependencies = {}
  ): PostgresAlertsRepository {
    const repository = new PostgresAlertsRepository();
    repository.connectionFactory = overrides.connectionFactory ?? repository.connectionFactory;
    repository.databaseConfig = overrides.databaseConfig ?? repository.databaseConfig;
    return repository;
  }

  async create(_input: CreateAlertsDto): Promise<AlertSummary> {
    // TODO: Persist alerts once write adapters are enabled.
    return alertRowMapper.toDomain(createPlaceholderAlertRow());
  }

  async update(id: string, _input: UpdateAlertsDto): Promise<AlertSummary> {
    // TODO: Update alerts storage by id once write adapters are enabled.
    return alertRowMapper.toDomain(createPlaceholderAlertRow({ id }));
  }

  async getById(id: string): Promise<AlertSummary> {
    const rows = await this.queryRows<AlertRow>(buildAlertByIdQueryPlan(id));
    return alertRowMapper.toDomain(rows[0] ?? createPlaceholderAlertRow({ id }));
  }

  async list(query: AlertsListQueryContract): Promise<ListResponse<AlertSummary>> {
    const rows = await this.queryRows<AlertRow>(buildAlertsListQueryPlan(query));
    return this.toListResponse(rows, query.page, query.pageSize);
  }

  async listOpen(): Promise<ListResponse<AlertSummary>> {
    const rows = await this.queryRows<AlertRow>(buildOpenAlertsQueryPlan());
    return this.toListResponse(rows, 1, 20);
  }

  private async queryRows<TRow>(plan: CompiledQueryPlan): Promise<TRow[]> {
    const client = await this.connectionFactory.create(this.databaseConfig);

    try {
      const result = await client.query<TRow>(plan.statement, plan.params);
      return result.rows;
    } finally {
      await client.dispose();
    }
  }

  private toListResponse(
    rows: AlertRow[],
    page: number,
    pageSize: number
  ): ListResponse<AlertSummary> {
    const items =
      rows.length > 0
        ? rows.map((row) => alertRowMapper.toDomain(row))
        : [alertRowMapper.toDomain(createPlaceholderAlertRow())];

    return {
      items,
      page: {
        page,
        pageSize,
        totalItems: items.length,
        totalPages: Math.max(1, Math.ceil(items.length / pageSize))
      }
    };
  }
}

export const POSTGRES_ALERTS_IMPLEMENTATION_PLAN = {
  readMethods: ["getById", "list", "listOpen"],
  writeMethods: ["create", "update"],
  rowSource: "alerts",
  queryNotes: [
    "translate severity/source/status filters into a compiled query plan",
    "keep the open-alerts path as a dedicated read slice",
    "preserve placeholder results when no live database client is active"
  ],
  mappingNotes: [
    "map alert rows into AlertSummary via the shared row mapper",
    "retain pond linkage and alert status fields during domain conversion"
  ]
} as const;
