import { Injectable } from "@nestjs/common";
import {
  AQUAPULSE_SCHEMA_TABLES,
  PlaceholderDatabaseConnectionFactory,
  PostgresRowGateway,
  alertRowMapper,
  createCompiledQueryPlan,
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

interface AlertListRow extends AlertRow {
  readonly total_count: number;
}

interface AlertSummaryRow {
  readonly total_alerts: number;
  readonly open_count: number;
  readonly acknowledged_count: number;
  readonly resolved_count: number;
  readonly assigned_count: number;
  readonly unassigned_count: number;
  readonly unreviewed_count: number;
  readonly under_review_count: number;
  readonly reviewed_count: number;
  readonly deferred_count: number;
  readonly with_latest_note_count: number;
  readonly without_latest_note_count: number;
  readonly low_count: number;
  readonly medium_count: number;
  readonly high_count: number;
  readonly critical_count: number;
  readonly owner_workloads: Array<{
    readonly ownerId: string;
    readonly assignedAlerts: number;
    readonly openAlerts: number;
    readonly underReviewAlerts: number;
    readonly unresolvedAlerts: number;
  }> | null;
}

function createAlertQueryWhereClause(
  query: Omit<AlertsListQueryContract, "page" | "pageSize" | "sortBy">
): { clause: string; params: readonly unknown[] } {
  const conditions: string[] = [];
  const params: unknown[] = [];

  function addCondition(sql: string, value: unknown) {
    params.push(value);
    conditions.push(sql.replace("?", `$${params.length}`));
  }

  if (query.pondId) addCondition("pond_id = ?", query.pondId);
  if (query.severity) addCondition("severity = ?", query.severity);
  if (query.status) addCondition("status = ?", query.status);
  if (query.source) addCondition("source = ?", query.source);
  if (query.assignedTo) addCondition("assigned_to = ?", query.assignedTo);
  if (query.reviewState) addCondition("review_state = ?", query.reviewState);
  if (query.hasLatestNote === true) {
    conditions.push("coalesce(nullif(trim(latest_note), ''), null) is not null");
  }
  if (query.hasLatestNote === false) {
    conditions.push("coalesce(nullif(trim(latest_note), ''), null) is null");
  }
  if (query.search) {
    params.push(`%${query.search.toLowerCase()}%`);
    conditions.push(
      `(lower(title) like $${params.length} or lower(source) like $${params.length} or lower(coalesce(latest_note, '')) like $${params.length})`
    );
  }

  return {
    clause: conditions.length > 0 ? `where ${conditions.join(" and ")}` : "",
    params
  };
}

function resolveAlertSort(sortBy: AlertsListQueryContract["sortBy"]): string {
  switch (sortBy) {
    case "createdAt_asc":
      return "created_at asc";
    case "updatedAt_asc":
      return "updated_at asc";
    case "createdAt_desc":
      return "created_at desc";
    case "updatedAt_desc":
    default:
      return "updated_at desc";
  }
}

export function buildAlertByIdQueryPlan(id: string): CompiledQueryPlan {
  return createLookupQueryPlan("alerts.getById", id, {
    statement: `
      select
        id,
        title,
        severity,
        source,
        pond_id,
        status,
        assigned_to,
        review_state,
        review_label,
        latest_note,
        created_at,
        updated_at
      from ${AQUAPULSE_SCHEMA_TABLES.alerts}
      where id = $1
      limit 1
    `.trim()
  });
}

export function buildAlertsListQueryPlan(query: AlertsListQueryContract): CompiledQueryPlan {
  const where = createAlertQueryWhereClause(query);
  const limitParam = where.params.length + 1;
  const offsetParam = where.params.length + 2;
  const offset = (query.page - 1) * query.pageSize;

  return {
    key: "alerts.list",
    statement: `
      select
        id,
        title,
        severity,
        source,
        pond_id,
        status,
        assigned_to,
        review_state,
        review_label,
        latest_note,
        created_at,
        updated_at,
        count(*) over()::int as total_count
      from ${AQUAPULSE_SCHEMA_TABLES.alerts}
      ${where.clause}
      order by ${resolveAlertSort(query.sortBy)}
      limit $${limitParam}
      offset $${offsetParam}
    `.trim(),
    params: [...where.params, query.pageSize, offset],
    pagination: { page: query.page, pageSize: query.pageSize },
    filters: {
      pondId: query.pondId,
      severity: query.severity,
      status: query.status,
      source: query.source,
      assignedTo: query.assignedTo,
      reviewState: query.reviewState,
      hasLatestNote: query.hasLatestNote,
      search: query.search
    }
  };
}

export function buildAlertsSummaryQueryPlan(query: AlertsListQueryContract): CompiledQueryPlan {
  const where = createAlertQueryWhereClause(query);
  return createCompiledQueryPlan({
    key: "alerts.summary",
    statement: `
      with filtered_alerts as (
        select
          id,
          title,
          severity,
          source,
          pond_id,
          status,
          assigned_to,
          review_state,
          review_label,
          latest_note,
          created_at,
          updated_at
        from ${AQUAPULSE_SCHEMA_TABLES.alerts}
        ${where.clause}
      ),
      owner_workload as (
        select
          assigned_to as owner_id,
          count(*)::int as assigned_alerts,
          count(*) filter (where status = 'open')::int as open_alerts,
          count(*) filter (where coalesce(review_state, 'unreviewed') = 'under_review')::int as under_review_alerts,
          count(*) filter (where status <> 'resolved')::int as unresolved_alerts
        from filtered_alerts
        where assigned_to is not null
        group by assigned_to
      )
      select
        count(*)::int as total_alerts,
        count(*) filter (where status = 'open')::int as open_count,
        count(*) filter (where status = 'acknowledged')::int as acknowledged_count,
        count(*) filter (where status = 'resolved')::int as resolved_count,
        count(*) filter (where assigned_to is not null)::int as assigned_count,
        count(*) filter (where assigned_to is null)::int as unassigned_count,
        count(*) filter (where coalesce(review_state, 'unreviewed') = 'unreviewed')::int as unreviewed_count,
        count(*) filter (where coalesce(review_state, 'unreviewed') = 'under_review')::int as under_review_count,
        count(*) filter (where coalesce(review_state, 'unreviewed') = 'reviewed')::int as reviewed_count,
        count(*) filter (where coalesce(review_state, 'unreviewed') = 'deferred')::int as deferred_count,
        count(*) filter (where coalesce(nullif(trim(latest_note), ''), null) is not null)::int as with_latest_note_count,
        count(*) filter (where coalesce(nullif(trim(latest_note), ''), null) is null)::int as without_latest_note_count,
        count(*) filter (where severity = 'low')::int as low_count,
        count(*) filter (where severity = 'medium')::int as medium_count,
        count(*) filter (where severity = 'high')::int as high_count,
        count(*) filter (where severity = 'critical')::int as critical_count,
        coalesce(
          (
            select json_agg(
              json_build_object(
                'ownerId', owner_id,
                'assignedAlerts', assigned_alerts,
                'openAlerts', open_alerts,
                'underReviewAlerts', under_review_alerts,
                'unresolvedAlerts', unresolved_alerts
              )
              order by owner_id
            )
            from owner_workload
          ),
          '[]'::json
        ) as owner_workloads
      from filtered_alerts
    `.trim(),
    params: where.params,
    filters: {
      pondId: query.pondId,
      severity: query.severity,
      status: query.status,
      source: query.source,
      assignedTo: query.assignedTo,
      reviewState: query.reviewState,
      hasLatestNote: query.hasLatestNote,
      search: query.search
    }
  });
}

export function buildOpenAlertsQueryPlan(): CompiledQueryPlan {
  return createCompiledQueryPlan({
    key: "alerts.listOpen",
    statement: `
      select
        id,
        title,
        severity,
        source,
        pond_id,
        status,
        assigned_to,
        review_state,
        review_label,
        latest_note,
        created_at,
        updated_at,
        count(*) over()::int as total_count
      from ${AQUAPULSE_SCHEMA_TABLES.alerts}
      where status = 'open'
      order by updated_at desc
    `.trim(),
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
    const rows = await this.gateway.executeRows<AlertListRow>(buildAlertsListQueryPlan(query));

    if (rows.length === 0) {
      return {
        items: [],
        page: {
          page: query.page,
          pageSize: query.pageSize,
          totalItems: 0,
          totalPages: 1
        }
      };
    }

    const totalItems = rows[0]?.total_count ?? rows.length;

    return {
      items: rows.map((row) => alertRowMapper.toDomain(row)),
      page: {
        page: query.page,
        pageSize: query.pageSize,
        totalItems,
        totalPages: Math.max(1, Math.ceil(totalItems / query.pageSize))
      }
    };
  }

  async summary(query: AlertsListQueryContract): Promise<AlertQueueSummary> {
    const rows = await this.gateway.executeRows<AlertSummaryRow>(buildAlertsSummaryQueryPlan(query));
    const row = rows[0];

    if (!row) {
      return buildAlertQueueSummary([]);
    }

    return {
      totalAlerts: row.total_alerts,
      statusCounts: {
        open: row.open_count,
        acknowledged: row.acknowledged_count,
        resolved: row.resolved_count
      },
      assignmentCounts: {
        assigned: row.assigned_count,
        unassigned: row.unassigned_count
      },
      reviewStateCounts: {
        unreviewed: row.unreviewed_count,
        underReview: row.under_review_count,
        reviewed: row.reviewed_count,
        deferred: row.deferred_count
      },
      noteCounts: {
        withLatestNote: row.with_latest_note_count,
        withoutLatestNote: row.without_latest_note_count
      },
      severityCounts: {
        low: row.low_count,
        medium: row.medium_count,
        high: row.high_count,
        critical: row.critical_count
      },
      ownerWorkloads: row.owner_workloads ?? []
    };
  }

  async listOpen(): Promise<ListResponse<AlertSummary>> {
    const rows = await this.gateway.executeRows<AlertListRow>(buildOpenAlertsQueryPlan());
    return {
      items: rows.length > 0 ? rows.map((row) => alertRowMapper.toDomain(row)) : [alertRowMapper.toDomain(createPlaceholderAlertRow())],
      page: {
        page: 1,
        pageSize: 20,
        totalItems: rows[0]?.total_count ?? (rows.length > 0 ? rows.length : 1),
        totalPages: 1
      }
    };
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
    "use real SQL for getById and list against the alerts table with opt-in Postgres execution",
    "translate severity/source/status/assignment/review/note filters into parameterized where clauses",
    "derive queue summary counts from a real SQL aggregate query over the filtered alert set",
    "keep the open-alerts path as a dedicated read slice for alert-engine compatibility"
  ],
  mappingNotes: [
    "map alert rows into AlertSummary via the shared row mapper",
    "shape create/update DTO inputs into alert row write payloads",
    "align SQL reads with the alerts and latest_note schema columns"
  ]
} as const;
