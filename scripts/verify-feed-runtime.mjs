const webBaseUrl = normalizeBaseUrl(
  process.env.AQUAPULSE_FEED_VERIFY_WEB_BASE_URL ?? "http://localhost:3000"
);
const backendBaseUrl = normalizeBaseUrl(
  process.env.AQUAPULSE_FEED_VERIFY_API_BASE_URL ??
    process.env.AQUAPULSE_WEB_LOCAL_API_BACKEND_URL ??
    "http://localhost:4000"
);
const expectedBackendAdapter = normalizeExpectedBackendAdapter(
  process.env.AQUAPULSE_FEED_VERIFY_EXPECT_BACKEND_ADAPTER ?? "postgres"
);
const pondId =
  (process.env.AQUAPULSE_FEED_VERIFY_POND_ID ?? "pond-1").trim() || "pond-1";
const existingFeedId =
  (process.env.AQUAPULSE_FEED_VERIFY_ENTRY_ID ?? "feed-1").trim() || "feed-1";
const expectSeededSmoke = parseBoolean(process.env.AQUAPULSE_FEED_VERIFY_EXPECT_SEEDED_SMOKE);

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

function verifySeededSmokeExpectations({ list, seededDetail }) {
  if (!Array.isArray(list.data.items) || list.data.items.length !== 3) {
    throw new Error(
      `Seeded smoke verification expected exactly 3 pond-scoped feed entries, received ${list?.data?.items?.length ?? "unknown"}.`
    );
  }

  if (list.data.items[0]?.id !== existingFeedId) {
    throw new Error(
      `Seeded smoke verification expected the latest pond feed entry ${existingFeedId}, received ${list.data.items[0]?.id}.`
    );
  }

  if (seededDetail.data.pondId !== pondId) {
    throw new Error(
      `Seeded smoke verification expected detail pond ${pondId}, received ${seededDetail.data.pondId}.`
    );
  }

  if (seededDetail.data.id !== existingFeedId) {
    throw new Error(
      `Seeded smoke verification expected detail id ${existingFeedId}, received ${seededDetail.data.id}.`
    );
  }

  if (
    seededDetail.data.feedType !== "Grower Feed" ||
    seededDetail.data.quantityKg !== 92 ||
    seededDetail.data.batchId !== "batch-pond-1-a"
  ) {
    throw new Error("Seeded smoke verification found unexpected latest feed values.");
  }

  logStep("Seeded smoke dataset assertions passed.");
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

async function main() {
  logStep("Feed runtime verification started.");
  logStep(`Web base URL: ${webBaseUrl}`);
  logStep(`Backend base URL: ${backendBaseUrl}`);
  logStep(`Expected backend adapter: ${expectedBackendAdapter}`);
  logStep(`Pond ID: ${pondId}`);

  logStep(`Verifying backend diagnostics at ${backendBaseUrl}`);
  const backendRuntime = await readJsonResponse(`${backendBaseUrl}/api/diagnostics/runtime`);

  if (backendRuntime.feed?.effectiveAdapter !== expectedBackendAdapter) {
    throw new Error(
      `Expected backend feed adapter ${expectedBackendAdapter}, received ${backendRuntime.feed?.effectiveAdapter ?? "unknown"}.`
    );
  }

  logStep(`Backend feed adapter: ${backendRuntime.feed.effectiveAdapter}`);
  logStep(`Backend feed cutover active: ${backendRuntime.feed.cutoverActive ? "yes" : "no"}`);

  logStep(`Verifying feed list, create, detail, and update through ${webBaseUrl}`);
  const list = await readJsonResponse(
    `${webBaseUrl}/api/feed?page=1&pageSize=20&pondId=${encodeURIComponent(pondId)}`
  );
  const seededDetail = await readJsonResponse(
    `${webBaseUrl}/api/feed/${encodeURIComponent(existingFeedId)}`
  );
  const fedAt = new Date().toISOString();
  const created = await readJsonResponse(`${webBaseUrl}/api/feed`, {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({
      pondId,
      batchId: "batch-verify",
      feedType: "Verifier Feed",
      quantityKg: 42,
      fedAt
    })
  });
  const detail = await readJsonResponse(
    `${webBaseUrl}/api/feed/${encodeURIComponent(created?.data?.id ?? existingFeedId)}`
  );
  const updated = await readJsonResponse(
    `${webBaseUrl}/api/feed/${encodeURIComponent(created?.data?.id ?? existingFeedId)}`,
    {
      method: "PATCH",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        feedType: "Verifier Feed Updated",
        quantityKg: 46
      })
    }
  );

  if (!Array.isArray(list?.data?.items)) {
    throw new Error("Feed list response shape is invalid.");
  }

  if (created?.data?.pondId !== pondId) {
    throw new Error(
      `Feed create verification expected pond ${pondId}, received ${created?.data?.pondId}.`
    );
  }

  if (!seededDetail?.data?.id || !detail?.data?.id) {
    throw new Error("Feed detail response shape is invalid.");
  }

  if (updated?.data?.feedType !== "Verifier Feed Updated") {
    throw new Error("Feed update verification did not observe the updated feed type.");
  }

  if (expectSeededSmoke) {
    verifySeededSmokeExpectations({ list, seededDetail });
  }

  logStep(
    `Feed verification completed: ${list.data.items.length} listed entr${list.data.items.length === 1 ? "y" : "ies"}, created ${created.data.id}, detail ${detail.data.id}, updated ${updated.data.id}.`
  );
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
