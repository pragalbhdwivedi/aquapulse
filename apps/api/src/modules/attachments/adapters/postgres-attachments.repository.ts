import { Injectable } from "@nestjs/common";
import {
  PlaceholderDatabaseConnectionFactory,
  PostgresRowGateway,
  createCompiledQueryPlan,
  createListQueryPlan,
  createLookupQueryPlan,
  createMutationQueryPlan,
  createPlaceholderAttachmentRow,
  attachmentRowMapper,
  mapCreateAttachmentInputToRowWrite,
  mapUpdateAttachmentInputToRowPatch,
  type AttachmentRow,
  type AttachmentRowPatch,
  type AttachmentRowWrite,
  type CompiledQueryPlan,
  type DatabaseConfig,
  type DatabaseConnectionFactory
} from "@aquapulse/database";
import type { AttachmentMetadata, ListResponse } from "@aquapulse/types";
import { readApiDatabaseRuntimeConfig } from "../../../common/config/database-runtime.config";
import type { CreateAttachmentsDto, UpdateAttachmentsDto } from "../dto";
import type { AttachmentsRepositoryPort } from "../ports/attachments-repository.port";
import type { AttachmentsListQueryContract } from "../query-contracts/attachments-query.contract";

export interface PostgresAttachmentsRepositoryDependencies {
  readonly connectionFactory?: DatabaseConnectionFactory;
  readonly databaseConfig?: DatabaseConfig;
}

export function buildAttachmentByIdQueryPlan(id: string): CompiledQueryPlan {
  return createLookupQueryPlan("attachments.getById", id);
}

export function buildAttachmentsListQueryPlan(query: AttachmentsListQueryContract): CompiledQueryPlan {
  return createListQueryPlan({
    key: "attachments.list",
    query,
    params: [query.page, query.pageSize, query.resourceType ?? null, query.resourceId ?? null, query.search ?? null],
    filters: {
      resourceType: query.resourceType,
      resourceId: query.resourceId,
      search: query.search
    }
  });
}

export function buildAttachmentsByResourceQueryPlan(
  resourceType: string,
  resourceId: string
): CompiledQueryPlan {
  return createCompiledQueryPlan({
    key: "attachments.listByResource",
    params: [resourceType, resourceId],
    filters: { resourceType, resourceId }
  });
}

export function buildCreateAttachmentQueryPlan(row: AttachmentRowWrite): CompiledQueryPlan {
  return createMutationQueryPlan("attachments.create", row);
}

export function buildUpdateAttachmentQueryPlan(
  id: string,
  patch: AttachmentRowPatch
): CompiledQueryPlan {
  return createMutationQueryPlan("attachments.update", patch, {
    params: [id, patch],
    filters: { id }
  });
}

@Injectable()
export class PostgresAttachmentsRepository implements AttachmentsRepositoryPort {
  private connectionFactory: DatabaseConnectionFactory = new PlaceholderDatabaseConnectionFactory();
  private databaseConfig: DatabaseConfig = readApiDatabaseRuntimeConfig().database;

  static forTesting(
    overrides: PostgresAttachmentsRepositoryDependencies = {}
  ): PostgresAttachmentsRepository {
    const repository = new PostgresAttachmentsRepository();
    repository.connectionFactory = overrides.connectionFactory ?? repository.connectionFactory;
    repository.databaseConfig = overrides.databaseConfig ?? repository.databaseConfig;
    return repository;
  }

  async create(input: CreateAttachmentsDto): Promise<AttachmentMetadata> {
    const row = mapCreateAttachmentInputToRowWrite(input);
    return this.gateway.executeMappedMutation(
      buildCreateAttachmentQueryPlan(row),
      attachmentRowMapper,
      createPlaceholderAttachmentRow({ id: row.id })
    );
  }

  async update(id: string, input: UpdateAttachmentsDto): Promise<AttachmentMetadata> {
    const patch = mapUpdateAttachmentInputToRowPatch(id, input);
    return this.gateway.executeMappedMutation(
      buildUpdateAttachmentQueryPlan(id, patch),
      attachmentRowMapper,
      createPlaceholderAttachmentRow({ id })
    );
  }

  async getById(id: string): Promise<AttachmentMetadata> {
    return this.gateway.executeMappedItem(
      buildAttachmentByIdQueryPlan(id),
      attachmentRowMapper,
      createPlaceholderAttachmentRow({ id })
    );
  }

  async list(query: AttachmentsListQueryContract): Promise<ListResponse<AttachmentMetadata>> {
    return this.gateway.executeMappedList(buildAttachmentsListQueryPlan(query), attachmentRowMapper, {
      page: query.page,
      pageSize: query.pageSize,
      fallbackRows: [createPlaceholderAttachmentRow()]
    });
  }

  async listByResource(
    resourceType: string,
    resourceId: string
  ): Promise<ListResponse<AttachmentMetadata>> {
    return this.gateway.executeMappedList(
      buildAttachmentsByResourceQueryPlan(resourceType, resourceId),
      attachmentRowMapper,
      {
        page: 1,
        pageSize: 20,
        fallbackRows: [createPlaceholderAttachmentRow({ resource_type: resourceType, resource_id: resourceId })]
      }
    );
  }

  private get gateway(): PostgresRowGateway {
    return new PostgresRowGateway({
      connectionFactory: this.connectionFactory,
      databaseConfig: this.databaseConfig
    });
  }
}

export const POSTGRES_ATTACHMENTS_IMPLEMENTATION_PLAN = {
  readMethods: ["getById", "list", "listByResource"],
  writeMethods: ["create", "update"],
  rowSource: "attachments",
  queryNotes: [
    "filter attachment reads by resource type/id via compiled plans",
    "keep list and mutation flows on the shared Postgres row gateway"
  ],
  mappingNotes: [
    "map attachment rows into AttachmentMetadata via shared row mappers",
    "shape create/update DTO inputs into attachment row payloads"
  ]
} as const;
