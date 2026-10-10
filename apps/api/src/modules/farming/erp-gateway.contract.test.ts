import { describe, expect, it } from "vitest";
import type { FarmErpJob } from "@aquapulse/types";
import { FrappeFarmErpGateway } from "./erp-gateway";
const job: FarmErpJob = {
  id: "job-one",
  submissionId: "submission-one",
  farmId: "farm",
  legalEntityId: "entity",
  kind: "Sales Invoice",
  party: "Customer",
  postingDate: "2026-02-01",
  lines: [{ itemCode: "FISH", quantity: 2, rate: 10 }],
  status: "queued",
  actorId: "manager",
  approvedBy: "accountant",
  attempts: 1,
};
describe("ERPNext duplicate-safe REST draft connector", () => {
  it("recovers a POST that committed before its response was lost, without another creation", async () => {
    let posts = 0;
    let committed = false;
    const fakeFetch: typeof fetch = async (url, init) => {
      const path = String(url);
      if (path.includes("Custom%20Field"))
        return Response.json({
          data: [{ name: "event-field", unique: 1, fieldtype: "Data" }],
        });
      if (init?.method === "POST") {
        posts++;
        const body = JSON.parse(String(init.body));
        expect(body.docstatus).toBe(0);
        expect(body.update_stock).toBe(0);
        expect(body.custom_aquapulse_event_id).toBe("org:job-one");
        expect(body.customer).toBe("Customer");
        committed = true;
        throw new Error("Connection lost after commit");
      }
      if (path.includes("?"))
        return Response.json({ data: committed ? [{ name: "SINV-001" }] : [] });
      return Response.json({
        data: {
          name: "SINV-001",
          company: "ERP Company",
          custom_aquapulse_event_id: "org:job-one",
          docstatus: 0,
          customer: "Customer",
          currency: "INR",
          posting_date: job.postingDate,
          items: [{ item_code: "FISH", qty: 2, rate: 10 }],
        },
      });
    };
    const gateway = new FrappeFarmErpGateway(
      "https://erp.example",
      "key",
      "secret",
      fakeFetch,
    );
    expect(await gateway.ensureDraft(job, "ERP Company", "org")).toBe(
      "SINV-001",
    );
    expect(await gateway.ensureDraft(job, "ERP Company", "org")).toBe(
      "SINV-001",
    );
    expect(posts).toBe(1);
  });
  it("refuses provider writes without a unique event field", async () => {
    let writes = 0;
    const gateway = new FrappeFarmErpGateway(
      "https://erp.example",
      "key",
      "secret",
      async (_url, init) => {
        if (init?.method === "POST") writes++;
        return Response.json({ data: [{ unique: 0, fieldtype: "Data" }] });
      },
    );
    await expect(
      gateway.ensureDraft(job, "ERP Company", "org"),
    ).rejects.toThrow("unique");
    expect(writes).toBe(0);
  });
  it("rejects insecure external URLs and credential-bearing origins", () => {
    expect(
      () => new FrappeFarmErpGateway("http://erp.example", "key", "secret"),
    ).toThrow("HTTPS");
    expect(
      () =>
        new FrappeFarmErpGateway(
          "https://user:pass@erp.example",
          "key",
          "secret",
        ),
    ).toThrow("origin");
    expect(
      () =>
        new FrappeFarmErpGateway(
          "http://localhost:8080",
          "key",
          "secret",
          fetch,
          true,
        ),
    ).not.toThrow();
  });
});
