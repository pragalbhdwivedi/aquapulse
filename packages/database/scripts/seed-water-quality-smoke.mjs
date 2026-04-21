import { runProjectSqlFile } from "./shared-db-config.mjs";

await runProjectSqlFile("seeds/water-quality-smoke.sql");
console.log("Loaded the AquaPulse water-quality smoke seed dataset.");
