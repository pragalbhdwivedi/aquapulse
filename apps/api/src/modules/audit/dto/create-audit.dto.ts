export class CreateAuditDto {
  action!: string;
  resourceType!: string;
  resourceId?: string;
  summary!: string;
}
