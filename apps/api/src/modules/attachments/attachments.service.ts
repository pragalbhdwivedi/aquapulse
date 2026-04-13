import { Injectable } from "@nestjs/common";

@Injectable()
export class AttachmentsService {
  getPlaceholder() {
    return {
      module: "attachments",
      status: "placeholder",
      todo: [
        "Define upload metadata and storage ownership.",
        "Add validation, scanning, and access rules for file assets.",
      ],
    };
  }
}
