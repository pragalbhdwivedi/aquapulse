export type PersistenceAdapterKind = "in-memory" | "postgres";
export type PersistenceSelectionReason =
  | "default_adapter"
  | "runtime_switch_disabled"
  | "postgres_not_enabled"
  | "requested_adapter";

export interface PersistenceRuntimeConfig {
  readonly defaultAdapter: PersistenceAdapterKind;
  readonly requestedAdapter?: PersistenceAdapterKind;
  readonly allowRuntimeSwitch?: boolean;
  readonly postgresEnabled?: boolean;
}

export interface PersistenceSelection {
  readonly adapter: PersistenceAdapterKind;
  readonly reason: PersistenceSelectionReason;
}
