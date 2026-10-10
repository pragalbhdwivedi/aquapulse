import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

const base = new URL(process.env.AQUAPULSE_FARM_VERIFY_BASE_URL || "http://127.0.0.1:4000");
assert(["localhost", "127.0.0.1", "[::1]"].includes(base.hostname), "This synthetic verifier is loopback-only.");
async function request(path, body) {
  const response = await fetch(new URL(`/api/farming/${path}`, base), { method: body ? "POST" : "GET", headers: { "content-type": "application/json" }, body: body ? JSON.stringify(body) : undefined, redirect: "error", signal: AbortSignal.timeout(10000) });
  const result = await response.json();
  assert(response.ok && result.ok, `${path}: ${result.message || "request failed"}`);
  return result.data;
}
const workspace = await request("workspace");
assert(workspace.demo === true && workspace.storage === "memory" && workspace.actorId === "farm-demo-owner", "Refusing to write outside the explicit synthetic farming demo.");
const entity = await request("legal-entities", { name: "Synthetic Demo Company", state: "Madhya Pradesh" });
const farm = await request("farms", { legalEntityId: entity.id, name: "Synthetic Integrated Farm", code: `SYNTH-${Date.now().toString(36)}` });
const recordedAt = new Date().toISOString();
const samples = [
  ["aquaculture", "pond", "water_sample", { temperatureC: 28, ph: 7.4, dissolvedOxygen: 5.6 }],
  ["crops", "field", "planting", { variety: "Synthetic wheat", seedLot: "SEED-1", areaHa: 1 }],
  ["livestock", "shed", "weight", { weightKg: 200 }],
  ["dairy", "shed", "milk", { litres: 10, lot: "MILK-1" }],
  ["poultry", "layer_shed", "eggs", { eggs: 20, rejected: 1, grade: "A", lot: "EGGS-1" }],
  ["protected_cultivation", "greenhouse", "nutrient", { ph: 6.1, ec: 1.5 }],
  ["mushrooms", "growing_room", "flush", { flushNumber: 1, quantityKg: 5, lot: "MUSHROOM-1" }],
  ["apiculture", "apiary", "inspection", { queen: "Present", brood: "Recorded", health: "Synthetic observation" }]
];
for (const [enterprise, kind, type, fields] of samples) {
  const unit = await request("units", { farmId: farm.id, name: `Synthetic ${enterprise.replaceAll("_", " ")}`, enterprise, kind });
  const cycle = await request("cycles", { unitId: unit.id, name: `${enterprise.replaceAll("_", " ")} pilot`, species: `Synthetic ${enterprise.replaceAll("_", " ")}`, startsAt: recordedAt, initialCount: 0 });
  const payload = { submissionId: randomUUID(), cycleId: cycle.id, type, fields, recordedAt };
  const first = await request("activities", payload);
  assert.equal((await request("activities", payload)).id, first.id, "Duplicate replay created another activity.");
}
const final = await request("workspace");
assert.equal(final.units.filter(unit => unit.farmId === farm.id).length, 8);
assert.equal(final.activities.filter(activity => activity.farmId === farm.id).length, 8);
console.log("Verified all 8 enterprise captures and identical HTTP replays in the explicit local demo. Synthetic records are available at /farming.");
