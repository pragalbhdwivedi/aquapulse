/** Additive integrated-farming contracts. Legacy pond contracts remain unchanged. */
export const farmEnterprises = [
  "aquaculture",
  "crops",
  "livestock",
  "dairy",
  "poultry",
  "protected_cultivation",
  "mushrooms",
  "apiculture",
] as const;
export type FarmEnterprise = (typeof farmEnterprises)[number];
export type FarmRole =
  | "owner"
  | "manager"
  | "operator"
  | "accountant"
  | "viewer";
export type FarmFieldValue = string | number;
export interface FarmField {
  key: string;
  label: string;
  kind: "text" | "number" | "date";
  required?: boolean;
  unit?: string;
  min?: number;
  max?: number;
  integer?: boolean;
}
export interface FarmActivityDefinition {
  id: string;
  label: string;
  fields: readonly FarmField[];
  requiresApproval?: boolean;
  stockEffect?: "increase" | "decrease";
}
export interface FarmEnterpriseDefinition {
  id: FarmEnterprise;
  label: string;
  labelHindi: string;
  unitKinds: readonly string[];
  activities: readonly FarmActivityDefinition[];
}
const n = (
  key: string,
  label: string,
  unit: string,
  required = true,
  min = 0,
): FarmField => ({ key, label, kind: "number", unit, required, min });
const t = (key: string, label: string, required = true): FarmField => ({
  key,
  label,
  kind: "text",
  required,
});
const d = (key: string, label: string, required = true): FarmField => ({
  key,
  label,
  kind: "date",
  required,
});
const count = {
  ...n("count", "Number of animals / plants", "count", true, 1),
  integer: true,
};
const treatment: FarmActivityDefinition = {
  id: "treatment",
  label: "Treatment / vaccination",
  requiresApproval: true,
  fields: [
    t("product", "Product / vaccine"),
    t("professional", "Responsible veterinarian / specialist"),
    t("instructions", "Approved instructions"),
    d("withdrawalUntil", "Withdrawal ends", false),
  ],
};
const mortality: FarmActivityDefinition = {
  id: "mortality",
  label: "Mortality / loss",
  stockEffect: "decrease",
  fields: [count, t("cause", "Observed / suspected cause", false)],
};
const feeding: FarmActivityDefinition = {
  id: "feeding",
  label: "Feeding",
  fields: [
    t("feed", "Feed / ration"),
    n("quantityKg", "Feed supplied", "kg", true, 0.001),
  ],
};
const stocking: FarmActivityDefinition = {
  id: "stocking",
  label: "Stocking / placement",
  stockEffect: "increase",
  fields: [
    count,
    t("source", "Source / supplier"),
    t("sourceLot", "Source lot", false),
  ],
};
const harvest: FarmActivityDefinition = {
  id: "harvest",
  label: "Harvest / production output",
  stockEffect: "decrease",
  fields: [
    n("quantityKg", "Output weight", "kg", true, 0.001),
    { ...count, required: false },
    t("lot", "Harvest lot"),
    t("grade", "Grade", false),
  ],
};

/** Manual record templates, not prescriptions or validated biological models. */
const enterpriseDefinitions: readonly FarmEnterpriseDefinition[] = [
  {
    id: "aquaculture",
    label: "Aquaculture",
    labelHindi: "मत्स्य पालन",
    unitKinds: [
      "pond",
      "tank",
      "cage",
      "hatchery",
      "nursery",
      "ras",
      "biofloc",
    ],
    activities: [
      stocking,
      feeding,
      mortality,
      treatment,
      harvest,
      {
        id: "water_sample",
        label: "Water sample",
        fields: [
          n("temperatureC", "Temperature", "°C", false, -5),
          { ...n("ph", "pH", "pH", false), max: 14 },
          n("dissolvedOxygen", "Dissolved oxygen", "mg/L", false),
          n("ammonia", "Total ammonia nitrogen", "mg/L", false),
          n("nitrite", "Nitrite", "mg/L", false),
          n("salinity", "Salinity", "ppt", false),
          n("alkalinity", "Alkalinity", "mg/L", false),
        ],
      },
      {
        id: "growth_sample",
        label: "Growth / biomass sample",
        fields: [
          n("sampleCount", "Sampled animals", "count", true, 1),
          n("averageWeightG", "Average weight", "g", true, 0.001),
        ],
      },
      {
        id: "spawning",
        label: "Broodstock spawning",
        fields: [
          t("broodstock", "Broodstock references"),
          n("eggs", "Eggs collected", "count"),
          n("hatched", "Larvae hatched", "count", false),
        ],
      },
      {
        id: "water_exchange",
        label: "Water exchange / filter maintenance",
        fields: [
          n("volumeM3", "Exchanged volume", "m³"),
          t("source", "Water source"),
          t("filterWork", "Filter / aeration work", false),
        ],
      },
    ],
  },
  {
    id: "crops",
    label: "Crops & horticulture",
    labelHindi: "फसल और बागवानी",
    unitKinds: ["field", "orchard", "nursery", "agroforestry", "bed"],
    activities: [
      {
        id: "planting",
        label: "Sowing / transplanting",
        fields: [
          t("variety", "Variety"),
          t("seedLot", "Seed / seedling lot"),
          n("areaHa", "Planted area", "ha", true, 0.0001),
          n("seedKg", "Seed used", "kg", false),
        ],
      },
      {
        id: "soil_sample",
        label: "Soil / leaf test",
        fields: [
          { ...n("ph", "Soil pH", "pH", false), max: 14 },
          n("organicCarbon", "Organic carbon", "%", false),
          n("nitrogen", "Nitrogen", "mg/kg", false),
          n("phosphorus", "Phosphorus", "mg/kg", false),
          n("potassium", "Potassium", "mg/kg", false),
          t("labReference", "Lab reference", false),
        ],
      },
      {
        id: "scouting",
        label: "Pest / disease scouting",
        fields: [
          t("observation", "Observed symptoms / beneficial organisms"),
          n("affectedPercent", "Area affected", "%", false),
        ],
      },
      {
        id: "fertilizer",
        label: "Fertiliser / compost application",
        fields: [
          t("product", "Product / compost lot"),
          n("quantityKg", "Quantity", "kg", true, 0.001),
        ],
      },
      {
        id: "irrigation",
        label: "Irrigation",
        fields: [
          t("source", "Water source"),
          n("volumeM3", "Volume", "m³", true, 0.001),
          n("hours", "Pump hours", "h", false),
        ],
      },
      {
        id: "spraying",
        label: "Crop protection application",
        requiresApproval: true,
        fields: [
          t("product", "Product"),
          t("instructions", "Approved label / application instructions"),
          t("applicator", "Trained applicator"),
          d("withdrawalUntil", "Pre-harvest interval ends"),
        ],
      },
      {
        id: "propagation",
        label: "Nursery propagation / tree planting",
        fields: [
          t("source", "Parent / seed source"),
          count,
          t("method", "Propagation / planting method"),
        ],
      },
      harvest,
    ],
  },
  {
    id: "livestock",
    label: "Livestock",
    labelHindi: "पशुपालन",
    unitKinds: ["shed", "paddock", "pen", "pasture"],
    activities: [
      stocking,
      feeding,
      mortality,
      treatment,
      {
        id: "breeding",
        label: "Breeding / insemination",
        fields: [
          t("dam", "Dam identifier"),
          t("sire", "Sire / semen lot"),
          t("method", "Method"),
          d("expectedBirth", "Expected birth", false),
        ],
      },
      {
        id: "pregnancy",
        label: "Pregnancy examination",
        fields: [
          t("animal", "Animal identifier"),
          t("result", "Examination result"),
          t("professional", "Veterinarian / technician"),
        ],
      },
      {
        id: "birth",
        label: "Birth / pedigree",
        stockEffect: "increase",
        fields: [
          count,
          t("dam", "Dam identifier"),
          t("sire", "Sire identifier", false),
          t("offspring", "Offspring identifiers"),
          n("birthWeightKg", "Birth weight", "kg", false),
        ],
      },
      {
        id: "weight",
        label: "Weight / body condition",
        fields: [
          n("weightKg", "Live weight", "kg", true, 0.001),
          t("condition", "Body condition", false),
        ],
      },
      {
        id: "grazing",
        label: "Grazing / paddock movement",
        fields: [
          t("paddock", "Destination paddock"),
          n("durationHours", "Duration", "h", true, 0.001),
        ],
      },
    ],
  },
  {
    id: "dairy",
    label: "Dairy",
    labelHindi: "डेयरी",
    unitKinds: ["shed", "milking_parlour", "chilling_unit", "pasture"],
    activities: [
      stocking,
      feeding,
      mortality,
      treatment,
      {
        id: "lactation",
        label: "Lactation / calving",
        fields: [
          t("animal", "Animal identifier"),
          d("calvedAt", "Calving date"),
          n("lactationNumber", "Lactation number", "count", true, 1),
        ],
      },
      {
        id: "milk",
        label: "Milk collection / quality",
        fields: [
          n("litres", "Milk collected", "L", true, 0.001),
          n("fatPercent", "Fat", "%", false),
          n("snfPercent", "SNF", "%", false),
          t("lot", "Collection lot"),
          n("temperatureC", "Collection temperature", "°C", false, -5),
        ],
      },
      {
        id: "milk_rejection",
        label: "Rejected / withheld milk",
        fields: [
          n("litres", "Rejected / withheld", "L", true, 0.001),
          t("reason", "Reason"),
          t("disposal", "Disposal record"),
        ],
      },
      {
        id: "dry_off",
        label: "Dry-off / reproduction review",
        fields: [
          t("animal", "Animal identifier"),
          d("expectedCalving", "Expected calving", false),
          t("review", "Review / breeding record"),
        ],
      },
    ],
  },
  {
    id: "poultry",
    label: "Poultry",
    labelHindi: "मुर्गी पालन",
    unitKinds: ["broiler_shed", "layer_shed", "hatchery", "range"],
    activities: [
      stocking,
      feeding,
      mortality,
      treatment,
      harvest,
      {
        id: "weight",
        label: "Flock weight sample",
        fields: [
          n("sampleCount", "Birds sampled", "count", true, 1),
          n("averageWeightG", "Average weight", "g", true, 0.001),
        ],
      },
      {
        id: "eggs",
        label: "Egg collection / grading",
        fields: [
          n("eggs", "Collected eggs", "count", true, 1),
          n("rejected", "Rejected eggs", "count", false),
          t("grade", "Grade"),
          t("lot", "Collection lot"),
        ],
      },
      {
        id: "incubation",
        label: "Incubation / hatchability",
        fields: [
          n("eggsSet", "Eggs set", "count", true, 1),
          n("hatched", "Chicks hatched", "count"),
          t("lot", "Hatchery lot"),
        ],
      },
      {
        id: "cleaning",
        label: "Cleaning / flock turnaround",
        fields: [
          t("procedure", "Cleaning / disinfection procedure"),
          t("verification", "Supervisor verification"),
        ],
      },
    ],
  },
  {
    id: "protected_cultivation",
    label: "Greenhouse & aquaponics",
    labelHindi: "संरक्षित खेती",
    unitKinds: ["greenhouse", "hydroponic_bed", "aquaponic_bed"],
    activities: [
      {
        id: "planting",
        label: "Planting / transplanting",
        fields: [t("variety", "Variety"), t("seedLot", "Seedling lot"), count],
      },
      {
        id: "nutrient",
        label: "Nutrient solution / environment",
        fields: [
          { ...n("ph", "pH", "pH", false), max: 14 },
          n("ec", "Electrical conductivity", "mS/cm", false),
          n("temperatureC", "Temperature", "°C", false, -5),
          { ...n("humidityPercent", "Humidity", "%", false), max: 100 },
          t("nutrientLot", "Nutrient input lot", false),
        ],
      },
      {
        id: "water_loop",
        label: "Water circulation / biofilter",
        fields: [
          t("source", "Source unit / reservoir"),
          n("volumeM3", "Water circulated", "m³", true, 0.001),
          t("biofilter", "Biofilter observation", false),
        ],
      },
      {
        id: "scouting",
        label: "Plant health observation",
        fields: [t("observation", "Observed condition")],
      },
      treatment,
      harvest,
    ],
  },
  {
    id: "mushrooms",
    label: "Mushrooms",
    labelHindi: "मशरूम",
    unitKinds: ["growing_room", "incubation_room"],
    activities: [
      {
        id: "substrate",
        label: "Substrate preparation",
        fields: [
          t("substrateLot", "Substrate lot"),
          n("quantityKg", "Prepared substrate", "kg", true, 0.001),
          t("pasteurization", "Pasteurisation / sterilisation record"),
        ],
      },
      {
        id: "inoculation",
        label: "Spawn inoculation",
        fields: [
          t("spawnLot", "Spawn lot / strain"),
          n("bags", "Bags / blocks", "count", true, 1),
          t("substrateLot", "Substrate lot"),
        ],
      },
      {
        id: "environment",
        label: "Incubation / growing conditions",
        fields: [
          n("temperatureC", "Temperature", "°C", false, -5),
          { ...n("humidityPercent", "Humidity", "%", false), max: 100 },
          n("co2Ppm", "CO₂", "ppm", false),
        ],
      },
      {
        id: "contamination",
        label: "Contamination / disposal",
        fields: [
          n("bags", "Affected bags", "count", true, 1),
          t("observation", "Observed contamination"),
          t("disposal", "Disposal / isolation record"),
        ],
      },
      {
        id: "flush",
        label: "Flush harvest",
        fields: [
          n("flushNumber", "Flush number", "count", true, 1),
          n("quantityKg", "Harvest weight", "kg", true, 0.001),
          t("lot", "Harvest lot"),
        ],
      },
    ],
  },
  {
    id: "apiculture",
    label: "Beekeeping",
    labelHindi: "मधुमक्खी पालन",
    unitKinds: ["apiary", "hive"],
    activities: [
      {
        id: "inspection",
        label: "Hive inspection",
        fields: [
          t("queen", "Queen status / identifier"),
          t("brood", "Brood condition"),
          t("health", "Pest / health observations"),
          n("frames", "Occupied frames", "count", false),
        ],
      },
      {
        id: "colony",
        label: "Colony split / queen replacement",
        fields: [
          t("sourceColony", "Source colony"),
          t("action", "Split / merge / queen action"),
          t("destination", "Destination hive", false),
        ],
      },
      {
        id: "feeding",
        label: "Supplemental feeding",
        fields: [
          t("feed", "Feed"),
          n("quantityKg", "Quantity", "kg", true, 0.001),
        ],
      },
      treatment,
      {
        id: "harvest",
        label: "Honey / wax harvest",
        fields: [
          n("quantityKg", "Harvest weight", "kg", true, 0.001),
          t("product", "Honey / wax / other product"),
          t("lot", "Harvest lot"),
        ],
      },
      {
        id: "pollination",
        label: "Pollination placement",
        fields: [
          t("crop", "Crop / orchard"),
          t("location", "Placement location"),
          d("endsAt", "Placement ends", false),
        ],
      },
    ],
  },
];
const sharedFarmActivities: readonly FarmActivityDefinition[] = [
  {
    id: "lab_result",
    label: "Laboratory result",
    fields: [
      t("sampleId", "Sample identifier"),
      d("sampledAt", "Sample date"),
      t("parameter", "Test parameter"),
      t("result", "Reported result"),
      t("unit", "Reported unit", false),
      t("method", "Laboratory method"),
      t("laboratory", "Laboratory / accreditation reference"),
      t("reportReference", "Signed report reference"),
    ],
  },
  {
    id: "biosecurity",
    label: "Biosecurity / visitor / hygiene check",
    fields: [
      t("subject", "Visitor / equipment / production area"),
      t("observation", "Observed risk / condition"),
      t("controls", "Isolation / hygiene controls"),
      t("verification", "Responsible supervisor verification"),
    ],
  },
  {
    id: "storage",
    label: "Storage / cold-chain observation",
    fields: [
      t("lot", "Production lot"),
      t("location", "Store / chiller / vehicle"),
      n("temperatureC", "Measured temperature", "°C", true, -100),
      t("condition", "Packaging / storage condition"),
    ],
  },
  {
    id: "dispatch",
    label: "Production dispatch / traceability",
    fields: [
      t("lot", "Production lot"),
      n("quantityKg", "Dispatched weight", "kg", true, 0.001),
      t("destination", "Buyer / destination reference"),
      t("transport", "Transport / delivery reference"),
      t("erpReference", "ERPNext delivery / invoice reference", false),
    ],
  },
];
export const farmEnterpriseCatalog: readonly FarmEnterpriseDefinition[] =
  enterpriseDefinitions.map((entry) => ({
    ...entry,
    activities: [...entry.activities, ...sharedFarmActivities],
  }));
export interface FarmLegalEntity {
  id: string;
  name: string;
  country: "IN";
  state: string;
  currency: "INR";
  erpCompany?: string;
}
export interface Farm {
  id: string;
  legalEntityId: string;
  name: string;
  code: string;
  timezone: "Asia/Kolkata";
  location?: string;
}
export interface FarmMembership {
  userId: string;
  role: FarmRole;
  farmIds: string[];
  active: boolean;
}
export interface FarmProductionUnit {
  id: string;
  farmId: string;
  name: string;
  enterprise: FarmEnterprise;
  kind: string;
  areaHa?: number;
}
export interface FarmProductionCycle {
  id: string;
  farmId: string;
  unitId: string;
  name: string;
  species: string;
  enterprise: FarmEnterprise;
  stage: "active" | "closed";
  startsAt: string;
  parentCycleId?: string;
  initialCount: number;
}
export interface FarmActivity {
  id: string;
  farmId: string;
  cycleId: string;
  type: string;
  recordedAt: string;
  fields: Record<string, FarmFieldValue>;
  note?: string;
  status: "recorded" | "pending_approval" | "approved" | "rejected" | "voided";
  actorId: string;
  decisionBy?: string;
  decisionReason?: string;
  submissionId: string;
}
export interface FarmMaterial {
  id: string;
  farmId: string;
  name: string;
  unit: "kg" | "L" | "count" | "m3";
  erpItemCode?: string;
}
export interface FarmMaterialMovement {
  id: string;
  farmId: string;
  materialId: string;
  kind: "receipt" | "issue" | "transfer";
  quantity: number;
  destinationFarmId?: string;
  destinationMaterialId?: string;
  lot: string;
  recordedAt: string;
  actorId: string;
  submissionId: string;
}
export interface FarmAuditRecord {
  id: string;
  farmId?: string;
  actorId: string;
  action: string;
  resourceId: string;
  at: string;
}
export interface FarmErpLine {
  itemCode: string;
  quantity: number;
  rate: number;
  warehouse?: string;
}
export interface FarmErpJob {
  id: string;
  farmId: string;
  legalEntityId: string;
  erpCompany?: string;
  kind: "Sales Invoice" | "Purchase Invoice";
  party: string;
  postingDate: string;
  lines: FarmErpLine[];
  status:
    | "pending_approval"
    | "queued"
    | "processing"
    | "draft_created"
    | "failed"
    | "rejected";
  actorId: string;
  approvedBy?: string;
  externalName?: string;
  attempts: number;
  lastError?: string;
  leaseUntil?: string;
  submissionId: string;
}
export interface FarmWorkTask {
  id: string;
  farmId: string;
  cycleId?: string;
  title: string;
  dueAt: string;
  assignedTo: string;
  status: "open" | "done";
  actorId: string;
}
export interface FarmTaskUpdate {
  id: string;
  taskId: string;
  farmId: string;
  status: "open" | "done";
  note: string;
  actorId: string;
  submissionId: string;
  recordedAt: string;
}
export interface FarmPhoto {
  id: string;
  farmId: string;
  activityId: string;
  caption: string;
  dataUrl: string;
  actorId: string;
  submissionId: string;
}
export interface FarmSubmissionReceipt {
  submissionId: string;
  actorId: string;
  operation: string;
  fingerprint: string;
  resourceId: string;
}
export interface FarmWorkspace {
  schemaVersion: 1;
  organizationId: string;
  organizationName: string;
  memberships: FarmMembership[];
  legalEntities: FarmLegalEntity[];
  farms: Farm[];
  units: FarmProductionUnit[];
  cycles: FarmProductionCycle[];
  activities: FarmActivity[];
  materials: FarmMaterial[];
  movements: FarmMaterialMovement[];
  erpJobs: FarmErpJob[];
  audit: FarmAuditRecord[];
  tasks: FarmWorkTask[];
  taskUpdates: FarmTaskUpdate[];
  photos: FarmPhoto[];
  receipts: FarmSubmissionReceipt[];
}
export interface FarmWorkspaceView
  extends Omit<FarmWorkspace, "memberships" | "receipts" | "photos"> {
  currentRole: FarmRole;
  actorId: string;
  storage: "memory" | "postgres";
  demo: boolean;
  erpConfigured: boolean;
  memberships?: FarmMembership[];
  photos: Omit<FarmPhoto, "dataUrl">[];
}
export interface FarmActivitySubmission {
  submissionId: string;
  cycleId: string;
  type: string;
  recordedAt: string;
  fields: Record<string, FarmFieldValue>;
  note?: string;
}
export function farmCycleCount(
  cycle: FarmProductionCycle,
  activities: readonly FarmActivity[],
): number {
  const definition = farmEnterpriseCatalog.find(
    (entry) => entry.id === cycle.enterprise,
  )!;
  return activities
    .filter(
      (entry) =>
        entry.cycleId === cycle.id &&
        (entry.status === "recorded" || entry.status === "approved"),
    )
    .reduce((total, entry) => {
      const effect = definition.activities.find(
        (item) => item.id === entry.type,
      )?.stockEffect;
      const quantity =
        typeof entry.fields.count === "number" ? entry.fields.count : 0;
      return (
        total +
        (effect === "increase"
          ? quantity
          : effect === "decrease"
            ? -quantity
            : 0)
      );
    }, cycle.initialCount);
}
export function farmMaterialBalance(
  materialId: string,
  movements: readonly FarmMaterialMovement[],
): number {
  return movements.reduce(
    (total, movement) =>
      total +
      (movement.materialId === materialId
        ? movement.kind === "receipt"
          ? movement.quantity
          : -movement.quantity
        : 0) +
      (movement.destinationMaterialId === materialId ? movement.quantity : 0),
    0,
  );
}
