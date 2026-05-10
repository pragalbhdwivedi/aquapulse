import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import type { Observable } from "rxjs";
import { tap } from "rxjs/operators";
import type { AuditEvent, AuthenticatedUserSession } from "@aquapulse/types";
import { persistAuditRuntimeEvent } from "./audit-runtime-recorder";
import { extractRequestMetadata } from "../request-metadata";
import type { AuditEventMetadataWrite } from "../../modules/audit/ports/audit-repository.port";

interface AuditRequestLike {
  readonly id?: string;
  readonly method?: string;
  readonly url?: string;
  readonly originalUrl?: string;
  readonly headers?: Record<string, string | string[] | undefined>;
  readonly user?: AuthenticatedUserSession | null;
}

interface AuditResponseLike {
  readonly statusCode?: number;
}

const RESERVED_RESOURCE_SEGMENTS = new Set([
  "summary",
  "views",
  "bulk",
  "session",
  "explain",
  "feedback",
  "summarize",
  "generate",
  "query",
  "draft",
  "draft-note",
  "rewrite",
  "attach-explanation",
  "acknowledge",
  "resolve",
  "assign",
  "unassign",
  "review-state",
  "remove"
]);

function normalizePath(request: AuditRequestLike): string {
  const raw = request.originalUrl ?? request.url ?? "/";
  return new URL(raw, "http://localhost").pathname;
}

function mapHttpMethodToAuditAction(method: string | undefined): AuditEvent["action"] {
  const normalized = method?.toUpperCase();
  if (normalized === "GET") {
    return "view";
  }
  if (normalized === "PATCH" || normalized === "PUT") {
    return "update";
  }
  if (normalized === "DELETE") {
    return "delete";
  }
  if (normalized === "POST") {
    return "create";
  }
  return "view";
}

function deriveAuditResource(pathname: string): {
  resourceType: string;
  resourceId?: string;
} {
  const segments = pathname.split("/").filter(Boolean);
  const apiIndex = segments[0] === "api" ? 1 : 0;
  const resourceType = segments[apiIndex] ?? "unknown";
  const candidateResourceId = segments[apiIndex + 1];
  const resourceId =
    candidateResourceId && !RESERVED_RESOURCE_SEGMENTS.has(candidateResourceId)
      ? candidateResourceId
      : undefined;

  return {
    resourceType,
    resourceId
  };
}

function buildAuditSummary(
  action: AuditEvent["action"],
  resourceType: string,
  resourceId: string | undefined,
  pathname: string
): string {
  const subject = resourceId ? `${resourceType}:${resourceId}` : resourceType;
  return `${action.toUpperCase()} ${subject} via ${pathname}`;
}

@Injectable()
export class PlaceholderAuditInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<AuditRequestLike>();
    const response = context.switchToHttp().getResponse<AuditResponseLike>();
    const requestMetadata = extractRequestMetadata(request);
    const pathname = normalizePath(request);

    if (pathname.startsWith("/api/audit")) {
      return next.handle();
    }

    const { resourceType, resourceId } = deriveAuditResource(pathname);
    const action = mapHttpMethodToAuditAction(request.method);

    return next.handle().pipe(
      tap({
        next: () => {
          const now = new Date().toISOString();
          const event: AuditEvent = {
            id: randomUUID(),
            createdAt: now,
            updatedAt: now,
            action,
            resourceType,
            resourceId,
            summary: buildAuditSummary(action, resourceType, resourceId, pathname)
          };
          const metadata: AuditEventMetadataWrite = {
            id: randomUUID(),
            auditEventId: event.id,
            requestId: requestMetadata.requestId,
            correlationId: requestMetadata.correlationId,
            actorId: requestMetadata.actorId,
            httpMethod: request.method?.toUpperCase(),
            requestPath: pathname,
            statusCode: response?.statusCode,
            createdAt: now,
            updatedAt: now
          };
          void persistAuditRuntimeEvent(event, metadata);
        }
      })
    );
  }
}
