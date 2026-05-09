const webBaseUrl = normalizeBaseUrl(
  process.env.AQUAPULSE_PONDS_VERIFY_WEB_BASE_URL ?? "http://localhost:3000"
);
const backendBaseUrl = normalizeBaseUrl(
  process.env.AQUAPULSE_PONDS_VERIFY_API_BASE_URL ??
    process.env.AQUAPULSE_WEB_LOCAL_API_BACKEND_URL ??
    "http://localhost:4000"
);
const expectedBackendAdapter = normalizeExpectedBackendAdapter(
  process.env.AQUAPULSE_PONDS_VERIFY_EXPECT_BACKEND_ADAPTER ?? "postgres"
);
const pondId = (process.env.AQUAPULSE_PONDS_VERIFY_POND_ID ?? "pond-1").trim() || "pond-1";
const expectSeededSmoke = parseBoolean(process.env.AQUAPULSE_PONDS_VERIFY_EXPECT_SEEDED_SMOKE);

function parseBoolean(value) {
  if (!value) {
    return false;
  }

  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}

function normalizeBaseUrl(value) {
  const trimmed = value.trim();
  const parsed = new URL(trimmed);
  return parsed.toString().replace(/\/+$/, "");
}

function normalizeExpectedBackendAdapter(value) {
  return value === "in-memory" ? "in-memory" : "postgres";
}

function logStep(message) {
  process.stdout.write(`${message}\n`);
}

async function readJsonResponse(url, init = {}) {
  const response = await fetch(url, {
    ...init,
    headers: {
      accept: "application/json",
      ...(init.headers ?? {})
    }
  });

  const rawBody = await response.text();
  const body = rawBody ? JSON.parse(rawBody) : undefined;

  if (!response.ok) {
    throw new Error(
      `${init.method ?? "GET"} ${url} failed with ${response.status}: ${JSON.stringify(body)}`
    );
  }

  return body;
}

function verifySeededSmokeExpectations({ list, detail }) {
  if (!Array.isArray(list.data.items) || list.data.items.length !== 4) {
    throw new Error(
      `Seeded smoke verification expected exactly 4 seeded ponds, received ${list?.data?.items?.length ?? "unknown"}.`
    );
  }

  if (list.data.items[0]?.id !== "pond-3") {
    throw new Error(
      `Seeded smoke verification expected the first alphabetically sorted pond to be pond-3, received ${list.data.items[0]?.id}.`
    );
  }

  if (list.data.items[1]?.id !== pondId) {
    throw new Error(
      `Seeded smoke verification expected pond ${pondId} to appear second in sorted results, received ${list.data.items[1]?.id}.`
    );
  }

  if (detail.data.name !== "North Nursery" || detail.data.code !== "NN-01") {
    throw new Error("Seeded smoke verification found unexpected pond detail values.");
  }

  logStep("Seeded smoke dataset assertions passed.");
}

async function main() {
  logStep("Ponds runtime verification started.");
  logStep(`Web base URL: ${webBaseUrl}`);
  logStep(`Backend base URL: ${backendBaseUrl}`);
  logStep(`Expected backend adapter: ${expectedBackendAdapter}`);
  logStep(`Pond ID: ${pondId}`);

  logStep(`Verifying backend diagnostics at ${backendBaseUrl}`);
  const backendRuntime = await readJsonResponse(`${backendBaseUrl}/api/diagnostics/runtime`);

  if (backendRuntime.ponds?.effectiveAdapter !== expectedBackendAdapter) {
    throw new Error(
      `Expected backend ponds adapter ${expectedBackendAdapter}, received ${backendRuntime.ponds?.effectiveAdapter ?? "unknown"}.`
    );
  }

  logStep(`Backend ponds adapter: ${backendRuntime.ponds.effectiveAdapter}`);
  logStep(`Backend ponds cutover active: ${backendRuntime.ponds.cutoverActive ? "yes" : "no"}`);

  logStep(`Verifying ponds reads through ${webBaseUrl}`);
  const list = await readJsonResponse(`${webBaseUrl}/api/ponds?page=1&pageSize=20`);
  const detail = await readJsonResponse(`${webBaseUrl}/api/ponds/${encodeURIComponent(pondId)}`);

  if (!Array.isArray(list?.data?.items)) {
    throw new Error("Ponds list response shape is invalid.");
  }

  if (!detail?.data?.id) {
    throw new Error("Ponds detail response shape is invalid.");
  }

  if (detail.data.id !== pondId) {
    throw new Error(
      `Ponds detail verification expected pond ${pondId}, received ${detail.data.id}.`
    );
  }

  if (expectSeededSmoke) {
    verifySeededSmokeExpectations({ list, detail });
  }

  logStep(
    `Ponds verification completed: ${list.data.items.length} listed pond(s), detail ${detail.data.id}.`
  );
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
