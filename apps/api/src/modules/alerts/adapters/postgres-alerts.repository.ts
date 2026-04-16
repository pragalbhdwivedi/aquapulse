import { Injectable } from "@nestjs/common";
import {
  PlaceholderDatabaseConnectionFactory,
  PostgresRowGateway,
  alertRowMapper,
  createCompiledQueryPlan,
  createListQueryPlan,
  createLookupQueryPlan,
  createMutationQueryPlan,
  createPlaceholderAlertRow,
  mapCreateAlertInputToRowWrite,
  mapUpdateAlertInputToRowPatch,
  type AlertRow,
  type AlertRowPatch,
  type AlertRowWrite,
  type CompiledQueryPlan,
  type DatabaseConfig,
  type DatabaseConnectionFactory
} from "@aquapulse/database";
import type {
  AlertAssignActionRequest,
  AlertBulkActionResult,
  AlertBulkAssignActionRequest,
  AlertBulkLifecycleActionRequest,
  AlertBulkReviewStateActionRequest,
  AlertLifecycleActionRequest,
  AlertQueueSummary,
  AlertReviewStateActionRequest,
  AlertSummary,
  AlertUnassignActionRequest,
  ListResponse
} from "@aquapulse/types";
import { buildAlertQueueSummary } from "@aquapulse/types";
import { readApiDatabaseRuntimeConfig } from "../../../common/config/database-runtime.config";
import type { CreateAlertsDto, UpdateAlertsDto } from "../dto";
import type { AlertsRepositoryPort } from "../ports/alerts-repository.port";
import type { AlertsListQueryContract } from "../query-contracts/alerts-query.contract";

export interface PostgresAlertsRepositoryDependencies {
  readonly connectionFactory?: DatabaseConnectionFactory;
  readonly databaseConfig?: DatabaseConfig;
}

export function buildAlertByIdQueryPlan(id: string): CompiledQueryPlan {
  return createLookupQueryPlan("alerts.getById", id);
}

export function buildAlertsListQueryPlan(query: AlertsListQueryContract): CompiledQueryPlan {
  return createListQueryPlan({
    key: "alerts.list",
    query,
    params: [
      query.page,
      query.pageSize,
      query.pondId ?? null,
      query.severity ?? null,
      query.status ?? null,
      query.source ?? null,
      query.assignedTo ?? null,
      query.reviewState ?? null,
      query.search ?? null
    ],
    filters: {
      pondId: query.pondId,
      severity: query.severity,
      status: query.status,
      source: query.source,
      assignedTo: query.assignedTo,
      reviewState: query.reviewState,
      search: query.search
    }
  });
}

export function buildOpenAlertsQueryPlan(): CompiledQueryPlan {
  return createCompiledQueryPlan({
    key: "alerts.listOpen",
    params: [],
    filters: { status: "open" }
  });
}

export function buildCreateAlertQueryPlan(row: AlertRowWrite): CompiledQueryPlan {
  return createMutationQueryPlan("alerts.create", row);
}

export function buildUpdateAlertQueryPlan(id: string, patch: AlertRowPatch): CompiledQueryPlan {
  return createMutationQueryPlan("alerts.update", patch, {
    params: [id, patch],
    filters: { id }
  });
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
    const row = mapCreateAlertInputToRowWrite(_input);
    return this.gateway.executeMappedMutation(
      buildCreateAlertQueryPlan(row),
      alertRowMapper,
      createPlaceholderAlertRow({ id: row.id })
    );
  }

  async update(id: string, _input: UpdateAlertsDto): Promise<AlertSummary> {
    const patch = mapUpdateAlertInputToRowPatch(id, _input);
    return this.gateway.executeMappedMutation(
      buildUpdateAlertQueryPlan(id, patch),
      alertRowMapper,
      createPlaceholderAlertRow({ id })
    );
  }

  async acknowledge(id: string, _input: AlertLifecycleActionRequest): Promise<AlertSummary> {
    return this.update(id, { status: "acknowledged" });
  }

  async bulkAcknowledge(input: AlertBulkLifecycleActionRequest): Promise<AlertBulkActionResult> {
    const updatedAlerts = await Promise.all(
      input.alertIds.map((alertId) => this.acknowledge(alertId, { note: input.note }))
    );

    return {
      updatedAlerts,
      totalRequested: input.alertIds.length,
      totalUpdated: updatedAlerts.length
    };
  }

  async resolve(id: string, _input: AlertLifecycleActionRequest): Promise<AlertSummary> {
    return this.update(id, { status: "resolved" });
  }

  async bulkResolve(input: AlertBulkLifecycleActionRequest): Promise<AlertBulkActionResult> {
    const updatedAlerts = await Promise.all(
      input.alertIds.map((alertId) => this.resolve(alertId, { note: input.note }))
    );

    return {
      updatedAlerts,
      totalRequested: input.alertIds.length,
      totalUpdated: updatedAlerts.length
    };
  }

  async assign(id: string, _input: AlertAssignActionRequest): Promise<AlertSummary> {
    return this.update(id, {
      assignedTo: _input.assignedTo,
      reviewState: "under_review"
    });
  }

  async bulkAssign(input: AlertBulkAssignActionRequest): Promise<AlertBulkActionResult> {
    const updatedAlerts = await Promise.all(
      input.alertIds.map((alertId) =>
        this.assign(alertId, { assignedTo: input.assignedTo, note: input.note })
      )
    );

    return {
      updatedAlerts,
      totalRequested: input.alertIds.length,
      totalUpdated: updatedAlerts.length
    };
  }

  async unassign(id: string, _input: AlertUnassignActionRequest): Promise<AlertSummary> {
    void _input;
    return this.update(id, { assignedTo: undefined });
  }

  async setReviewState(id: string, _input: AlertReviewStateActionRequest): Promise<AlertSummary> {
    return this.update(id, {
      reviewState: _input.reviewState,
      reviewLabel: _input.reviewLabel
    });
  }

  async bulkSetReviewState(
    input: AlertBulkReviewStateActionRequest
  ): Promise<AlertBulkActionResult> {
    const updatedAlerts = await Promise.all(
      input.alertIds.map((alertId) =>
        this.setReviewState(alertId, {
          reviewState: input.reviewState,
          reviewLabel: input.reviewLabel,
          note: input.note
        })
      )
    );

    return {
      updatedAlerts,
      totalRequested: input.alertIds.length,
      totalUpdated: updatedAlerts.length
    };
  }

  async getById(id: string): Promise<AlertSummary> {
    return this.gateway.executeMappedItem(
      buildAlertByIdQueryPlan(id),
      alertRowMapper,
      createPlaceholderAlertRow({ id })
    );
  }

  async list(query: AlertsListQueryContract): Promise<ListResponse<AlertSummary>> {
    return this.gateway.executeMappedList(buildAlertsListQueryPlan(query), alertRowMapper, {
      page: query.page,
      pageSize: query.pageSize,
      fallbackRows: [createPlaceholderAlertRow()]
    });
  }

  async summary(query: AlertsListQueryContract): Promise<AlertQueueSummary> {
    const list = await this.list(query);
    return buildAlertQueueSummary(list.items);
  }

  async listOpen(): Promise<ListResponse<AlertSummary>> {
    return this.gateway.executeMappedList(buildOpenAlertsQueryPlan(), alertRowMapper, {
      page: 1,
      pageSize: 20,
      fallbackRows: [createPlaceholderAlertRow()]
    });
  }

  private get gateway(): PostgresRowGateway {
    return new PostgresRowGateway({
      connectionFactory: this.connectionFactory,
      databaseConfig: this.databaseConfig
    });
  }
}

export const POSTGRES_ALERTS_IMPLEMENTATION_PLAN = {
  readMethods: ["getById", "list", "listOpen"],
  writeMethods: ["create", "update"],
  rowSource: "alerts",
  queryNotes: [
    "shape create and update payloads into mutation plans without requiring a live database",
    "translate severity/source/status filters into a compiled query plan",
    "keep the open-alerts path as a dedicated read slice",
    "preserve placeholder results when no live database client is active"
  ],
  mappingNotes: [
    "map alert rows into AlertSummary via the shared row mapper",
    "shape create/update DTO inputs into alert row write payloads",
    "retain pond linkage and alert status fields during domain conversion"
  ]
} as const;
