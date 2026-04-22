import { describe, expect, it } from "vitest";

const verifierModulePath = "../../../../scripts/lib/pond-linked-smoke-verifier.mjs";

async function loadVerifierModule() {
  return (await import(verifierModulePath)) as {
    collectReferencedPondIdsByDomain: (input: {
      readonly waterQualityList?: { readonly data?: { readonly items?: Array<{ readonly pondId?: string }> } };
      readonly feedList?: { readonly data?: { readonly items?: Array<{ readonly pondId?: string }> } };
      readonly tasksList?: { readonly data?: { readonly items?: Array<{ readonly pondId?: string }> } };
      readonly alertsList?: { readonly data?: { readonly items?: Array<{ readonly pondId?: string }> } };
    }) => {
      readonly waterQuality: string[];
      readonly feed: string[];
      readonly tasks: string[];
      readonly alerts: string[];
    };
    collectReferencedPondIds: (input: {
      readonly waterQualityList?: { readonly data?: { readonly items?: Array<{ readonly pondId?: string }> } };
      readonly feedList?: { readonly data?: { readonly items?: Array<{ readonly pondId?: string }> } };
      readonly tasksList?: { readonly data?: { readonly items?: Array<{ readonly pondId?: string }> } };
      readonly alertsList?: { readonly data?: { readonly items?: Array<{ readonly pondId?: string }> } };
    }) => string[];
    collectSeededPondIds: (pondsList?: {
      readonly data?: { readonly items?: Array<{ readonly id?: string }> };
    }) => string[];
    createExpectedSeededPondLinks: (config: {
      readonly pondId: string;
      readonly secondaryPondId: string;
    }) => {
      readonly ponds: string[];
      readonly waterQuality: string[];
      readonly feed: string[];
      readonly tasks: string[];
      readonly alerts: string[];
    };
    readPondLinkedSmokeVerificationConfig: (
      env?: Record<string, string | undefined>
    ) => {
      readonly webBaseUrl: string;
      readonly backendBaseUrl: string;
      readonly expectedBackendAdapter: "in-memory" | "postgres";
      readonly pondId: string;
      readonly secondaryPondId: string;
      readonly alertId: string;
      readonly expectSeededSmoke: boolean;
    };
    verifyReferencedPondIdsAgainstKnownPonds: (
      knownPondIds: string[],
      byDomain: Record<string, string[]>
    ) => {
      readonly ok: boolean;
      readonly unknownByDomain: Record<string, string[]>;
    };
    verifyExpectedSeededPondLinks: (
      actualByDomain: Record<string, string[]>,
      expectedByDomain: Record<string, string[]>
    ) => {
      readonly ok: boolean;
      readonly mismatches: Record<string, { readonly actual: string[]; readonly expected: string[] }>;
    };
  };
}

describe("Pond-linked smoke verifier config", () => {
  it("keeps bounded verifier defaults local-development-safe", async () => {
    const { readPondLinkedSmokeVerificationConfig } = await loadVerifierModule();
    const config = readPondLinkedSmokeVerificationConfig({});

    expect(config.webBaseUrl).toBe("http://localhost:3000");
    expect(config.backendBaseUrl).toBe("http://localhost:4000");
    expect(config.expectedBackendAdapter).toBe("postgres");
    expect(config.pondId).toBe("pond-1");
    expect(config.secondaryPondId).toBe("pond-2");
    expect(config.alertId).toBe("alert-1");
    expect(config.expectSeededSmoke).toBe(false);
  });

  it("accepts explicit verifier env overrides", async () => {
    const { readPondLinkedSmokeVerificationConfig } = await loadVerifierModule();
    const config = readPondLinkedSmokeVerificationConfig({
      AQUAPULSE_POND_LINKED_VERIFY_WEB_BASE_URL: "http://localhost:3100",
      AQUAPULSE_POND_LINKED_VERIFY_API_BASE_URL: "http://localhost:4100",
      AQUAPULSE_POND_LINKED_VERIFY_EXPECT_BACKEND_ADAPTER: "in-memory",
      AQUAPULSE_POND_LINKED_VERIFY_POND_ID: "pond-9",
      AQUAPULSE_POND_LINKED_VERIFY_SECONDARY_POND_ID: "pond-8",
      AQUAPULSE_POND_LINKED_VERIFY_ALERT_ID: "alert-9",
      AQUAPULSE_POND_LINKED_VERIFY_EXPECT_SEEDED_SMOKE: "true"
    });

    expect(config.webBaseUrl).toBe("http://localhost:3100");
    expect(config.backendBaseUrl).toBe("http://localhost:4100");
    expect(config.expectedBackendAdapter).toBe("in-memory");
    expect(config.pondId).toBe("pond-9");
    expect(config.secondaryPondId).toBe("pond-8");
    expect(config.alertId).toBe("alert-9");
    expect(config.expectSeededSmoke).toBe(true);
  });

  it("collects linked pond ids deterministically across domain payloads", async () => {
    const { collectReferencedPondIds, collectReferencedPondIdsByDomain } = await loadVerifierModule();
    const payload = {
      waterQualityList: { data: { items: [{ pondId: "pond-2" }, { pondId: "pond-1" }] } },
      feedList: { data: { items: [{ pondId: "pond-1" }] } },
      tasksList: { data: { items: [{ pondId: "pond-2" }, { pondId: undefined }] } },
      alertsList: { data: { items: [{ pondId: "pond-1" }, { pondId: "pond-2" }] } }
    };

    expect(collectReferencedPondIdsByDomain(payload)).toEqual({
      waterQuality: ["pond-1", "pond-2"],
      feed: ["pond-1"],
      tasks: ["pond-2"],
      alerts: ["pond-1", "pond-2"]
    });
    expect(collectReferencedPondIds(payload)).toEqual(["pond-1", "pond-2"]);
  });

  it("derives seeded pond parity expectations and rejects unknown pond references deterministically", async () => {
    const {
      collectSeededPondIds,
      createExpectedSeededPondLinks,
      verifyExpectedSeededPondLinks,
      verifyReferencedPondIdsAgainstKnownPonds
    } = await loadVerifierModule();
    const knownPondIds = collectSeededPondIds({
      data: {
        items: [
          { id: "pond-4" },
          { id: "pond-1" },
          { id: "pond-3" },
          { id: "pond-2" }
        ]
      }
    });
    const expected = createExpectedSeededPondLinks({
      pondId: "pond-1",
      secondaryPondId: "pond-2"
    });

    expect(knownPondIds).toEqual(["pond-1", "pond-2", "pond-3", "pond-4"]);
    expect(expected).toEqual({
      ponds: ["pond-1", "pond-2", "pond-3", "pond-4"],
      waterQuality: ["pond-1", "pond-2", "pond-3"],
      feed: ["pond-1", "pond-2"],
      tasks: ["pond-1", "pond-2"],
      alerts: ["pond-1", "pond-2"]
    });

    expect(
      verifyReferencedPondIdsAgainstKnownPonds(knownPondIds, {
        waterQuality: ["pond-1", "pond-3"],
        feed: ["pond-1", "pond-2"],
        tasks: ["pond-2"],
        alerts: ["pond-1", "pond-2"]
      })
    ).toEqual({
      ok: true,
      unknownByDomain: {}
    });

    expect(
      verifyReferencedPondIdsAgainstKnownPonds(knownPondIds, {
        waterQuality: ["pond-1", "pond-9"]
      })
    ).toEqual({
      ok: false,
      unknownByDomain: {
        waterQuality: ["pond-9"]
      }
    });

    expect(
      verifyExpectedSeededPondLinks(
        {
          ponds: knownPondIds,
          waterQuality: ["pond-1", "pond-2", "pond-3"],
          feed: ["pond-1", "pond-2"],
          tasks: ["pond-1", "pond-2"],
          alerts: ["pond-1", "pond-2"]
        },
        expected
      )
    ).toEqual({
      ok: true,
      mismatches: {}
    });

    expect(
      verifyExpectedSeededPondLinks(
        {
          ponds: knownPondIds,
          waterQuality: ["pond-1", "pond-2"],
          feed: ["pond-1", "pond-2"],
          tasks: ["pond-1", "pond-2"],
          alerts: ["pond-1", "pond-2"]
        },
        expected
      )
    ).toEqual({
      ok: false,
      mismatches: {
        waterQuality: {
          actual: ["pond-1", "pond-2"],
          expected: ["pond-1", "pond-2", "pond-3"]
        }
      }
    });
  });
});
