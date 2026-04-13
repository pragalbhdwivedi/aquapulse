export interface RequestMetadata {
  readonly requestId?: string;
  readonly correlationId?: string;
  readonly actorId?: string;
  readonly ipAddress?: string;
  readonly userAgent?: string;
}
