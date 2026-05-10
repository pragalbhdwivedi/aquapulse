export const POND_RESPONSIBILITY_TYPES = [
  "operator",
  "pond_manager",
  "supervisor",
  "temporary"
] as const;

export type PondResponsibilityType = (typeof POND_RESPONSIBILITY_TYPES)[number];

export interface PondResponsibilityRecord {
  readonly id: string;
  readonly userId: string;
  readonly pondId: string;
  readonly responsibilityType: PondResponsibilityType;
  readonly active: boolean;
  readonly startsAt?: string;
  readonly endsAt?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface PondAuthorizationActor {
  readonly id: string;
  readonly provider: "keycloak" | "local";
  readonly roles?: readonly string[];
}
