import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { ApiSuccessEnvelope, AttachmentMetadata, ListResponse } from "@aquapulse/types";
import { createNotFoundResponse } from "../../../common/api/response-mapper";
import { ParentResourceScopeResolverService } from "../../resource-scope/application/parent-resource-scope-resolver.service";
import type { CreateAttachmentsDto, UpdateAttachmentsDto } from "../dto";
import { ATTACHMENTS_REPOSITORY, type AttachmentsRepositoryPort } from "../ports/attachments-repository.port";
import type { AttachmentsListQueryContract } from "../query-contracts/attachments-query.contract";

interface AttachmentReadRequesterScope {
  readonly id: string;
  readonly provider: "keycloak" | "local";
  readonly roles?: readonly string[];
}

interface ParentResourceScopeResolverPort {
  canReadResource(
    actor: AttachmentReadRequesterScope | undefined,
    resourceType: string,
    resourceId: string
  ): Promise<{
    readonly decision: "allow" | "deny" | "unknown" | "defer_local_safe_allow";
  }>;
}

@Injectable()
export class AttachmentsApplicationService {
  constructor(
    @Inject(ATTACHMENTS_REPOSITORY) private readonly attachmentsRepository: AttachmentsRepositoryPort,
    private readonly parentResourceScopeResolver: ParentResourceScopeResolverPort = {
      canReadResource: async () => ({
        decision: "defer_local_safe_allow",
        resourceType: "",
        resourceId: "",
        reason: "local_safe_broad_mode"
      })
    }
  ) {}

  async create(_input: CreateAttachmentsDto): Promise<ApiSuccessEnvelope<AttachmentMetadata>> { return { ok: true, data: await this.attachmentsRepository.create(_input) }; }
  async update(_id: string, _input: UpdateAttachmentsDto): Promise<ApiSuccessEnvelope<AttachmentMetadata>> { return { ok: true, data: await this.attachmentsRepository.update(_id, _input) }; }
  async list(
    _query: AttachmentsListQueryContract,
    requester?: AttachmentReadRequesterScope
  ): Promise<ApiSuccessEnvelope<ListResponse<AttachmentMetadata>>> {
    if (requester?.provider !== "keycloak") {
      return { ok: true, data: await this.attachmentsRepository.list(_query) };
    }

    const page = _query.page ?? 1;
    const pageSize = _query.pageSize ?? 20;
    const baseQuery = {
      ..._query,
      page: 1,
      pageSize: Math.max(pageSize, 100)
    };
    const allItems = await this.listAllMatchingAttachments(baseQuery);
    const visibleItems = (
      await Promise.all(
        allItems.map(async (item) => ({
          item,
          scope: await this.parentResourceScopeResolver.canReadResource(
            requester,
            item.resourceType,
            item.resourceId
          )
        }))
      )
    )
      .filter((result) => result.scope.decision === "allow")
      .map((result) => result.item);
    const pagedItems = visibleItems.slice((page - 1) * pageSize, page * pageSize);

    return {
      ok: true,
      data: {
        items: pagedItems,
        page: {
          page,
          pageSize,
          totalItems: visibleItems.length,
          totalPages: Math.max(1, Math.ceil(visibleItems.length / pageSize))
        }
      }
    };
  }
  async getById(
    _id: string,
    requester?: AttachmentReadRequesterScope
  ): Promise<ApiSuccessEnvelope<AttachmentMetadata>> {
    const attachment = await this.attachmentsRepository.getById(_id);
    const scope = await this.parentResourceScopeResolver.canReadResource(
      requester,
      attachment.resourceType,
      attachment.resourceId
    );

    if (scope.decision !== "allow" && scope.decision !== "defer_local_safe_allow") {
      throw new NotFoundException(createNotFoundResponse("Attachment").error);
    }

    return { ok: true, data: attachment };
  }

  private async listAllMatchingAttachments(
    baseQuery: AttachmentsListQueryContract
  ): Promise<AttachmentMetadata[]> {
    const items: AttachmentMetadata[] = [];
    let page = 1;
    const pageSize = baseQuery.pageSize ?? 100;
    let totalItems: number | undefined;

    while (totalItems === undefined || items.length < totalItems) {
      const response = await this.attachmentsRepository.list({
        ...baseQuery,
        page,
        pageSize
      });

      items.push(...response.items);
      totalItems = response.page.totalItems;

      if (response.items.length === 0 || response.items.length < pageSize) {
        break;
      }

      page += 1;
    }

    return items;
  }
}
