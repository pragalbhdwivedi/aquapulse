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

function normalizePondId(value, fallback) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : fallback;
}

function parseExpectedPondIds(value, fallback) {
  if (!value) {
    return [...fallback];
  }

  const parsed = value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return parsed.length > 0 ? [...new Set(parsed)].sort() : [...fallback];
}

export function readPondLinkedSmokeVerificationConfig(env = process.env) {
  const pondId = normalizePondId(env.AQUAPULSE_POND_LINKED_VERIFY_POND_ID, "pond-1");
  const secondaryPondId = normalizePondId(
    env.AQUAPULSE_POND_LINKED_VERIFY_SECONDARY_POND_ID,
    "pond-2"
  );

  return {
    webBaseUrl: normalizeBaseUrl(
      env.AQUAPULSE_POND_LINKED_VERIFY_WEB_BASE_URL ?? "http://localhost:3000"
    ),
    backendBaseUrl: normalizeBaseUrl(
      env.AQUAPULSE_POND_LINKED_VERIFY_API_BASE_URL ??
        env.AQUAPULSE_WEB_LOCAL_API_BACKEND_URL ??
        "http://localhost:4000"
    ),
    expectedBackendAdapter: normalizeExpectedBackendAdapter(
      env.AQUAPULSE_POND_LINKED_VERIFY_EXPECT_BACKEND_ADAPTER ?? "postgres"
    ),
    pondId,
    secondaryPondId,
    alertId: (env.AQUAPULSE_POND_LINKED_VERIFY_ALERT_ID ?? "alert-1").trim() || "alert-1",
    expectSeededSmoke: parseBoolean(env.AQUAPULSE_POND_LINKED_VERIFY_EXPECT_SEEDED_SMOKE)
  };
}

export function createExpectedSeededPondLinks(config) {
  return {
    ponds: [config.pondId, config.secondaryPondId, "pond-3", "pond-4"].sort(),
    waterQuality: [config.pondId, config.secondaryPondId, "pond-3"].sort(),
    feed: [config.pondId, config.secondaryPondId].sort(),
    tasks: [config.pondId, config.secondaryPondId].sort(),
    alerts: [config.pondId, config.secondaryPondId].sort()
  };
}

export function collectReferencedPondIdsByDomain({
  waterQualityList,
  feedList,
  tasksList,
  alertsList
}) {
  return {
    waterQuality: collectIdsFromItems(waterQualityList?.data?.items),
    feed: collectIdsFromItems(feedList?.data?.items),
    tasks: collectIdsFromItems(tasksList?.data?.items),
    alerts: collectIdsFromItems(alertsList?.data?.items)
  };
}

export function collectReferencedPondIds(payload) {
  const ids = new Set();
  const byDomain = collectReferencedPondIdsByDomain(payload);

  for (const domainIds of Object.values(byDomain)) {
    for (const id of domainIds) {
      ids.add(id);
    }
  }

  return [...ids].sort();
}

export function collectSeededPondIds(pondsList) {
  return collectIdsFromItems(pondsList?.data?.items);
}

export function verifyReferencedPondIdsAgainstKnownPonds(knownPondIds, byDomain) {
  const known = new Set(knownPondIds);
  const unknownByDomain = {};

  for (const [domain, ids] of Object.entries(byDomain)) {
    const unknown = ids.filter((id) => !known.has(id));
    if (unknown.length > 0) {
      unknownByDomain[domain] = unknown;
    }
  }

  return {
    ok: Object.keys(unknownByDomain).length === 0,
    unknownByDomain
  };
}

export function verifyExpectedSeededPondLinks(actualByDomain, expectedByDomain) {
  const mismatches = {};

  for (const domain of Object.keys(expectedByDomain)) {
    const actual = [...(actualByDomain[domain] ?? [])].sort();
    const expected = [...(expectedByDomain[domain] ?? [])].sort();

    if (actual.join("|") !== expected.join("|")) {
      mismatches[domain] = {
        actual,
        expected
      };
    }
  }

  return {
    ok: Object.keys(mismatches).length === 0,
    mismatches
  };
}

function collectIdsFromItems(items) {
  const ids = new Set();

  for (const item of items ?? []) {
    if (item?.pondId) {
      ids.add(item.pondId);
      continue;
    }

    if (item?.id) {
      ids.add(item.id);
    }
  }

  return [...ids].sort();
}
