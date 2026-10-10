import { z } from "zod";
import { farmEnterprises, farmEnterpriseCatalog } from "@aquapulse/types";
const id = z.string().trim().min(1).max(120);
const name = z.string().trim().min(2).max(160);
const note = z.string().trim().max(4000);
const instant = z.string().datetime({ offset: true });
const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine(
    (value) =>
      !Number.isNaN(Date.parse(value)) &&
      new Date(value).toISOString().slice(0, 10) === value,
    "Invalid calendar date",
  );
export const farmLegalEntitySchema = z
  .object({ name, state: name, erpCompany: name.optional() })
  .strict();
export const farmErpCompanySchema = z.object({ erpCompany: name }).strict();
export const farmCreateSchema = z
  .object({
    legalEntityId: id,
    name,
    code: z
      .string()
      .trim()
      .min(2)
      .max(32)
      .regex(/^[A-Za-z0-9_-]+$/),
    location: note.optional(),
  })
  .strict();
export const farmUnitSchema = z
  .object({
    farmId: id,
    name,
    enterprise: z.enum(farmEnterprises),
    kind: id,
    areaHa: z.number().finite().positive().optional(),
  })
  .strict()
  .refine(
    (value) =>
      farmEnterpriseCatalog
        .find((entry) => entry.id === value.enterprise)!
        .unitKinds.includes(value.kind),
    "Unit kind does not match enterprise",
  );
export const farmCycleSchema = z
  .object({
    unitId: id,
    name,
    species: name,
    startsAt: instant,
    parentCycleId: id.optional(),
    initialCount: z.number().int().nonnegative().max(1e12),
  })
  .strict();
export const farmActivitySchema = z
  .object({
    submissionId: z.string().uuid(),
    cycleId: id,
    type: id,
    recordedAt: instant,
    fields: z.record(
      z.union([z.string().trim().max(2000), z.number().finite()]),
    ),
    note: note.optional(),
  })
  .strict();
export const farmDecisionSchema = z
  .object({
    decision: z.enum(["approve", "reject", "void"]),
    reason: z.string().trim().min(3).max(2000),
  })
  .strict();
export const farmMemberSchema = z
  .object({
    userId: id,
    role: z.enum(["owner", "manager", "operator", "accountant", "viewer"]),
    farmIds: z.array(id).max(500),
    active: z.boolean(),
  })
  .strict();
export const farmMaterialSchema = z
  .object({
    farmId: id,
    name,
    unit: z.enum(["kg", "L", "count", "m3"]),
    erpItemCode: name.optional(),
  })
  .strict();
export const farmMovementSchema = z
  .object({
    submissionId: z.string().uuid(),
    materialId: id,
    kind: z.enum(["receipt", "issue", "transfer"]),
    quantity: z.number().finite().positive().max(1e12),
    destinationMaterialId: id.optional(),
    lot: name,
    recordedAt: instant,
  })
  .strict();
export const farmErpJobSchema = z
  .object({
    submissionId: z.string().uuid(),
    farmId: id,
    kind: z.enum(["Sales Invoice", "Purchase Invoice"]),
    party: name,
    postingDate: date,
    lines: z
      .array(
        z
          .object({
            itemCode: name,
            quantity: z.number().finite().positive().max(1e12),
            rate: z.number().finite().nonnegative().max(1e12),
            warehouse: name.optional(),
          })
          .strict(),
      )
      .min(1)
      .max(100),
  })
  .strict();
export const farmTaskSchema = z
  .object({
    farmId: id,
    cycleId: id.optional(),
    title: name,
    dueAt: instant,
    assignedTo: id,
  })
  .strict();
export const farmTaskUpdateSchema = z
  .object({
    submissionId: z.string().uuid(),
    taskId: id,
    status: z.enum(["open", "done"]),
    note: z.string().trim().min(1).max(2000),
    recordedAt: instant,
  })
  .strict();
export const farmPhotoSchema = z
  .object({
    submissionId: z.string().uuid(),
    activityId: id,
    caption: name,
    dataUrl: z
      .string()
      .max(360000)
      .regex(/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/),
  })
  .strict();
export const farmCycleCloseSchema = z
  .object({ reason: z.string().trim().min(3).max(2000) })
  .strict();
export function validateFarmActivityFields(
  enterprise: (typeof farmEnterprises)[number],
  type: string,
  fields: Record<string, unknown>,
) {
  const activity = farmEnterpriseCatalog
    .find((entry) => entry.id === enterprise)!
    .activities.find((entry) => entry.id === type);
  if (!activity)
    return {
      success: false as const,
      message: "Activity is not supported by this enterprise.",
    };
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const field of activity.fields) {
    let rule: z.ZodTypeAny;
    if (field.kind === "number") {
      let numeric = z
        .number()
        .finite()
        .max(field.max ?? 1e12);
      if (field.min !== undefined) numeric = numeric.min(field.min);
      if (field.integer || field.unit === "count") numeric = numeric.int();
      rule = numeric;
    } else
      rule = field.kind === "date" ? date : z.string().trim().min(1).max(2000);
    shape[field.key] = field.required ? rule : rule.optional();
  }
  const result = z
    .object(shape)
    .strict()
    .refine(
      (value) => Object.values(value).some((entry) => entry !== undefined),
      "Enter at least one observation.",
    )
    .safeParse(fields);
  if (!result.success)
    return {
      success: false as const,
      message: result.error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join("; "),
    };
  const values = result.data;
  if (
    typeof values.hatched === "number" &&
    typeof (values.eggsSet ?? values.eggs) === "number" &&
    values.hatched > Number(values.eggsSet ?? values.eggs)
  )
    return {
      success: false as const,
      message: "Hatched count exceeds eggs set.",
    };
  if (
    typeof values.rejected === "number" &&
    typeof values.eggs === "number" &&
    values.rejected > values.eggs
  )
    return {
      success: false as const,
      message: "Rejected eggs exceed collected eggs.",
    };
  if (
    typeof values.affectedPercent === "number" &&
    values.affectedPercent > 100
  )
    return {
      success: false as const,
      message: "Affected percentage cannot exceed 100.",
    };
  return { success: true as const, data: result.data, definition: activity };
}
