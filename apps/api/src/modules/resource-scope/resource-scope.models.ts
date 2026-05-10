export const SUPPORTED_PARENT_RESOURCE_TYPES = [
  "alert",
  "task",
  "pond",
  "batch",
  "feed",
  "water-quality",
  "ai",
  "audit"
] as const;

export type SupportedParentResourceType = (typeof SUPPORTED_PARENT_RESOURCE_TYPES)[number];

export interface ParentResourceScopeActor {
  readonly id: string;
  readonly provider: "keycloak" | "local";
  readonly roles?: readonly string[];
}

export type ParentResourceReadScopeDecision =
  | "allow"
  | "deny"
  | "unknown"
  | "defer_local_safe_allow";

export interface ParentResourceReadScopeResult {
  readonly decision: ParentResourceReadScopeDecision;
  readonly resourceType: string;
  readonly resourceId: string;
  readonly canonicalResourceType?: SupportedParentResourceType;
  readonly reason:
    | "scoped_parent_read_allowed"
    | "scoped_parent_read_denied"
    | "unsupported_resource_type"
    | "local_safe_broad_mode";
}
