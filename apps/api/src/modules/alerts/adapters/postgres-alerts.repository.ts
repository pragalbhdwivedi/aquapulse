import { Injectable } from "@nestjs/common";
import {
  AQUAPULSE_SCHEMA_TABLES,
  PlaceholderDatabaseConnectionFactory,
  PostgresRowGateway,
  alertActionHistoryRowMapper,
  alertRowMapper,
  alertSavedViewRowMapper,
  createCompiledQueryPlan,
  createLookupQueryPlan,
  createMutationQueryPlan,
  createPlaceholderAlertActionHistoryRow,
  createPlaceholderAlertRow,
  createPlaceholderAlertSavedViewRow,
  mapCreateAlertInputToRowWrite,
  mapCreateAlertSavedViewInputToRowWrite,
  mapUpdateAlertInputToRowPatch,
  type AlertActionHistoryRow,
  type AlertRow,
  type AlertRowPatch,
  type AlertRowWrite,
  type AlertSavedViewRow,
  type AlertSavedViewRowWrite,
  type CompiledQueryPlan,
  type DatabaseConfig,
  type DatabaseClient,
  type DatabaseTransaction,
  type DatabaseConnectionFactory
} from "@aquapulse/database";
import type {
  AlertAssignActionRequest,
  AlertBulkActionResult,
  AlertBulkAssignActionRequest,
  AlertBulkLifecycleActionRequest,
  AlertBulkReviewStateActionRequest,
  AlertActionHistoryItem,
  AlertExplanationAttachmentRequest,
  AlertLifecycleActionRequest,
  AlertQueueSummary,
  AlertReviewStateActionRequest,
  AlertSavedViewCreateRequest,
  AlertSavedViewDefinition,
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

type AlertWriteExecutor = Pick<DatabaseClient, "query"> | DatabaseTransaction;

interface AlertMutationPlans {
  readonly update: CompiledQueryPlan;
  readonly historyInsert: CompiledQueryPlan;
  readonly historyRead: CompiledQueryPlan;
}

const ALERT_SELECT_COLUMNS = `
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
`.trim();

const ALERT_HISTORY_SELECT_COLUMNS = `
  id,
  alert_id,
  action,
  note,
  assigned_to,
  review_state,
  review_label,
  created_at
`.trim();

const ALERT_SAVED_VIEW_SELECT_COLUMNS = `
  id,
  name,
  preset_id,
  filter_query,
  created_at,
  updated_at
`.trim();

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
      return "created_at asc, id asc";
    case "updatedAt_asc":
      return "updated_at asc, id asc";
    case "createdAt_desc":
      return "created_at desc, id desc";
    case "updatedAt_desc":
    default:
      return "updated_at desc, id desc";
  }
}

export function buildAlertByIdQueryPlan(id: string): CompiledQueryPlan {
  return createLookupQueryPlan("alerts.getById", id, {
    statement: `
      select
        ${ALERT_SELECT_COLUMNS}
      from ${AQUAPULSE_SCHEMA_TABLES.alerts}
      where id = $1
      limit 1
    `.trim()
  });
}

export function buildAlertActionHistoryByAlertIdQueryPlan(id: string): CompiledQueryPlan {
  return createLookupQueryPlan("alerts.actionHistory.list", id, {
    statement: `
      select
        ${ALERT_HISTORY_SELECT_COLUMNS}
      from ${AQUAPULSE_SCHEMA_TABLES.alertActionHistory}
      where alert_id = $1
      order by created_at asc, id asc
    `.trim()
  });
}

export function buildListAlertSavedViewsQueryPlan(): CompiledQueryPlan {
  return createCompiledQueryPlan({
    key: "alerts.savedViews.list",
    statement: `
      select
        ${ALERT_SAVED_VIEW_SELECT_COLUMNS}
      from ${AQUAPULSE_SCHEMA_TABLES.savedAlertViews}
      order by updated_at desc, name asc
    `.trim(),
    params: []
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
      order by updated_at desc, id desc
    `.trim(),
    params: [],
    filters: { status: "open" }
  });
}

export function buildSaveAlertSavedViewQueryPlan(row: AlertSavedViewRowWrite): CompiledQueryPlan {
  return createCompiledQueryPlan({
    key: "alerts.savedViews.save",
    statement: `
      insert into ${AQUAPULSE_SCHEMA_TABLES.savedAlertViews} (
        id,
        name,
        preset_id,
        filter_query,
        created_at,
        updated_at
      )
      values ($1, $2, $3, $4, $5, $6)
      returning ${ALERT_SAVED_VIEW_SELECT_COLUMNS}
    `.trim(),
    params: [
      row.id,
      row.name,
      row.preset_id ?? null,
      row.filter_query,
      row.created_at,
      row.updated_at
    ],
    filters: {
      id: row.id,
      name: row.name
    }
  });
}

export function buildRemoveAlertSavedViewQueryPlan(id: string): CompiledQueryPlan {
  return createCompiledQueryPlan({
    key: "alerts.savedViews.remove",
    statement: `
      delete from ${AQUAPULSE_SCHEMA_TABLES.savedAlertViews}
      where id = $1
    `.trim(),
    params: [id],
    filters: { id }
  });
}

function createAlertHistoryId(
  alertId: string,
  action: AlertActionHistoryItem["action"],
  occurredAt: string
): string {
  return `${alertId}:${action}:${occurredAt}`.replace(/[^a-zA-Z0-9:_-]/g, "-");
}

function formatAttachedExplanationNote(input: AlertExplanationAttachmentRequest): string {
  const detailParts = [
    `AI explanation snapshot (${input.explanation.metadata.mode}/${input.explanation.metadata.modelLabel}/${input.explanation.cache.generation})`,
    input.explanation.summary,
    input.explanation.feedbackSummary?.latest
      ? `Feedback: ${input.explanation.feedbackSummary.latest.value}`
      : undefined,
    input.explanation.recommendedChecks[0]?.title
      ? `Next check: ${input.explanation.recommendedChecks[0].title}`
      : undefined,
    input.explanation.suggestedActions[0]?.title
      ? `Suggested action: ${input.explanation.suggestedActions[0].title}`
      : undefined,
    input.note?.trim() ? `Operator note: ${input.note.trim()}` : undefined
  ].filter(Boolean);

  return detailParts.join(" | ");
}

function buildAlertMutationQueryPlan(
  key: string,
  statement: string,
  params: readonly unknown[],
  filters: Readonly<Record<string, unknown>>
): CompiledQueryPlan {
  return createCompiledQueryPlan({
    key,
    statement,
    params,
    filters
  });
}

function buildAlertHistoryInsertQueryPlan(row: AlertActionHistoryRow): CompiledQueryPlan {
  return createCompiledQueryPlan({
    key: "alerts.actionHistory.insert",
    statement: `
      insert into ${AQUAPULSE_SCHEMA_TABLES.alertActionHistory} (
        id,
        alert_id,
        action,
        note,
        assigned_to,
        review_state,
        review_label,
        created_at
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8)
    `.trim(),
    params: [
      row.id,
      row.alert_id,
      row.action,
      row.note ?? null,
      row.assigned_to ?? null,
      row.review_state ?? null,
      row.review_label ?? null,
      row.created_at
    ],
    filters: {
      alertId: row.alert_id,
      action: row.action
    }
  });
}

export function buildAcknowledgeAlertQueryPlans(
  id: string,
  input: AlertLifecycleActionRequest,
  occurredAt: string
): AlertMutationPlans {
  const historyRow = createPlaceholderAlertActionHistoryRow({
    id: createAlertHistoryId(id, "acknowledged", occurredAt),
    alert_id: id,
    action: "acknowledged",
    note: input.note,
    created_at: occurredAt
  });

  return {
    update: buildAlertMutationQueryPlan(
      "alerts.acknowledge",
      `
        update ${AQUAPULSE_SCHEMA_TABLES.alerts}
        set
          status = 'acknowledged',
          latest_note = case when $2::text is null then latest_note else $2 end,
          updated_at = $3
        where id = $1
        returning ${ALERT_SELECT_COLUMNS}
      `.trim(),
      [id, input.note ?? null, occurredAt],
      { id, status: "acknowledged" }
    ),
    historyInsert: buildAlertHistoryInsertQueryPlan(historyRow),
    historyRead: buildAlertActionHistoryByAlertIdQueryPlan(id)
  };
}

export function buildResolveAlertQueryPlans(
  id: string,
  input: AlertLifecycleActionRequest,
  occurredAt: string
): AlertMutationPlans {
  const historyRow = createPlaceholderAlertActionHistoryRow({
    id: createAlertHistoryId(id, "resolved", occurredAt),
    alert_id: id,
    action: "resolved",
    note: input.note,
    created_at: occurredAt
  });

  return {
    update: buildAlertMutationQueryPlan(
      "alerts.resolve",
      `
        update ${AQUAPULSE_SCHEMA_TABLES.alerts}
        set
          status = 'resolved',
          latest_note = case when $2::text is null then latest_note else $2 end,
          updated_at = $3
        where id = $1
        returning ${ALERT_SELECT_COLUMNS}
      `.trim(),
      [id, input.note ?? null, occurredAt],
      { id, status: "resolved" }
    ),
    historyInsert: buildAlertHistoryInsertQueryPlan(historyRow),
    historyRead: buildAlertActionHistoryByAlertIdQueryPlan(id)
  };
}

export function buildAssignAlertQueryPlans(
  id: string,
  input: AlertAssignActionRequest,
  occurredAt: string
): AlertMutationPlans {
  const historyRow = createPlaceholderAlertActionHistoryRow({
    id: createAlertHistoryId(id, "assigned", occurredAt),
    alert_id: id,
    action: "assigned",
    note: input.note,
    assigned_to: input.assignedTo,
    review_state: "under_review",
    created_at: occurredAt
  });

  return {
    update: buildAlertMutationQueryPlan(
      "alerts.assign",
      `
        update ${AQUAPULSE_SCHEMA_TABLES.alerts}
        set
          assigned_to = $2,
          review_state = 'under_review',
          latest_note = case when $3::text is null then latest_note else $3 end,
          updated_at = $4
        where id = $1
        returning ${ALERT_SELECT_COLUMNS}
      `.trim(),
      [id, input.assignedTo, input.note ?? null, occurredAt],
      { id, assignedTo: input.assignedTo, reviewState: "under_review" }
    ),
    historyInsert: buildAlertHistoryInsertQueryPlan(historyRow),
    historyRead: buildAlertActionHistoryByAlertIdQueryPlan(id)
  };
}

export function buildUnassignAlertQueryPlans(
  id: string,
  input: AlertUnassignActionRequest,
  occurredAt: string
): AlertMutationPlans {
  const historyRow = createPlaceholderAlertActionHistoryRow({
    id: createAlertHistoryId(id, "unassigned", occurredAt),
    alert_id: id,
    action: "unassigned",
    note: input.note,
    created_at: occurredAt
  });

  return {
    update: buildAlertMutationQueryPlan(
      "alerts.unassign",
      `
        update ${AQUAPULSE_SCHEMA_TABLES.alerts}
        set
          assigned_to = null,
          latest_note = case when $2::text is null then latest_note else $2 end,
          updated_at = $3
        where id = $1
        returning ${ALERT_SELECT_COLUMNS}
      `.trim(),
      [id, input.note ?? null, occurredAt],
      { id, assignedTo: null }
    ),
    historyInsert: buildAlertHistoryInsertQueryPlan(historyRow),
    historyRead: buildAlertActionHistoryByAlertIdQueryPlan(id)
  };
}

export function buildSetAlertReviewStateQueryPlans(
  id: string,
  input: AlertReviewStateActionRequest,
  occurredAt: string
): AlertMutationPlans {
  const historyRow = createPlaceholderAlertActionHistoryRow({
    id: createAlertHistoryId(id, "review_state_changed", occurredAt),
    alert_id: id,
    action: "review_state_changed",
    note: input.note,
    review_state: input.reviewState,
    review_label: input.reviewLabel,
    created_at: occurredAt
  });

  return {
    update: buildAlertMutationQueryPlan(
      "alerts.setReviewState",
      `
        update ${AQUAPULSE_SCHEMA_TABLES.alerts}
        set
          review_state = $2,
          review_label = $3,
          latest_note = case when $4::text is null then latest_note else $4 end,
          updated_at = $5
        where id = $1
        returning ${ALERT_SELECT_COLUMNS}
      `.trim(),
      [id, input.reviewState, input.reviewLabel ?? null, input.note ?? null, occurredAt],
      { id, reviewState: input.reviewState, reviewLabel: input.reviewLabel }
    ),
    historyInsert: buildAlertHistoryInsertQueryPlan(historyRow),
    historyRead: buildAlertActionHistoryByAlertIdQueryPlan(id)
  };
}

export function buildAttachExplanationQueryPlans(
  id: string,
  input: AlertExplanationAttachmentRequest,
  occurredAt: string
): AlertMutationPlans {
  const note = formatAttachedExplanationNote(input);
  const historyRow = createPlaceholderAlertActionHistoryRow({
    id: createAlertHistoryId(id, "ai_explanation_snapshot", occurredAt),
    alert_id: id,
    action: "ai_explanation_snapshot",
    note,
    created_at: occurredAt
  });

  return {
    update: buildAlertMutationQueryPlan(
      "alerts.attachExplanation",
      `
        update ${AQUAPULSE_SCHEMA_TABLES.alerts}
        set
          latest_note = $2,
          updated_at = $3
        where id = $1
        returning ${ALERT_SELECT_COLUMNS}
      `.trim(),
      [id, note, occurredAt],
      { id, latestNote: note }
    ),
    historyInsert: buildAlertHistoryInsertQueryPlan(historyRow),
    historyRead: buildAlertActionHistoryByAlertIdQueryPlan(id)
  };
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
    return this.executeAlertMutation(
      id,
      buildAcknowledgeAlertQueryPlans(id, _input, new Date().toISOString()),
      {
        status: "acknowledged",
        latestNote: _input.note
      },
      {
        action: "acknowledged",
        note: _input.note
      }
    );
  }

  async bulkAcknowledge(input: AlertBulkLifecycleActionRequest): Promise<AlertBulkActionResult> {
    const occurredAt = new Date().toISOString();
    return this.executeBulkAlertMutation(input.alertIds, occurredAt, (alertId, timestamp) => ({
      plans: buildAcknowledgeAlertQueryPlans(alertId, { note: input.note }, timestamp),
      fallbackPatch: {
        status: "acknowledged",
        latestNote: input.note
      },
      fallbackHistory: {
        action: "acknowledged",
        note: input.note
      }
    }));
  }

  async resolve(id: string, _input: AlertLifecycleActionRequest): Promise<AlertSummary> {
    return this.executeAlertMutation(
      id,
      buildResolveAlertQueryPlans(id, _input, new Date().toISOString()),
      {
        status: "resolved",
        latestNote: _input.note
      },
      {
        action: "resolved",
        note: _input.note
      }
    );
  }

  async bulkResolve(input: AlertBulkLifecycleActionRequest): Promise<AlertBulkActionResult> {
    const occurredAt = new Date().toISOString();
    return this.executeBulkAlertMutation(input.alertIds, occurredAt, (alertId, timestamp) => ({
      plans: buildResolveAlertQueryPlans(alertId, { note: input.note }, timestamp),
      fallbackPatch: {
        status: "resolved",
        latestNote: input.note
      },
      fallbackHistory: {
        action: "resolved",
        note: input.note
      }
    }));
  }

  async assign(id: string, _input: AlertAssignActionRequest): Promise<AlertSummary> {
    return this.executeAlertMutation(
      id,
      buildAssignAlertQueryPlans(id, _input, new Date().toISOString()),
      {
        assignedTo: _input.assignedTo,
        reviewState: "under_review",
        latestNote: _input.note
      },
      {
        action: "assigned",
        note: _input.note,
        assignedTo: _input.assignedTo,
        reviewState: "under_review"
      }
    );
  }

  async bulkAssign(input: AlertBulkAssignActionRequest): Promise<AlertBulkActionResult> {
    const occurredAt = new Date().toISOString();
    return this.executeBulkAlertMutation(input.alertIds, occurredAt, (alertId, timestamp) => ({
      plans: buildAssignAlertQueryPlans(
        alertId,
        { assignedTo: input.assignedTo, note: input.note },
        timestamp
      ),
      fallbackPatch: {
        assignedTo: input.assignedTo,
        reviewState: "under_review",
        latestNote: input.note
      },
      fallbackHistory: {
        action: "assigned",
        note: input.note,
        assignedTo: input.assignedTo,
        reviewState: "under_review"
      }
    }));
  }

  async unassign(id: string, _input: AlertUnassignActionRequest): Promise<AlertSummary> {
    return this.executeAlertMutation(
      id,
      buildUnassignAlertQueryPlans(id, _input, new Date().toISOString()),
      {
        assignedTo: undefined,
        latestNote: _input.note
      },
      {
        action: "unassigned",
        note: _input.note
      }
    );
  }

  async setReviewState(id: string, _input: AlertReviewStateActionRequest): Promise<AlertSummary> {
    return this.executeAlertMutation(
      id,
      buildSetAlertReviewStateQueryPlans(id, _input, new Date().toISOString()),
      {
        reviewState: _input.reviewState,
        reviewLabel: _input.reviewLabel,
        latestNote: _input.note
      },
      {
        action: "review_state_changed",
        note: _input.note,
        reviewState: _input.reviewState,
        reviewLabel: _input.reviewLabel
      }
    );
  }

  async bulkSetReviewState(
    input: AlertBulkReviewStateActionRequest
  ): Promise<AlertBulkActionResult> {
    const occurredAt = new Date().toISOString();
    return this.executeBulkAlertMutation(input.alertIds, occurredAt, (alertId, timestamp) => ({
      plans: buildSetAlertReviewStateQueryPlans(
        alertId,
        {
          reviewState: input.reviewState,
          reviewLabel: input.reviewLabel,
          note: input.note
        },
        timestamp
      ),
      fallbackPatch: {
        reviewState: input.reviewState,
        reviewLabel: input.reviewLabel,
        latestNote: input.note
      },
      fallbackHistory: {
        action: "review_state_changed",
        note: input.note,
        reviewState: input.reviewState,
        reviewLabel: input.reviewLabel
      }
    }));
  }

  async attachExplanation(id: string, input: AlertExplanationAttachmentRequest): Promise<AlertSummary> {
    const note = formatAttachedExplanationNote(input);
    return this.executeAlertMutation(
      id,
      buildAttachExplanationQueryPlans(id, input, input.explanation.cache.cachedAt),
      {
        latestNote: note
      },
      {
        action: "ai_explanation_snapshot",
        note
      }
    );
  }

  async listSavedViews(): Promise<AlertSavedViewDefinition[]> {
    const rows = await this.gateway.executeRows<AlertSavedViewRow>(buildListAlertSavedViewsQueryPlan());
    return rows.map((row) => alertSavedViewRowMapper.toDomain(row));
  }

  async saveSavedView(input: AlertSavedViewCreateRequest): Promise<AlertSavedViewDefinition[]> {
    const client = await this.connectionFactory.create(this.databaseConfig);

    try {
      return await client.transaction(async (transaction) => {
        const row = mapCreateAlertSavedViewInputToRowWrite(input, new Date().toISOString());
        await this.executeRowsWithClient<AlertSavedViewRow>(
          transaction,
          buildSaveAlertSavedViewQueryPlan(row)
        );
        const views = await this.executeRowsWithClient<AlertSavedViewRow>(
          transaction,
          buildListAlertSavedViewsQueryPlan()
        );

        return views.length > 0
          ? views.map((view) => alertSavedViewRowMapper.toDomain(view))
          : [alertSavedViewRowMapper.toDomain(createPlaceholderAlertSavedViewRow({ id: row.id, name: row.name, preset_id: row.preset_id, filter_query: row.filter_query }))];
      });
    } finally {
      await client.dispose();
    }
  }

  async removeSavedView(id: string): Promise<AlertSavedViewDefinition[]> {
    const client = await this.connectionFactory.create(this.databaseConfig);

    try {
      return await client.transaction(async (transaction) => {
        await this.executeRowsWithClient(transaction, buildRemoveAlertSavedViewQueryPlan(id));
        const views = await this.executeRowsWithClient<AlertSavedViewRow>(
          transaction,
          buildListAlertSavedViewsQueryPlan()
        );

        return views.map((view) => alertSavedViewRowMapper.toDomain(view));
      });
    } finally {
      await client.dispose();
    }
  }

  async getById(id: string): Promise<AlertSummary> {
    const client = await this.connectionFactory.create(this.databaseConfig);

    try {
      const alertRows = await this.executeRowsWithClient<AlertRow>(client, buildAlertByIdQueryPlan(id));
      const historyRows = await this.executeRowsWithClient<AlertActionHistoryRow>(
        client,
        buildAlertActionHistoryByAlertIdQueryPlan(id)
      );

      return this.buildAlertSummary(
        alertRows[0],
        historyRows,
        createPlaceholderAlertRow({ id })
      );
    } finally {
      await client.dispose();
    }
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

  private async executeAlertMutation(
    id: string,
    plans: AlertMutationPlans,
    fallbackPatch: Partial<AlertSummary>,
    fallbackHistory: Omit<AlertActionHistoryItem, "timestamp">
  ): Promise<AlertSummary> {
    const client = await this.connectionFactory.create(this.databaseConfig);
    const fallbackRow = createPlaceholderAlertRow({
      id,
      status: fallbackPatch.status,
      assigned_to: fallbackPatch.assignedTo,
      review_state: fallbackPatch.reviewState,
      review_label: fallbackPatch.reviewLabel,
      latest_note: fallbackPatch.latestNote
    });

    try {
      return await client.transaction(async (transaction) => {
        return this.executeAlertMutationWithExecutor(
          transaction,
          fallbackRow,
          plans,
          {
            ...fallbackHistory,
            timestamp: fallbackRow.updated_at
          }
        );
      });
    } finally {
      await client.dispose();
    }
  }

  private async executeBulkAlertMutation(
    alertIds: readonly string[],
    occurredAt: string,
    createMutation: (
      alertId: string,
      occurredAt: string
    ) => {
      readonly plans: AlertMutationPlans;
      readonly fallbackPatch: Partial<AlertSummary>;
      readonly fallbackHistory: Omit<AlertActionHistoryItem, "timestamp">;
    }
  ): Promise<AlertBulkActionResult> {
    const client = await this.connectionFactory.create(this.databaseConfig);

    try {
      return await client.transaction(async (transaction) => {
        const updatedAlerts: AlertSummary[] = [];

        for (const alertId of alertIds) {
          const mutation = createMutation(alertId, occurredAt);
          const fallbackRow = createPlaceholderAlertRow({
            id: alertId,
            status: mutation.fallbackPatch.status,
            assigned_to: mutation.fallbackPatch.assignedTo,
            review_state: mutation.fallbackPatch.reviewState,
            review_label: mutation.fallbackPatch.reviewLabel,
            latest_note: mutation.fallbackPatch.latestNote
          });

          updatedAlerts.push(
            await this.executeAlertMutationWithExecutor(
              transaction,
              fallbackRow,
              mutation.plans,
              {
                ...mutation.fallbackHistory,
                timestamp: fallbackRow.updated_at
              }
            )
          );
        }

        return {
          updatedAlerts,
          totalRequested: alertIds.length,
          totalUpdated: updatedAlerts.length
        };
      });
    } finally {
      await client.dispose();
    }
  }

  private async executeAlertMutationWithExecutor(
    executor: AlertWriteExecutor,
    fallbackRow: AlertRow,
    plans: AlertMutationPlans,
    fallbackHistory: AlertActionHistoryItem
  ): Promise<AlertSummary> {
    const updatedRows = await this.executeRowsWithClient<AlertRow>(executor, plans.update);
    await this.executeRowsWithClient(executor, plans.historyInsert);
    const historyRows = await this.executeRowsWithClient<AlertActionHistoryRow>(
      executor,
      plans.historyRead
    );

    return this.buildAlertSummary(
      updatedRows[0],
      historyRows,
      fallbackRow,
      fallbackHistory
    );
  }

  private async executeRowsWithClient<TRow>(
    executor: AlertWriteExecutor,
    plan: CompiledQueryPlan
  ): Promise<TRow[]> {
    const result = await executor.query<TRow>(plan.statement, plan.params);
    return result.rows;
  }

  private buildAlertSummary(
    alertRow: AlertRow | undefined,
    historyRows: readonly AlertActionHistoryRow[],
    fallbackRow: AlertRow,
    fallbackHistory?: AlertActionHistoryItem
  ): AlertSummary {
    const summary = alertRowMapper.toDomain(alertRow ?? fallbackRow);
    const mappedHistory = historyRows.map((row) => alertActionHistoryRowMapper.toDomain(row));

    return {
      ...summary,
      actionHistory:
        mappedHistory.length > 0 ? mappedHistory : fallbackHistory ? [fallbackHistory] : summary.actionHistory
    };
  }
}

export const POSTGRES_ALERTS_IMPLEMENTATION_PLAN = {
  readMethods: ["getById", "list", "listOpen", "summary"],
  writeMethods: [
    "create",
    "update",
    "acknowledge",
    "bulkAcknowledge",
    "resolve",
    "bulkResolve",
    "assign",
    "bulkAssign",
    "unassign",
    "setReviewState",
    "bulkSetReviewState",
    "attachExplanation",
    "saveSavedView",
    "removeSavedView"
  ],
  rowSource: "alerts",
  queryNotes: [
    "use real SQL for getById and list against the alerts table with opt-in Postgres execution",
    "translate severity/source/status/assignment/review/note filters into parameterized where clauses",
    "derive queue summary counts from a real SQL aggregate query over the filtered alert set",
    "keep the open-alerts path as a dedicated read slice for alert-engine compatibility",
    "load alert action history rows separately for detail reads and mutation results",
    "persist saved alert views through the saved_alert_views table with opt-in Postgres execution"
  ],
  mappingNotes: [
    "map alert rows into AlertSummary via the shared row mapper",
    "shape create/update DTO inputs into alert row write payloads",
    "align SQL reads with the alerts and latest_note schema columns",
    "persist lifecycle and triage actions into alert_action_history and map them back into actionHistory",
    "map saved alert view rows into AlertSavedViewDefinition via the shared row mapper"
  ]
} as const;
