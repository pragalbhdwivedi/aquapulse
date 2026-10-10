import pg from "pg";
import { readProjectFile } from "./shared-db-config.mjs";

// Dedicated target: never reuse a legacy smoke database implicitly.
if (!process.env.AQUAPULSE_FARM_DATABASE_URL)
  throw new Error(
    "Set AQUAPULSE_FARM_DATABASE_URL to an explicitly approved database.",
  );
const url = new URL(process.env.AQUAPULSE_FARM_DATABASE_URL);
for (const key of url.searchParams.keys())
  if (key.toLowerCase().startsWith("ssl"))
    throw new Error("Use AQUAPULSE_FARM_DATABASE_TLS for verified TLS.");
if (
  process.env.NODE_ENV === "production" &&
  process.env.AQUAPULSE_FARM_DATABASE_TLS !== "verify"
)
  throw new Error("Verified TLS is required in production.");
const client = new pg.Client({
  connectionString: url.toString(),
  ssl:
    process.env.AQUAPULSE_FARM_DATABASE_TLS === "verify"
      ? { rejectUnauthorized: true }
      : false,
});
try {
  await client.connect();
  await client.query(
    await readProjectFile("migrations/0006_integrated_farming.sql"),
  );
  console.log(
    "Applied additive integrated farming migration 0006. Existing farm data was preserved.",
  );
} finally {
  await client.end();
}
