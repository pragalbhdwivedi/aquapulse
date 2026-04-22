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

export function readPondLinkedSmokeVerificationConfig(env = process.env) {
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
    pondId: (env.AQUAPULSE_POND_LINKED_VERIFY_POND_ID ?? "pond-1").trim() || "pond-1",
    secondaryPondId:
      (env.AQUAPULSE_POND_LINKED_VERIFY_SECONDARY_POND_ID ?? "pond-2").trim() || "pond-2",
    alertId: (env.AQUAPULSE_POND_LINKED_VERIFY_ALERT_ID ?? "alert-1").trim() || "alert-1",
    expectSeededSmoke: parseBoolean(env.AQUAPULSE_POND_LINKED_VERIFY_EXPECT_SEEDED_SMOKE)
  };
}

export function collectReferencedPondIds({
  waterQualityList,
  feedList,
  tasksList,
  alertsList
}) {
  const ids = new Set();

  for (const item of waterQualityList?.data?.items ?? []) {
    if (item?.pondId) {
      ids.add(item.pondId);
    }
  }

  for (const item of feedList?.data?.items ?? []) {
    if (item?.pondId) {
      ids.add(item.pondId);
    }
  }

  for (const item of tasksList?.data?.items ?? []) {
    if (item?.pondId) {
      ids.add(item.pondId);
    }
  }

  for (const item of alertsList?.data?.items ?? []) {
    if (item?.pondId) {
      ids.add(item.pondId);
    }
  }

  return [...ids].sort();
}
