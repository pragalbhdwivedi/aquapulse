import type { AuditEvent } from "@aquapulse/types";
import type { AuditEventMetadataWrite } from "../../modules/audit/ports/audit-repository.port";

export interface AuditRuntimeRecorder {
  readonly persist: (
    event: AuditEvent,
    metadata?: AuditEventMetadataWrite
  ) => Promise<void>;
}

let activeAuditRuntimeRecorder: AuditRuntimeRecorder | undefined;

export function setActiveAuditRuntimeRecorder(
  recorder: AuditRuntimeRecorder | undefined
) {
  activeAuditRuntimeRecorder = recorder;
}

export async function persistAuditRuntimeEvent(
  event: AuditEvent,
  metadata?: AuditEventMetadataWrite
): Promise<void> {
  if (!activeAuditRuntimeRecorder) {
    return;
  }

  try {
    await activeAuditRuntimeRecorder.persist(event, metadata);
  } catch {
    // Keep runtime behavior unchanged if audit persistence fails.
  }
}
