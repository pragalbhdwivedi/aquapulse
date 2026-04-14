import type { AlertSummary, PondSummary } from "@aquapulse/types";
import type {
  AttachmentMetadata,
  BatchSummary,
  FeedCreateRequest,
  FeedEntry,
  FeedUpdateRequest,
  TaskCreateRequest,
  TaskUpdateRequest,
  TaskSummary
} from "@aquapulse/types";
import type { RowMapper } from "./row-mapper.js";

export interface PondRow {
  readonly id: string;
  readonly name: string;
  readonly code: string;
  readonly farm_id: string;
  readonly kind: PondSummary["kind"];
  readonly status: PondSummary["status"];
  readonly created_at: string;
  readonly updated_at: string;
}

export interface AlertRow {
  readonly id: string;
  readonly title: string;
  readonly severity: AlertSummary["severity"];
  readonly source: string;
  readonly pond_id?: string;
  readonly status: AlertSummary["status"];
  readonly assigned_to?: string;
  readonly review_state?: AlertSummary["reviewState"];
  readonly review_label?: string;
  readonly created_at: string;
  readonly updated_at: string;
}

export interface TaskRow {
  readonly id: string;
  readonly title: string;
  readonly status: TaskSummary["status"];
  readonly assignee_id?: string;
  readonly pond_id?: string;
  readonly created_at: string;
  readonly updated_at: string;
}

export interface AttachmentRow {
  readonly id: string;
  readonly resource_type: string;
  readonly resource_id: string;
  readonly file_name: string;
  readonly mime_type: string;
  readonly size_bytes: number;
  readonly created_at: string;
  readonly updated_at: string;
}

export interface BatchRow {
  readonly id: string;
  readonly name: string;
  readonly pond_id: string;
  readonly species: string;
  readonly stock_count: number;
  readonly lifecycle_stage: BatchSummary["lifecycleStage"];
  readonly created_at: string;
  readonly updated_at: string;
}

export interface FeedRow {
  readonly id: string;
  readonly pond_id: string;
  readonly batch_id?: string;
  readonly feed_type: string;
  readonly quantity_kg: number;
  readonly fed_at: string;
  readonly created_at: string;
  readonly updated_at: string;
}

export interface PondRowWrite {
  readonly id: string;
  readonly name: string;
  readonly code: string;
  readonly farm_id: string;
  readonly kind: PondSummary["kind"];
  readonly status: PondSummary["status"];
  readonly created_at: string;
  readonly updated_at: string;
}

export interface PondRowPatch {
  readonly id: string;
  readonly updated_at: string;
  readonly name?: string;
  readonly code?: string;
  readonly farm_id?: string;
  readonly kind?: PondSummary["kind"];
  readonly status?: PondSummary["status"];
}

export interface AlertRowWrite {
  readonly id: string;
  readonly title: string;
  readonly severity: AlertSummary["severity"];
  readonly source: string;
  readonly pond_id?: string;
  readonly status: AlertSummary["status"];
  readonly assigned_to?: string;
  readonly review_state?: AlertSummary["reviewState"];
  readonly review_label?: string;
  readonly created_at: string;
  readonly updated_at: string;
}

export interface AlertRowPatch {
  readonly id: string;
  readonly updated_at: string;
  readonly title?: string;
  readonly severity?: AlertSummary["severity"];
  readonly source?: string;
  readonly pond_id?: string;
  readonly status?: AlertSummary["status"];
  readonly assigned_to?: string;
  readonly review_state?: AlertSummary["reviewState"];
  readonly review_label?: string;
}

export interface TaskRowWrite extends TaskRow {}
export interface TaskRowPatch {
  readonly id: string;
  readonly updated_at: string;
  readonly title?: string;
  readonly status?: TaskSummary["status"];
  readonly assignee_id?: string;
  readonly pond_id?: string;
}

export interface AttachmentRowWrite extends AttachmentRow {}
export interface AttachmentRowPatch {
  readonly id: string;
  readonly updated_at: string;
  readonly resource_type?: string;
  readonly resource_id?: string;
  readonly file_name?: string;
  readonly mime_type?: string;
  readonly size_bytes?: number;
}

export interface BatchRowWrite extends BatchRow {}
export interface BatchRowPatch {
  readonly id: string;
  readonly updated_at: string;
  readonly name?: string;
  readonly pond_id?: string;
  readonly species?: string;
  readonly stock_count?: number;
  readonly lifecycle_stage?: BatchSummary["lifecycleStage"];
}

export interface FeedRowWrite extends FeedRow {}
export interface FeedRowPatch {
  readonly id: string;
  readonly updated_at: string;
  readonly pond_id?: string;
  readonly batch_id?: string;
  readonly feed_type?: string;
  readonly quantity_kg?: number;
  readonly fed_at?: string;
}

export const pondRowMapper: RowMapper<PondRow, PondSummary> = {
  toDomain(row) {
    return {
      id: row.id,
      name: row.name,
      code: row.code,
      farmId: row.farm_id,
      kind: row.kind,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
};

export const alertRowMapper: RowMapper<AlertRow, AlertSummary> = {
  toDomain(row) {
    return {
      id: row.id,
      title: row.title,
      severity: row.severity,
      source: row.source,
      pondId: row.pond_id,
      status: row.status,
      assignedTo: row.assigned_to,
      reviewState: row.review_state,
      reviewLabel: row.review_label,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
};

export const taskRowMapper: RowMapper<TaskRow, TaskSummary> = {
  toDomain(row) {
    return {
      id: row.id,
      title: row.title,
      status: row.status,
      assigneeId: row.assignee_id,
      pondId: row.pond_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
};

export const attachmentRowMapper: RowMapper<AttachmentRow, AttachmentMetadata> = {
  toDomain(row) {
    return {
      id: row.id,
      resourceType: row.resource_type,
      resourceId: row.resource_id,
      fileName: row.file_name,
      mimeType: row.mime_type,
      sizeBytes: row.size_bytes,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
};

export const batchRowMapper: RowMapper<BatchRow, BatchSummary> = {
  toDomain(row) {
    return {
      id: row.id,
      name: row.name,
      pondId: row.pond_id,
      species: row.species,
      stockCount: row.stock_count,
      lifecycleStage: row.lifecycle_stage,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
};

export const feedRowMapper: RowMapper<FeedRow, FeedEntry> = {
  toDomain(row) {
    return {
      id: row.id,
      pondId: row.pond_id,
      batchId: row.batch_id,
      feedType: row.feed_type,
      quantityKg: row.quantity_kg,
      fedAt: row.fed_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
};

export function createPlaceholderPondRow(overrides: Partial<PondRow> = {}): PondRow {
  return {
    id: "pond-1",
    name: "North Pond 1",
    code: "NP-01",
    farm_id: "farm-1",
    kind: "pond",
    status: "active",
    created_at: "2026-04-13T00:00:00.000Z",
    updated_at: "2026-04-13T00:00:00.000Z",
    ...overrides
  };
}

export function createPlaceholderAlertRow(overrides: Partial<AlertRow> = {}): AlertRow {
  return {
    id: "alert-1",
    title: "Low dissolved oxygen warning",
    severity: "high",
    source: "water-quality",
    pond_id: "pond-1",
    status: "open",
    review_state: "unreviewed",
    created_at: "2026-04-13T00:00:00.000Z",
    updated_at: "2026-04-13T00:00:00.000Z",
    ...overrides
  };
}

export function createPlaceholderTaskRow(overrides: Partial<TaskRow> = {}): TaskRow {
  return {
    id: "task-1",
    title: "Inspect aeration equipment",
    status: "todo",
    assignee_id: "user-1",
    pond_id: "pond-1",
    created_at: "2026-04-13T00:00:00.000Z",
    updated_at: "2026-04-13T00:00:00.000Z",
    ...overrides
  };
}

export function createPlaceholderAttachmentRow(
  overrides: Partial<AttachmentRow> = {}
): AttachmentRow {
  return {
    id: "attachment-1",
    resource_type: "alert",
    resource_id: "alert-1",
    file_name: "sample-photo.jpg",
    mime_type: "image/jpeg",
    size_bytes: 102400,
    created_at: "2026-04-13T00:00:00.000Z",
    updated_at: "2026-04-13T00:00:00.000Z",
    ...overrides
  };
}

export function createPlaceholderBatchRow(overrides: Partial<BatchRow> = {}): BatchRow {
  return {
    id: "batch-1",
    name: "Tilapia Cycle Alpha",
    pond_id: "pond-1",
    species: "Tilapia",
    stock_count: 4200,
    lifecycle_stage: "growing",
    created_at: "2026-04-13T00:00:00.000Z",
    updated_at: "2026-04-13T00:00:00.000Z",
    ...overrides
  };
}

export function createPlaceholderFeedRow(overrides: Partial<FeedRow> = {}): FeedRow {
  return {
    id: "feed-1",
    pond_id: "pond-1",
    batch_id: "batch-1",
    feed_type: "Starter Feed",
    quantity_kg: 35,
    fed_at: "2026-04-13T00:00:00.000Z",
    created_at: "2026-04-13T00:00:00.000Z",
    updated_at: "2026-04-13T00:00:00.000Z",
    ...overrides
  };
}

export function mapCreatePondInputToRowWrite(input: { readonly id?: string }): PondRowWrite {
  const base = createPlaceholderPondRow(input.id ? { id: input.id } : {});

  return {
    id: base.id,
    name: base.name,
    code: base.code,
    farm_id: base.farm_id,
    kind: base.kind,
    status: base.status,
    created_at: base.created_at,
    updated_at: base.updated_at
  };
}

export function mapUpdatePondInputToRowPatch(
  id: string,
  _input: { readonly id?: string }
): PondRowPatch {
  return {
    id,
    updated_at: createPlaceholderPondRow({ id }).updated_at
  };
}

export function mapCreateAlertInputToRowWrite(input: {
  readonly id?: string;
  readonly title?: string;
  readonly severity?: AlertSummary["severity"];
  readonly source?: string;
  readonly pondId?: string;
  readonly status?: AlertSummary["status"];
  readonly assignedTo?: string;
  readonly reviewState?: AlertSummary["reviewState"];
  readonly reviewLabel?: string;
}): AlertRowWrite {
  const base = createPlaceholderAlertRow(input.id ? { id: input.id } : {});

  return {
    id: base.id,
    title: input.title ?? base.title,
    severity: input.severity ?? base.severity,
    source: input.source ?? base.source,
    pond_id: input.pondId ?? base.pond_id,
    status: input.status ?? base.status,
    assigned_to: input.assignedTo ?? base.assigned_to,
    review_state: input.reviewState ?? base.review_state,
    review_label: input.reviewLabel ?? base.review_label,
    created_at: base.created_at,
    updated_at: base.updated_at
  };
}

export function mapUpdateAlertInputToRowPatch(
  id: string,
  input: {
    readonly id?: string;
    readonly title?: string;
    readonly severity?: AlertSummary["severity"];
    readonly source?: string;
    readonly pondId?: string;
    readonly status?: AlertSummary["status"];
    readonly assignedTo?: string;
    readonly reviewState?: AlertSummary["reviewState"];
    readonly reviewLabel?: string;
  }
): AlertRowPatch {
  return {
    id,
    updated_at: createPlaceholderAlertRow({ id }).updated_at,
    title: input.title,
    severity: input.severity,
    source: input.source,
    pond_id: input.pondId,
    status: input.status,
    assigned_to: input.assignedTo,
    review_state: input.reviewState,
    review_label: input.reviewLabel
  };
}

export function mapCreateTaskInputToRowWrite(input: TaskCreateRequest): TaskRowWrite {
  const base = createPlaceholderTaskRow();

  return {
    id: `task-row-${input.pondId ?? "new"}`,
    title: input.title,
    status: "todo",
    assignee_id: input.assigneeId,
    pond_id: input.pondId,
    created_at: base.created_at,
    updated_at: base.updated_at
  };
}

export function mapUpdateTaskInputToRowPatch(id: string, input: TaskUpdateRequest): TaskRowPatch {
  return {
    id,
    updated_at: createPlaceholderTaskRow({ id }).updated_at,
    title: input.title,
    status: input.status,
    assignee_id: input.assigneeId,
    pond_id: input.pondId
  };
}

export function mapCreateAttachmentInputToRowWrite(
  input: { readonly id?: string }
): AttachmentRowWrite {
  return createPlaceholderAttachmentRow(input.id ? { id: input.id } : {});
}

export function mapUpdateAttachmentInputToRowPatch(
  id: string,
  _input: { readonly id?: string }
): AttachmentRowPatch {
  return {
    id,
    updated_at: createPlaceholderAttachmentRow({ id }).updated_at
  };
}

export function mapCreateBatchInputToRowWrite(input: { readonly id?: string }): BatchRowWrite {
  return createPlaceholderBatchRow(input.id ? { id: input.id } : {});
}

export function mapUpdateBatchInputToRowPatch(id: string, _input: { readonly id?: string }): BatchRowPatch {
  return {
    id,
    updated_at: createPlaceholderBatchRow({ id }).updated_at
  };
}

export function mapCreateFeedInputToRowWrite(input: FeedCreateRequest): FeedRowWrite {
  const base = createPlaceholderFeedRow();

  return {
    id: `feed-row-${input.pondId}`,
    pond_id: input.pondId,
    batch_id: input.batchId,
    feed_type: input.feedType,
    quantity_kg: input.quantityKg,
    fed_at: input.fedAt,
    created_at: base.created_at,
    updated_at: base.updated_at
  };
}

export function mapUpdateFeedInputToRowPatch(id: string, input: FeedUpdateRequest): FeedRowPatch {
  return {
    id,
    updated_at: createPlaceholderFeedRow({ id }).updated_at,
    batch_id: input.batchId,
    feed_type: input.feedType,
    quantity_kg: input.quantityKg,
    fed_at: input.fedAt
  };
}
