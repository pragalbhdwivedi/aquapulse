import {
  collectReferencedPondIdsByDomain,
  collectSeededPondIds,
  collectReferencedPondIds,
  createExpectedSeededPondLinks,
  readPondLinkedSmokeVerificationConfig,
  verifyExpectedSeededPondLinks,
  verifyReferencedPondIdsAgainstKnownPonds
} from "./lib/pond-linked-smoke-verifier.mjs";

const config = readPondLinkedSmokeVerificationConfig();

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

function verifyBackendAdapters(runtime) {
  const adapterTargets = [
    ["ponds", runtime.ponds?.effectiveAdapter],
    ["water-quality", runtime.waterQuality?.effectiveAdapter],
    ["feed", runtime.feed?.effectiveAdapter],
    ["tasks", runtime.tasks?.effectiveAdapter],
    ["alerts", runtime.alerts?.effectiveAdapter]
  ];

  for (const [label, adapter] of adapterTargets) {
    if (adapter !== config.expectedBackendAdapter) {
      throw new Error(
        `Expected backend ${label} adapter ${config.expectedBackendAdapter}, received ${adapter ?? "unknown"}.`
      );
    }
  }
}

function verifySeededSmokeExpectations(payload) {
  const {
    pondsList,
    pondDetail,
    waterQualityList,
    waterQualityDetail,
    feedList,
    feedDetail,
    tasksList,
    taskDetail,
    alertsList,
    alertDetail
  } = payload;
  const knownPondIds = collectSeededPondIds(pondsList);
  const referencedPondIdsByDomain = collectReferencedPondIdsByDomain({
    waterQualityList,
    feedList,
    tasksList,
    alertsList
  });
  const referenceCheck = verifyReferencedPondIdsAgainstKnownPonds(
    knownPondIds,
    referencedPondIdsByDomain
  );
  const seededParity = verifyExpectedSeededPondLinks(
    {
      ponds: knownPondIds,
      ...referencedPondIdsByDomain
    },
    createExpectedSeededPondLinks(config)
  );

  if ((pondsList?.data?.items?.length ?? 0) !== 4) {
    throw new Error(
      `Seeded smoke verification expected exactly 4 seeded ponds, received ${pondsList?.data?.items?.length ?? "unknown"}.`
    );
  }

  if (!knownPondIds.includes(config.pondId) || !knownPondIds.includes(config.secondaryPondId)) {
    throw new Error(
      `Seeded smoke verification expected ponds list to include ${config.pondId} and ${config.secondaryPondId}, received ${knownPondIds.join(", ") || "none"}.`
    );
  }

  if (pondDetail?.data?.name !== "North Nursery" || pondDetail?.data?.code !== "NN-01") {
    throw new Error("Seeded smoke verification found unexpected pond detail values.");
  }

  if (pondDetail?.data?.status !== "active" || pondDetail?.data?.id !== config.pondId) {
    throw new Error("Seeded smoke verification found unexpected anchor pond status or id.");
  }

  if ((waterQualityList?.data?.items?.length ?? 0) !== 3 || waterQualityDetail?.data?.pondId !== config.pondId) {
    throw new Error("Seeded smoke verification found unexpected water-quality pond linkage.");
  }

  if ((feedList?.data?.items?.length ?? 0) !== 3 || feedDetail?.data?.pondId !== config.pondId) {
    throw new Error("Seeded smoke verification found unexpected feed pond linkage.");
  }

  if ((tasksList?.data?.items?.length ?? 0) !== 3 || taskDetail?.data?.pondId !== config.pondId) {
    throw new Error("Seeded smoke verification found unexpected tasks pond linkage.");
  }

  if ((alertsList?.data?.items?.length ?? 0) !== 2 || alertDetail?.data?.pondId !== config.pondId) {
    throw new Error("Seeded smoke verification found unexpected alerts pond linkage.");
  }

  if (!referenceCheck.ok) {
    throw new Error(
      `Seeded smoke verification found pond references that are not present in the ponds dataset: ${JSON.stringify(referenceCheck.unknownByDomain)}.`
    );
  }

  if (!seededParity.ok) {
    throw new Error(
      `Seeded smoke verification found mismatched cross-domain pond links: ${JSON.stringify(seededParity.mismatches)}.`
    );
  }

  const linkedPondIds = collectReferencedPondIds({
    waterQualityList,
    feedList,
    tasksList,
    alertsList
  });

  if (!linkedPondIds.includes(config.pondId) || !linkedPondIds.includes(config.secondaryPondId)) {
    throw new Error(
      `Seeded smoke verification expected linked pond ids ${config.pondId} and ${config.secondaryPondId}, received ${linkedPondIds.join(", ") || "none"}.`
    );
  }

  logStep(
    `Cross-domain pond linkage: water-quality=${referencedPondIdsByDomain.waterQuality.join(", ")}, feed=${referencedPondIdsByDomain.feed.join(", ")}, tasks=${referencedPondIdsByDomain.tasks.join(", ")}, alerts=${referencedPondIdsByDomain.alerts.join(", ")}.`
  );
  logStep("Cross-domain seeded smoke assertions passed.");
}

async function main() {
  logStep("Pond-linked cross-domain smoke verification started.");
  logStep(`Web base URL: ${config.webBaseUrl}`);
  logStep(`Backend base URL: ${config.backendBaseUrl}`);
  logStep(`Expected backend adapter: ${config.expectedBackendAdapter}`);
  logStep(`Anchor pond ID: ${config.pondId}`);

  const runtime = await readJsonResponse(`${config.backendBaseUrl}/api/diagnostics/runtime`);
  verifyBackendAdapters(runtime);

  logStep("Backend diagnostics verified for ponds, water-quality, feed, tasks, and alerts.");

  const [
    pondsList,
    pondDetail,
    waterQualityList,
    waterQualityDetail,
    feedList,
    feedDetail,
    tasksList,
    taskDetail,
    alertsList,
    alertDetail
  ] = await Promise.all([
    readJsonResponse(`${config.webBaseUrl}/api/ponds?page=1&pageSize=20`),
    readJsonResponse(`${config.webBaseUrl}/api/ponds/${encodeURIComponent(config.pondId)}`),
    readJsonResponse(
      `${config.webBaseUrl}/api/water-quality?page=1&pageSize=20&pondId=${encodeURIComponent(config.pondId)}`
    ),
    readJsonResponse(`${config.webBaseUrl}/api/water-quality/wq-smoke-pond-1-latest`),
    readJsonResponse(
      `${config.webBaseUrl}/api/feed?page=1&pageSize=20&pondId=${encodeURIComponent(config.pondId)}`
    ),
    readJsonResponse(`${config.webBaseUrl}/api/feed/feed-1`),
    readJsonResponse(
      `${config.webBaseUrl}/api/tasks?page=1&pageSize=20&pondId=${encodeURIComponent(config.pondId)}`
    ),
    readJsonResponse(`${config.webBaseUrl}/api/tasks/task-1`),
    readJsonResponse(
      `${config.webBaseUrl}/api/alerts?page=1&pageSize=20&pondId=${encodeURIComponent(config.pondId)}&sortBy=updatedAt_desc`
    ),
    readJsonResponse(`${config.webBaseUrl}/api/alerts/${encodeURIComponent(config.alertId)}`)
  ]);

  if (config.expectSeededSmoke) {
    verifySeededSmokeExpectations({
      pondsList,
      pondDetail,
      waterQualityList,
      waterQualityDetail,
      feedList,
      feedDetail,
      tasksList,
      taskDetail,
      alertsList,
      alertDetail
    });
  }

  const linkedPondIds = collectReferencedPondIds({
    waterQualityList,
    feedList,
    tasksList,
    alertsList
  });
  const linkedPondIdsByDomain = collectReferencedPondIdsByDomain({
    waterQualityList,
    feedList,
    tasksList,
    alertsList
  });
  const knownPondIds = collectSeededPondIds(pondsList);
  const referenceCheck = verifyReferencedPondIdsAgainstKnownPonds(
    knownPondIds,
    linkedPondIdsByDomain
  );

  if (!referenceCheck.ok) {
    throw new Error(
      `Observed pond-linked domain references included unknown pond ids: ${JSON.stringify(referenceCheck.unknownByDomain)}.`
    );
  }

  logStep(`Linked pond ids observed across domain reads: ${linkedPondIds.join(", ")}`);
  logStep(
    `Pond-linked domain coverage: ponds=${knownPondIds.join(", ")}, water-quality=${linkedPondIdsByDomain.waterQuality.join(", ")}, feed=${linkedPondIdsByDomain.feed.join(", ")}, tasks=${linkedPondIdsByDomain.tasks.join(", ")}, alerts=${linkedPondIdsByDomain.alerts.join(", ")}.`
  );
  logStep("Pond-linked cross-domain smoke verification completed successfully.");
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
