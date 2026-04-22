import { describe, expect, it } from "vitest";

const verifierModulePath = "../../../../scripts/lib/pond-linked-smoke-verifier.mjs";

async function loadVerifierModule() {
  return (await import(verifierModulePath)) as {
    collectReferencedPondIds: (input: {
      readonly waterQualityList?: { readonly data?: { readonly items?: Array<{ readonly pondId?: string }> } };
      readonly feedList?: { readonly data?: { readonly items?: Array<{ readonly pondId?: string }> } };
      readonly tasksList?: { readonly data?: { readonly items?: Array<{ readonly pondId?: string }> } };
      readonly alertsList?: { readonly data?: { readonly items?: Array<{ readonly pondId?: string }> } };
    }) => string[];
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
    const { collectReferencedPondIds } = await loadVerifierModule();

    expect(
      collectReferencedPondIds({
        waterQualityList: { data: { items: [{ pondId: "pond-2" }, { pondId: "pond-1" }] } },
        feedList: { data: { items: [{ pondId: "pond-1" }] } },
        tasksList: { data: { items: [{ pondId: "pond-2" }, { pondId: undefined }] } },
        alertsList: { data: { items: [{ pondId: "pond-1" }, { pondId: "pond-2" }] } }
      })
    ).toEqual(["pond-1", "pond-2"]);
  });
});
