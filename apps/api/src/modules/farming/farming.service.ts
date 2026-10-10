import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import { createHash, randomUUID } from "node:crypto";
import {
  farmCycleCount,
  farmMaterialBalance,
  type FarmWorkspace,
  type FarmWorkspaceView,
  type FarmMembership,
  type FarmErpJob,
} from "@aquapulse/types";
import {
  farmActivitySchema,
  farmCreateSchema,
  farmCycleSchema,
  farmDecisionSchema,
  farmErpJobSchema,
  farmErpCompanySchema,
  farmLegalEntitySchema,
  farmMaterialSchema,
  farmMemberSchema,
  farmMovementSchema,
  farmUnitSchema,
  farmTaskSchema,
  farmTaskUpdateSchema,
  farmPhotoSchema,
  farmCycleCloseSchema,
  validateFarmActivityFields,
} from "@aquapulse/validation";
import type { FarmWorkspaceStore } from "@aquapulse/database";
import type { FarmErpGateway } from "./erp-gateway";

export function initialFarmWorkspace(
  env: Record<string, string | undefined>,
): FarmWorkspace {
  const demo =
    env.AQUAPULSE_FARM_DEMO === "true" && env.NODE_ENV !== "production";
  const owner = demo
    ? "farm-demo-owner"
    : env.AQUAPULSE_FARM_OWNER_SUBJECT?.trim();
  const organizationId =
    env.AQUAPULSE_FARM_ORGANIZATION_ID?.trim() || "local-farm-business";
  if (!/^[A-Za-z0-9_-]{1,80}$/.test(organizationId))
    throw new Error(
      "Farming organization ID must contain 1-80 letters, digits, hyphens or underscores.",
    );
  return {
    schemaVersion: 1,
    organizationId,
    organizationName:
      env.AQUAPULSE_FARM_ORGANIZATION_NAME?.trim() || "Integrated farming",
    memberships: owner
      ? [{ userId: owner, role: "owner", farmIds: [], active: true }]
      : [],
    legalEntities: [],
    farms: [],
    units: [],
    cycles: [],
    activities: [],
    materials: [],
    movements: [],
    erpJobs: [],
    audit: [],
    tasks: [],
    taskUpdates: [],
    photos: [],
    receipts: [],
  };
}

function parse<T>(
  schema: {
    safeParse(
      value: unknown,
    ):
      | { success: true; data: T }
      | {
          success: false;
          error: { issues: { path: (string | number)[]; message: string }[] };
        };
  },
  input: unknown,
): T {
  const result = schema.safeParse(input);
  if (!result.success)
    throw new BadRequestException(
      result.error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join("; "),
    );
  return result.data;
}
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object")
    return `{${Object.entries(value)
      .filter(([, entry]) => entry !== undefined)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, entry]) => `${JSON.stringify(key)}:${canonical(entry)}`)
      .join(",")}}`;
  return JSON.stringify(value);
}
function requireRole(member: FarmMembership, roles: FarmMembership["role"][]) {
  if (member.role !== "owner" && !roles.includes(member.role))
    throw new ForbiddenException(
      "Your farming role does not allow this action.",
    );
}
function requireFarm(state: FarmWorkspace, member: FarmMembership, id: string) {
  const farm = state.farms.find((entry) => entry.id === id);
  if (!farm || (member.role !== "owner" && !member.farmIds.includes(id)))
    throw new NotFoundException("Farm resource not found.");
  return farm;
}
function getMember(state: FarmWorkspace, actor: string): FarmMembership {
  const member = state.memberships.find(
    (entry) => entry.userId === actor && entry.active,
  );
  if (!member)
    throw new ForbiddenException("Active farming membership is required.");
  return member;
}
function audit(
  state: FarmWorkspace,
  actorId: string,
  action: string,
  resourceId: string,
  farmId?: string,
) {
  state.audit.push({
    id: randomUUID(),
    actorId,
    action,
    resourceId,
    farmId,
    at: new Date().toISOString(),
  });
}
function replay<T extends { id: string }>(
  state: FarmWorkspace,
  actor: string,
  operation: string,
  data: { submissionId: string },
  rows: T[],
  create: () => T,
): T {
  const fingerprint = createHash("sha256")
    .update(canonical(data))
    .digest("hex");
  const existing = state.receipts.find(
    (entry) => entry.submissionId === data.submissionId,
  );
  if (existing) {
    if (
      existing.actorId !== actor ||
      existing.operation !== operation ||
      existing.fingerprint !== fingerprint
    )
      throw new ConflictException(
        "Submission ID was already used for different content. Review the original record before retrying.",
      );
    const row = rows.find((entry) => entry.id === existing.resourceId);
    if (!row)
      throw new ConflictException("Submission receipt needs reconciliation.");
    return row;
  }
  const row = create();
  rows.push(row);
  state.receipts.push({
    submissionId: data.submissionId,
    actorId: actor,
    operation,
    fingerprint,
    resourceId: row.id,
  });
  audit(
    state,
    actor,
    operation,
    row.id,
    "farmId" in row ? String(row.farmId) : undefined,
  );
  return row;
}

export class FarmingService {
  private worker?: ReturnType<typeof setInterval>;
  private draining = false;
  constructor(
    readonly store: FarmWorkspaceStore,
    readonly demo: boolean,
    private readonly erp?: FarmErpGateway,
  ) {}
  startWorker() {
    if (this.demo || !this.erp || this.worker) return;
    this.worker = setInterval(() => {
      void this.drainErpQueue().catch(() => undefined);
    }, 30000);
    this.worker.unref();
  }
  async onModuleDestroy() {
    if (this.worker) clearInterval(this.worker);
    await this.store.dispose();
  }
  async drainErpQueue() {
    if (this.draining) return;
    this.draining = true;
    try {
      const pending = await this.store.transaction((state) =>
        state.erpJobs
          .filter(
            (job) =>
              job.status === "queued" ||
              (job.status === "processing" &&
                !!job.leaseUntil &&
                Date.parse(job.leaseUntil) <= Date.now()),
          )
          .slice(0, 10)
          .map((job) => ({ id: job.id, actor: job.approvedBy || "" })),
      );
      for (const item of pending) {
        try {
          await this.dispatchErp(item.actor, item.id);
        } catch {
          await this.store.transaction((state) => {
            const job = state.erpJobs.find((job) => job.id === item.id);
            if (
              job &&
              (job.status === "queued" ||
                (job.status === "processing" &&
                  !!job.leaseUntil &&
                  Date.parse(job.leaseUntil) <= Date.now()))
            ) {
              job.status = "failed";
              job.lastError =
                "Worker could not validate current grants or dispatch this request. Owner reconciliation is required.";
              audit(state, "erp-worker", "erp.blocked", job.id, job.farmId);
            }
          });
        }
      }
    } finally {
      this.draining = false;
    }
  }

  view(actor: string): Promise<FarmWorkspaceView> {
    return this.store.transaction((state) => {
      const member = getMember(state, actor);
      const visible = (entry: { farmId: string }) =>
        member.role === "owner" || member.farmIds.includes(entry.farmId);
      const farms = state.farms.filter((entry) =>
        visible({ farmId: entry.id }),
      );
      const entityIds = new Set(farms.map((entry) => entry.legalEntityId));
      const { receipts: _receipts, photos, memberships, ...rest } = state;
      return {
        ...rest,
        farms,
        currentRole: member.role,
        actorId: actor,
        storage: this.store.mode,
        demo: this.demo,
        erpConfigured: !!this.erp,
        legalEntities: state.legalEntities.filter(
          (entry) => member.role === "owner" || entityIds.has(entry.id),
        ),
        units: state.units.filter(visible),
        cycles: state.cycles.filter(visible),
        activities: state.activities.filter(visible),
        materials: state.materials.filter(visible),
        movements: state.movements
          .filter(
            (entry) =>
              visible(entry) ||
              (entry.destinationFarmId &&
                visible({ farmId: entry.destinationFarmId })),
          )
          .map((entry) =>
            !visible(entry)
              ? {
                  ...entry,
                  farmId: "restricted",
                  materialId: "restricted",
                  actorId: "restricted",
                }
              : entry.destinationFarmId &&
                  !visible({ farmId: entry.destinationFarmId })
                ? {
                    ...entry,
                    destinationFarmId: undefined,
                    destinationMaterialId: undefined,
                  }
                : entry,
          ),
        erpJobs:
          member.role === "owner" ||
          member.role === "accountant" ||
          member.role === "manager"
            ? state.erpJobs.filter(visible)
            : [],
        tasks: state.tasks.filter(visible),
        taskUpdates: state.taskUpdates.filter(visible),
        photos: photos
          .filter(visible)
          .map(({ dataUrl: _dataUrl, ...photo }) => photo),
        memberships: member.role === "owner" ? memberships : undefined,
        audit: state.audit.filter(
          (entry) =>
            member.role === "owner" ||
            (entry.farmId && visible({ farmId: entry.farmId })),
        ),
      };
    });
  }

  photo(actor: string, id: string) {
    return this.store.transaction((state) => {
      const member = getMember(state, actor);
      const photo = state.photos.find((entry) => entry.id === id);
      if (!photo) throw new NotFoundException();
      requireFarm(state, member, photo.farmId);
      return photo;
    });
  }

  create(actor: string, resource: string, input: unknown) {
    return this.store.transaction((state) => {
      const member = getMember(state, actor);
      const id = randomUUID();
      if (resource === "legal-entities") {
        requireRole(member, []);
        const data = parse(farmLegalEntitySchema, input);
        const entity = {
          ...data,
          id,
          country: "IN" as const,
          currency: "INR" as const,
        };
        state.legalEntities.push(entity);
        audit(state, actor, "entity.created", id);
        return entity;
      }
      if (resource === "farms") {
        requireRole(member, []);
        const data = parse(farmCreateSchema, input);
        if (
          !state.legalEntities.some((entry) => entry.id === data.legalEntityId)
        )
          throw new NotFoundException("Legal entity not found.");
        if (
          state.farms.some(
            (entry) => entry.code.toLowerCase() === data.code.toLowerCase(),
          )
        )
          throw new ConflictException("Farm code already exists.");
        const farm = { ...data, id, timezone: "Asia/Kolkata" as const };
        state.farms.push(farm);
        audit(state, actor, "farm.created", id, id);
        return farm;
      }
      if (resource === "memberships") {
        requireRole(member, []);
        const data = parse(farmMemberSchema, input);
        data.farmIds = [...new Set(data.farmIds)];
        data.farmIds.forEach((farmId) => requireFarm(state, member, farmId));
        const candidate = state.memberships
          .filter((entry) => entry.userId !== data.userId)
          .concat(data);
        if (!candidate.some((entry) => entry.active && entry.role === "owner"))
          throw new ConflictException(
            "The last active owner cannot be removed.",
          );
        state.memberships = candidate;
        audit(state, actor, "membership.changed", data.userId);
        return data;
      }
      if (resource === "units") {
        requireRole(member, ["manager"]);
        const data = parse(farmUnitSchema, input);
        requireFarm(state, member, data.farmId);
        const unit = { ...data, id };
        state.units.push(unit);
        audit(state, actor, "unit.created", id, unit.farmId);
        return unit;
      }
      if (resource === "cycles") {
        requireRole(member, ["manager"]);
        const data = parse(farmCycleSchema, input);
        const unit = state.units.find((entry) => entry.id === data.unitId);
        if (!unit) throw new NotFoundException("Production unit not found.");
        requireFarm(state, member, unit.farmId);
        if (data.parentCycleId) {
          const parent = state.cycles.find(
            (entry) => entry.id === data.parentCycleId,
          );
          if (!parent || parent.farmId !== unit.farmId)
            throw new BadRequestException(
              "Parent cycle must belong to the same farm.",
            );
        }
        const cycle = {
          ...data,
          id,
          farmId: unit.farmId,
          enterprise: unit.enterprise,
          stage: "active" as const,
        };
        state.cycles.push(cycle);
        audit(state, actor, "cycle.created", id, cycle.farmId);
        return cycle;
      }
      if (resource === "activities") {
        requireRole(member, ["manager", "operator"]);
        const data = parse(farmActivitySchema, input);
        const cycle = state.cycles.find((entry) => entry.id === data.cycleId);
        if (!cycle) throw new NotFoundException("Cycle not found.");
        requireFarm(state, member, cycle.farmId);
        const fields = validateFarmActivityFields(
          cycle.enterprise,
          data.type,
          data.fields,
        );
        if (!fields.success) throw new BadRequestException(fields.message);
        return replay(state, actor, resource, data, state.activities, () => {
          if (cycle.stage !== "active")
            throw new ConflictException(
              "Cycle is closed. Review the offline record with a manager.",
            );
          if (
            Date.parse(data.recordedAt) < Date.parse(cycle.startsAt) ||
            Date.parse(data.recordedAt) > Date.now() + 300000
          )
            throw new BadRequestException(
              "Record time must be within the production cycle and cannot be in the future.",
            );
          if (
            ["harvest", "milk", "eggs", "flush", "dispatch"].includes(data.type)
          ) {
            const farmDate = new Intl.DateTimeFormat("en-CA", {
              timeZone: "Asia/Kolkata",
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
            }).format(new Date(data.recordedAt));
            const blocked = state.activities.some(
              (entry) =>
                entry.cycleId === cycle.id &&
                ["treatment", "spraying"].includes(entry.type) &&
                Date.parse(entry.recordedAt) <= Date.parse(data.recordedAt) &&
                (entry.status === "pending_approval" ||
                  ((entry.status === "approved" ||
                    entry.status === "recorded") &&
                    typeof entry.fields.withdrawalUntil === "string" &&
                    entry.fields.withdrawalUntil >= farmDate)),
            );
            if (blocked)
              throw new ConflictException(
                "Production output is blocked by an unreviewed treatment or withdrawal period.",
              );
          }
          const activity = {
            ...data,
            fields: fields.data,
            id,
            farmId: cycle.farmId,
            actorId: actor,
            status: fields.definition.requiresApproval
              ? ("pending_approval" as const)
              : ("recorded" as const),
          };
          if (farmCycleCount(cycle, [...state.activities, activity]) < 0)
            throw new ConflictException(
              "Animal / plant count would become negative.",
            );
          return activity;
        });
      }
      if (resource === "materials") {
        requireRole(member, ["manager"]);
        const data = parse(farmMaterialSchema, input);
        requireFarm(state, member, data.farmId);
        const material = { ...data, id };
        state.materials.push(material);
        audit(state, actor, "material.created", id, material.farmId);
        return material;
      }
      if (resource === "movements") {
        requireRole(member, ["manager"]);
        const data = parse(farmMovementSchema, input);
        const material = state.materials.find(
          (entry) => entry.id === data.materialId,
        );
        if (!material) throw new NotFoundException("Material not found.");
        requireFarm(state, member, material.farmId);
        const destination = state.materials.find(
          (entry) => entry.id === data.destinationMaterialId,
        );
        if (data.kind === "transfer") {
          if (
            !destination ||
            destination.id === material.id ||
            destination.unit !== material.unit
          )
            throw new BadRequestException(
              "Transfer requires a different destination material with matching units.",
            );
          requireFarm(state, member, destination.farmId);
        } else if (data.destinationMaterialId)
          throw new BadRequestException(
            "Only transfers may have a destination.",
          );
        return replay(state, actor, resource, data, state.movements, () => {
          if (material.unit === "count" && !Number.isInteger(data.quantity))
            throw new BadRequestException(
              "Count materials require whole quantities.",
            );
          if (
            data.kind !== "receipt" &&
            farmMaterialBalance(material.id, state.movements) + 1e-9 <
              data.quantity
          )
            throw new ConflictException("Insufficient operational stock.");
          if (Date.parse(data.recordedAt) > Date.now() + 300000)
            throw new BadRequestException("Movement cannot be in the future.");
          return {
            ...data,
            id,
            farmId: material.farmId,
            destinationFarmId: destination?.farmId,
            actorId: actor,
          };
        });
      }
      if (resource === "erp-jobs") {
        requireRole(member, ["manager", "accountant"]);
        const data = parse(farmErpJobSchema, input);
        const farm = requireFarm(state, member, data.farmId);
        return replay(state, actor, resource, data, state.erpJobs, () => {
          const erpCompany = state.legalEntities.find(
            (entry) => entry.id === farm.legalEntityId,
          )?.erpCompany;
          if (!erpCompany)
            throw new ConflictException(
              "Configure the entity's ERPNext Company before requesting an invoice.",
            );
          return {
            ...data,
            id,
            legalEntityId: farm.legalEntityId,
            erpCompany,
            status: "pending_approval" as const,
            attempts: 0,
            actorId: actor,
          };
        });
      }
      if (resource === "tasks") {
        requireRole(member, ["manager"]);
        const data = parse(farmTaskSchema, input);
        requireFarm(state, member, data.farmId);
        if (
          data.cycleId &&
          !state.cycles.some(
            (entry) =>
              entry.id === data.cycleId && entry.farmId === data.farmId,
          )
        )
          throw new BadRequestException("Task cycle must belong to its farm.");
        const assignee = getMember(state, data.assignedTo);
        requireFarm(state, assignee, data.farmId);
        const task = { ...data, id, status: "open" as const, actorId: actor };
        state.tasks.push(task);
        audit(state, actor, "task.created", id, task.farmId);
        return task;
      }
      if (resource === "task-updates") {
        requireRole(member, ["manager", "operator"]);
        const data = parse(farmTaskUpdateSchema, input);
        const task = state.tasks.find((entry) => entry.id === data.taskId);
        if (!task) throw new NotFoundException();
        requireFarm(state, member, task.farmId);
        if (member.role === "operator" && task.assignedTo !== actor)
          throw new ForbiddenException(
            "Only the assigned operator may update this task.",
          );
        return replay(state, actor, resource, data, state.taskUpdates, () => {
          task.status = data.status;
          return { ...data, id, farmId: task.farmId, actorId: actor };
        });
      }
      if (resource === "photos") {
        requireRole(member, ["manager", "operator"]);
        const data = parse(farmPhotoSchema, input);
        const activity = state.activities.find(
          (entry) => entry.id === data.activityId,
        );
        if (!activity) throw new NotFoundException();
        requireFarm(state, member, activity.farmId);
        return replay(state, actor, resource, data, state.photos, () => {
          const bytes = Buffer.from(data.dataUrl.split(",")[1], "base64");
          const valid = data.dataUrl.startsWith("data:image/png;")
            ? bytes.subarray(0, 8).toString("hex") === "89504e470d0a1a0a"
            : data.dataUrl.startsWith("data:image/jpeg;")
              ? bytes.subarray(0, 3).toString("hex") === "ffd8ff"
              : bytes.subarray(0, 4).toString() === "RIFF" &&
                bytes.subarray(8, 12).toString() === "WEBP";
          if (!valid || bytes.length > 262144)
            throw new BadRequestException(
              "Use a PNG, JPEG or WebP photo smaller than 256 KiB.",
            );
          return { ...data, id, farmId: activity.farmId, actorId: actor };
        });
      }
      throw new NotFoundException("Unknown farming resource.");
    });
  }

  decide(actor: string, resource: string, id: string, input: unknown) {
    return this.store.transaction((state) => {
      const member = getMember(state, actor);
      const data = parse(farmDecisionSchema, input);
      if (resource === "activities") {
        requireRole(member, ["manager"]);
        const activity = state.activities.find((entry) => entry.id === id);
        if (!activity) throw new NotFoundException();
        requireFarm(state, member, activity.farmId);
        if (data.decision === "void") {
          if (!["recorded", "approved"].includes(activity.status))
            throw new ConflictException(
              "Only recorded or approved activities may be voided.",
            );
          const cycle = state.cycles.find(
            (entry) => entry.id === activity.cycleId,
          )!;
          if (cycle.stage === "closed")
            throw new ConflictException("Closed cycle records are immutable.");
          if (
            farmCycleCount(
              cycle,
              state.activities.filter((entry) => entry.id !== id),
            ) < 0
          )
            throw new ConflictException(
              "Voiding this receipt would make the count negative.",
            );
          activity.status = "voided";
        } else {
          if (activity.status !== "pending_approval")
            throw new ConflictException("Activity was already reviewed.");
          if (activity.actorId === actor)
            throw new ForbiddenException(
              "A different manager must review the treatment.",
            );
          activity.status =
            data.decision === "approve" ? "approved" : "rejected";
        }
        activity.decisionBy = actor;
        activity.decisionReason = data.reason;
        audit(state, actor, `activity.${data.decision}`, id, activity.farmId);
        return activity;
      }
      if (resource === "erp-jobs") {
        requireRole(member, ["accountant"]);
        const job = state.erpJobs.find((entry) => entry.id === id);
        if (!job) throw new NotFoundException();
        requireFarm(state, member, job.farmId);
        if (
          data.decision === "void" ||
          (data.decision === "approve"
            ? job.status !== "pending_approval"
            : !["pending_approval", "queued", "failed"].includes(job.status))
        )
          throw new ConflictException(
            "ERP job cannot be reviewed in its current state.",
          );
        if (job.actorId === actor)
          throw new ForbiddenException(
            "A different owner or accountant must approve the ERP draft request.",
          );
        if (
          data.decision === "approve" &&
          state.legalEntities.find((entity) => entity.id === job.legalEntityId)
            ?.erpCompany !== job.erpCompany
        )
          throw new ConflictException(
            "Company mapping changed. Reject this request and create a new one.",
          );
        job.status = data.decision === "approve" ? "queued" : "rejected";
        if (data.decision === "approve") job.approvedBy = actor;
        audit(
          state,
          actor,
          `erp.${data.decision}: ${data.reason}`,
          id,
          job.farmId,
        );
        return job;
      }
      throw new NotFoundException();
    });
  }

  closeCycle(actor: string, id: string, input: unknown) {
    return this.store.transaction((state) => {
      const member = getMember(state, actor);
      requireRole(member, ["manager"]);
      const data = parse(farmCycleCloseSchema, input);
      const cycle = state.cycles.find((entry) => entry.id === id);
      if (!cycle) throw new NotFoundException();
      requireFarm(state, member, cycle.farmId);
      if (
        state.activities.some(
          (entry) =>
            entry.cycleId === id && entry.status === "pending_approval",
        )
      )
        throw new ConflictException(
          "Review pending treatments before closing the cycle.",
        );
      cycle.stage = "closed";
      audit(state, actor, `cycle.closed: ${data.reason}`, id, cycle.farmId);
      return cycle;
    });
  }

  configureErpCompany(actor: string, id: string, input: unknown) {
    return this.store.transaction((state) => {
      const member = getMember(state, actor);
      requireRole(member, []);
      const data = parse(farmErpCompanySchema, input);
      const entity = state.legalEntities.find((entry) => entry.id === id);
      if (!entity) throw new NotFoundException();
      if (
        state.erpJobs.some(
          (job) => job.legalEntityId === id && job.status === "processing",
        )
      )
        throw new ConflictException(
          "Wait for in-flight reconciliation before changing the Company mapping.",
        );
      entity.erpCompany = data.erpCompany;
      audit(state, actor, "entity.erp-company.changed", id);
      return entity;
    });
  }

  async dispatchErp(actor: string, id: string) {
    if (!this.erp)
      throw new ConflictException("ERP integration is not configured.");
    const claim = await this.store.transaction((state) => {
      const member = getMember(state, actor);
      requireRole(member, ["accountant"]);
      const job = state.erpJobs.find((entry) => entry.id === id);
      if (!job) throw new NotFoundException();
      requireFarm(state, member, job.farmId);
      if (job.status === "draft_created") return { done: true as const, job };
      if (!["queued", "failed", "processing"].includes(job.status))
        throw new ConflictException("Approve the request first.");
      if (
        job.status === "processing" &&
        job.leaseUntil &&
        Date.parse(job.leaseUntil) > Date.now()
      )
        throw new ConflictException("ERP request is already being reconciled.");
      const approver = getMember(state, job.approvedBy || "");
      requireRole(approver, ["accountant"]);
      requireFarm(state, approver, job.farmId);
      const creator = getMember(state, job.actorId);
      requireRole(creator, ["manager", "accountant"]);
      requireFarm(state, creator, job.farmId);
      const entity = state.legalEntities.find(
        (entry) => entry.id === job.legalEntityId,
      );
      if (!entity?.erpCompany || entity.erpCompany !== job.erpCompany)
        throw new ConflictException(
          "ERP Company mapping changed or is missing. Reject and recreate the request for independent approval.",
        );
      job.status = "processing";
      job.attempts += 1;
      job.leaseUntil = new Date(Date.now() + 120000).toISOString();
      audit(state, actor, "erp.dispatch", id, job.farmId);
      return {
        done: false as const,
        job: structuredClone(job),
        company: entity.erpCompany,
        organization: state.organizationId,
      };
    });
    if (claim.done) return claim.job;
    let name: string | undefined;
    try {
      name = await this.erp.ensureDraft(
        claim.job,
        claim.company,
        claim.organization,
      );
    } catch {
      /* provider details may contain secrets; save only a bounded diagnostic */
    }
    const receipt = await this.store.transaction((state) => {
      const job = state.erpJobs.find((entry) => entry.id === id)!;
      // An expired attempt cannot overwrite a newer lease or successful receipt.
      if (job.attempts === claim.job.attempts && job.status === "processing") {
        job.status = name ? "draft_created" : "failed";
        job.externalName = name;
        job.leaseUntil = undefined;
        job.lastError = name
          ? undefined
          : "ERP draft not confirmed. Check ERP permissions, unique event field and connection; retry reconciles before creating.";
        audit(state, actor, `erp.${job.status}`, id, job.farmId);
      }
      return job;
    });
    // Commit the provider receipt even if the dispatcher's access was revoked in
    // flight, then apply fresh authorization before disclosing it.
    await this.store.transaction((state) => {
      const member = getMember(state, actor);
      requireFarm(state, member, receipt.farmId);
      requireRole(member, ["accountant"]);
    });
    return receipt;
  }
}
