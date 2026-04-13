export class CreateAttachmentDto {
  resourceType!: string;
  resourceId!: string;
  fileName!: string;
  mimeType!: string;
  sizeBytes!: number;
}
