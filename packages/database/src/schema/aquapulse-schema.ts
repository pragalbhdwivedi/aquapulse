export interface DatabaseColumnDefinition {
  readonly name: string;
  readonly type: string;
  readonly nullable?: boolean;
  readonly primaryKey?: boolean;
  readonly unique?: boolean;
  readonly defaultExpression?: string;
}

export interface DatabaseForeignKeyDefinition {
  readonly column: string;
  readonly referencesTable: string;
  readonly referencesColumn: string;
  readonly onDelete?: "cascade" | "set null" | "restrict";
}

export interface DatabaseTableDefinition {
  readonly name: string;
  readonly columns: readonly DatabaseColumnDefinition[];
  readonly foreignKeys?: readonly DatabaseForeignKeyDefinition[];
  readonly indexes?: readonly string[];
}

export const AQUAPULSE_SCHEMA_TABLES = {
  ponds: "ponds",
  pondResponsibilities: "pond_responsibilities",
  waterQuality: "water_quality",
  feedEntries: "feed_entries",
  tasks: "tasks",
  alerts: "alerts",
  alertActionHistory: "alert_action_history",
  savedAlertViews: "saved_alert_views",
  auditEvents: "audit_events",
  auditEventMetadata: "audit_event_metadata",
  aiRequests: "ai_requests",
  aiResponses: "ai_responses",
  aiFeedback: "ai_feedback"
} as const;

export const aquaPulseSchemaTables: readonly DatabaseTableDefinition[] = [
  {
    name: AQUAPULSE_SCHEMA_TABLES.ponds,
    columns: [
      { name: "id", type: "text", primaryKey: true },
      { name: "name", type: "text" },
      { name: "code", type: "text", unique: true },
      { name: "farm_id", type: "text" },
      { name: "kind", type: "text" },
      { name: "status", type: "text" },
      { name: "created_at", type: "timestamptz", defaultExpression: "CURRENT_TIMESTAMP" },
      { name: "updated_at", type: "timestamptz", defaultExpression: "CURRENT_TIMESTAMP" }
    ]
  },
  {
    name: AQUAPULSE_SCHEMA_TABLES.pondResponsibilities,
    columns: [
      { name: "id", type: "text", primaryKey: true },
      { name: "user_id", type: "text" },
      { name: "pond_id", type: "text" },
      { name: "responsibility_type", type: "text" },
      { name: "active", type: "boolean", defaultExpression: "true" },
      { name: "starts_at", type: "timestamptz", nullable: true },
      { name: "ends_at", type: "timestamptz", nullable: true },
      { name: "created_at", type: "timestamptz", defaultExpression: "CURRENT_TIMESTAMP" },
      { name: "updated_at", type: "timestamptz", defaultExpression: "CURRENT_TIMESTAMP" }
    ],
    foreignKeys: [
      {
        column: "pond_id",
        referencesTable: AQUAPULSE_SCHEMA_TABLES.ponds,
        referencesColumn: "id",
        onDelete: "cascade"
      }
    ],
    indexes: [
      "idx_pond_responsibilities_user_active_pond",
      "idx_pond_responsibilities_pond_active_user"
    ]
  },
  {
    name: AQUAPULSE_SCHEMA_TABLES.waterQuality,
    columns: [
      { name: "id", type: "text", primaryKey: true },
      { name: "pond_id", type: "text" },
      { name: "recorded_at", type: "timestamptz" },
      { name: "temperature_c", type: "numeric", nullable: true },
      { name: "ph", type: "numeric", nullable: true },
      { name: "created_at", type: "timestamptz", defaultExpression: "CURRENT_TIMESTAMP" },
      { name: "updated_at", type: "timestamptz", defaultExpression: "CURRENT_TIMESTAMP" }
    ],
    foreignKeys: [
      {
        column: "pond_id",
        referencesTable: AQUAPULSE_SCHEMA_TABLES.ponds,
        referencesColumn: "id",
        onDelete: "cascade"
      }
    ],
    indexes: ["idx_water_quality_pond_recorded_at"]
  },
  {
    name: AQUAPULSE_SCHEMA_TABLES.feedEntries,
    columns: [
      { name: "id", type: "text", primaryKey: true },
      { name: "pond_id", type: "text" },
      { name: "batch_id", type: "text", nullable: true },
      { name: "feed_type", type: "text" },
      { name: "quantity_kg", type: "numeric" },
      { name: "fed_at", type: "timestamptz" },
      { name: "created_at", type: "timestamptz", defaultExpression: "CURRENT_TIMESTAMP" },
      { name: "updated_at", type: "timestamptz", defaultExpression: "CURRENT_TIMESTAMP" }
    ],
    foreignKeys: [
      {
        column: "pond_id",
        referencesTable: AQUAPULSE_SCHEMA_TABLES.ponds,
        referencesColumn: "id",
        onDelete: "cascade"
      }
    ],
    indexes: ["idx_feed_entries_pond_fed_at"]
  },
  {
    name: AQUAPULSE_SCHEMA_TABLES.tasks,
    columns: [
      { name: "id", type: "text", primaryKey: true },
      { name: "title", type: "text" },
      { name: "status", type: "text" },
      { name: "assignee_id", type: "text", nullable: true },
      { name: "pond_id", type: "text", nullable: true },
      { name: "created_at", type: "timestamptz", defaultExpression: "CURRENT_TIMESTAMP" },
      { name: "updated_at", type: "timestamptz", defaultExpression: "CURRENT_TIMESTAMP" }
    ],
    foreignKeys: [
      {
        column: "pond_id",
        referencesTable: AQUAPULSE_SCHEMA_TABLES.ponds,
        referencesColumn: "id",
        onDelete: "set null"
      }
    ],
    indexes: ["idx_tasks_status_assignee"]
  },
  {
    name: AQUAPULSE_SCHEMA_TABLES.alerts,
    columns: [
      { name: "id", type: "text", primaryKey: true },
      { name: "title", type: "text" },
      { name: "severity", type: "text" },
      { name: "source", type: "text" },
      { name: "pond_id", type: "text", nullable: true },
      { name: "status", type: "text" },
      { name: "assigned_to", type: "text", nullable: true },
      { name: "review_state", type: "text", nullable: true },
      { name: "review_label", type: "text", nullable: true },
      { name: "latest_note", type: "text", nullable: true },
      { name: "created_at", type: "timestamptz", defaultExpression: "CURRENT_TIMESTAMP" },
      { name: "updated_at", type: "timestamptz", defaultExpression: "CURRENT_TIMESTAMP" }
    ],
    foreignKeys: [
      {
        column: "pond_id",
        referencesTable: AQUAPULSE_SCHEMA_TABLES.ponds,
        referencesColumn: "id",
        onDelete: "set null"
      }
    ],
    indexes: ["idx_alerts_status_assigned_review", "idx_alerts_pond_created_at"]
  },
  {
    name: AQUAPULSE_SCHEMA_TABLES.alertActionHistory,
    columns: [
      { name: "id", type: "text", primaryKey: true },
      { name: "alert_id", type: "text" },
      { name: "action", type: "text" },
      { name: "note", type: "text", nullable: true },
      { name: "assigned_to", type: "text", nullable: true },
      { name: "review_state", type: "text", nullable: true },
      { name: "review_label", type: "text", nullable: true },
      { name: "created_at", type: "timestamptz", defaultExpression: "CURRENT_TIMESTAMP" }
    ],
    foreignKeys: [
      {
        column: "alert_id",
        referencesTable: AQUAPULSE_SCHEMA_TABLES.alerts,
        referencesColumn: "id",
        onDelete: "cascade"
      }
    ],
    indexes: ["idx_alert_action_history_alert_created_at"]
  },
  {
    name: AQUAPULSE_SCHEMA_TABLES.savedAlertViews,
    columns: [
      { name: "id", type: "text", primaryKey: true },
      { name: "name", type: "text" },
      { name: "preset_id", type: "text", nullable: true },
      { name: "filter_query", type: "jsonb", defaultExpression: "'{}'::jsonb" },
      { name: "created_at", type: "timestamptz", defaultExpression: "CURRENT_TIMESTAMP" },
      { name: "updated_at", type: "timestamptz", defaultExpression: "CURRENT_TIMESTAMP" }
    ]
  },
  {
    name: AQUAPULSE_SCHEMA_TABLES.auditEvents,
    columns: [
      { name: "id", type: "text", primaryKey: true },
      { name: "action", type: "text" },
      { name: "resource_type", type: "text" },
      { name: "resource_id", type: "text", nullable: true },
      { name: "summary", type: "text" },
      { name: "created_at", type: "timestamptz", defaultExpression: "CURRENT_TIMESTAMP" },
      { name: "updated_at", type: "timestamptz", defaultExpression: "CURRENT_TIMESTAMP" }
    ],
    indexes: ["idx_audit_events_resource_created_at", "idx_audit_events_action_created_at"]
  },
  {
    name: AQUAPULSE_SCHEMA_TABLES.auditEventMetadata,
    columns: [
      { name: "id", type: "text", primaryKey: true },
      { name: "audit_event_id", type: "text", unique: true },
      { name: "request_id", type: "text", nullable: true },
      { name: "correlation_id", type: "text", nullable: true },
      { name: "actor_id", type: "text", nullable: true },
      { name: "http_method", type: "text", nullable: true },
      { name: "request_path", type: "text", nullable: true },
      { name: "status_code", type: "integer", nullable: true },
      { name: "created_at", type: "timestamptz", defaultExpression: "CURRENT_TIMESTAMP" },
      { name: "updated_at", type: "timestamptz", defaultExpression: "CURRENT_TIMESTAMP" }
    ],
    foreignKeys: [
      {
        column: "audit_event_id",
        referencesTable: AQUAPULSE_SCHEMA_TABLES.auditEvents,
        referencesColumn: "id",
        onDelete: "cascade"
      }
    ],
    indexes: ["idx_audit_event_metadata_actor_created_at", "idx_audit_event_metadata_request_id"]
  },
  {
    name: AQUAPULSE_SCHEMA_TABLES.aiRequests,
    columns: [
      { name: "id", type: "text", primaryKey: true },
      { name: "request_type", type: "text" },
      { name: "requested_by", type: "text", nullable: true },
      { name: "input_payload", type: "jsonb", defaultExpression: "'{}'::jsonb" },
      { name: "status", type: "text" },
      { name: "created_at", type: "timestamptz", defaultExpression: "CURRENT_TIMESTAMP" },
      { name: "updated_at", type: "timestamptz", defaultExpression: "CURRENT_TIMESTAMP" }
    ],
    indexes: ["idx_ai_requests_type_status_created_at", "idx_ai_requests_requested_by_created_at"]
  },
  {
    name: AQUAPULSE_SCHEMA_TABLES.aiResponses,
    columns: [
      { name: "id", type: "text", primaryKey: true },
      { name: "request_id", type: "text" },
      { name: "status", type: "text" },
      { name: "output_text", type: "text" },
      { name: "model", type: "text" },
      { name: "created_at", type: "timestamptz", defaultExpression: "CURRENT_TIMESTAMP" },
      { name: "updated_at", type: "timestamptz", defaultExpression: "CURRENT_TIMESTAMP" }
    ],
    foreignKeys: [
      {
        column: "request_id",
        referencesTable: AQUAPULSE_SCHEMA_TABLES.aiRequests,
        referencesColumn: "id",
        onDelete: "cascade"
      }
    ],
    indexes: [
      "idx_ai_responses_request_created_at",
      "idx_ai_responses_status_created_at",
      "idx_ai_responses_model_created_at"
    ]
  },
  {
    name: AQUAPULSE_SCHEMA_TABLES.aiFeedback,
    columns: [
      { name: "id", type: "text", primaryKey: true },
      { name: "alert_id", type: "text" },
      { name: "ai_response_id", type: "text", nullable: true },
      { name: "ai_request_id", type: "text", nullable: true },
      { name: "submitted_by", type: "text", nullable: true },
      { name: "value", type: "text" },
      { name: "note", type: "text", nullable: true },
      { name: "explanation_payload", type: "jsonb", nullable: true },
      { name: "created_at", type: "timestamptz", defaultExpression: "CURRENT_TIMESTAMP" },
      { name: "updated_at", type: "timestamptz", defaultExpression: "CURRENT_TIMESTAMP" }
    ],
    foreignKeys: [
      {
        column: "alert_id",
        referencesTable: AQUAPULSE_SCHEMA_TABLES.alerts,
        referencesColumn: "id",
        onDelete: "cascade"
      },
      {
        column: "ai_response_id",
        referencesTable: AQUAPULSE_SCHEMA_TABLES.aiResponses,
        referencesColumn: "id",
        onDelete: "set null"
      },
      {
        column: "ai_request_id",
        referencesTable: AQUAPULSE_SCHEMA_TABLES.aiRequests,
        referencesColumn: "id",
        onDelete: "set null"
      }
    ],
    indexes: [
      "idx_ai_feedback_alert_created_at",
      "idx_ai_feedback_response_created_at",
      "idx_ai_feedback_request_created_at",
      "idx_ai_feedback_submitted_by_created_at",
      "idx_ai_feedback_created_at"
    ]
  }
] as const;

export function getDatabaseTableDefinition(tableName: string): DatabaseTableDefinition | undefined {
  return aquaPulseSchemaTables.find((table) => table.name === tableName);
}
