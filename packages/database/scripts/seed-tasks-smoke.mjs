import { runProjectSqlFile } from "./shared-db-config.mjs";

await runProjectSqlFile("seeds/tasks-smoke.sql");
