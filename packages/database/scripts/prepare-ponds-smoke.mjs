import { runProjectSqlFile } from "./shared-db-config.mjs";

await runProjectSqlFile("migrations/0001_core_schema.sql");
await runProjectSqlFile("seeds/ponds-smoke.sql");
