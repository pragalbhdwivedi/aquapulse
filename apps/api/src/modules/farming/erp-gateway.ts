import type { FarmErpJob } from "@aquapulse/types";

export interface FarmErpGateway {
  ensureDraft(
    job: FarmErpJob,
    company: string,
    organization: string,
  ): Promise<string>;
}

/** Frappe REST v1. Only draft requests; statutory submission remains in ERPNext. */
export class FrappeFarmErpGateway implements FarmErpGateway {
  private readonly base: string;
  constructor(
    url: string,
    private readonly key: string,
    private readonly secret: string,
    private readonly fetchImpl: typeof fetch = fetch,
    allowLocalHttp = false,
  ) {
    const parsed = new URL(url);
    if (
      parsed.username ||
      parsed.password ||
      parsed.search ||
      parsed.hash ||
      (parsed.pathname !== "/" && parsed.pathname !== "")
    )
      throw new Error(
        "ERP URL must be an origin without credentials, path or query.",
      );
    if (
      parsed.protocol !== "https:" &&
      !(
        allowLocalHttp &&
        parsed.protocol === "http:" &&
        ["localhost", "127.0.0.1", "[::1]"].includes(parsed.hostname)
      )
    )
      throw new Error("ERP requires HTTPS.");
    if (!key || !secret || /[\r\n]/.test(key + secret))
      throw new Error("ERP API credentials are required.");
    this.base = parsed.origin;
  }
  private async request(path: string, body?: unknown) {
    const response = await this.fetchImpl(`${this.base}${path}`, {
      method: body ? "POST" : "GET",
      headers: {
        Authorization: `token ${this.key}:${this.secret}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
      redirect: "error",
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error("ERP request failed.");
    return response.json() as Promise<{ data: unknown }>;
  }
  private async find(
    kind: string,
    eventId: string,
  ): Promise<string | undefined> {
    const params = new URLSearchParams({
      filters: JSON.stringify([["custom_aquapulse_event_id", "=", eventId]]),
      fields: JSON.stringify(["name"]),
      limit_page_length: "2",
    });
    const result = await this.request(
      `/api/resource/${encodeURIComponent(kind)}?${params}`,
    );
    if (!Array.isArray(result.data) || result.data.length > 1)
      throw new Error("ERP receipt is ambiguous.");
    return result.data[0]?.name;
  }
  private async confirm(
    kind: string,
    name: string,
    company: string,
    eventId: string,
    job: FarmErpJob,
  ): Promise<string> {
    const response = await this.request(
      `/api/resource/${encodeURIComponent(kind)}/${encodeURIComponent(name)}`,
    );
    const doc = response.data as Record<string, unknown>;
    if (
      typeof name !== "string" ||
      !name ||
      doc?.name !== name ||
      doc.company !== company ||
      doc.custom_aquapulse_event_id !== eventId ||
      doc.docstatus !== 0
    )
      throw new Error("ERP document requires manual reconciliation.");
    const items = doc.items as Record<string, unknown>[] | undefined;
    if (
      doc[kind === "Sales Invoice" ? "customer" : "supplier"] !== job.party ||
      doc.currency !== "INR" ||
      doc.posting_date !== job.postingDate ||
      !Array.isArray(items) ||
      items.length !== job.lines.length ||
      items.some(
        (line, index) =>
          line.item_code !== job.lines[index].itemCode ||
          Number(line.qty) !== job.lines[index].quantity ||
          Number(line.rate) !== job.lines[index].rate ||
          (job.lines[index].warehouse &&
            line.warehouse !== job.lines[index].warehouse),
      )
    )
      throw new Error("ERP draft content differs from the approved request.");
    return name;
  }
  async ensureDraft(
    job: FarmErpJob,
    company: string,
    organization: string,
  ): Promise<string> {
    const eventId = `${organization}:${job.id}`;
    if (eventId.length > 140)
      throw new Error("ERP event identifier exceeds field capacity.");
    // Verify provider-enforced uniqueness before every send. Lookup alone is unsafe
    // after timeouts or overlapping workers on separate API processes.
    const query = new URLSearchParams({
      filters: JSON.stringify([
        ["dt", "=", job.kind],
        ["fieldname", "=", "custom_aquapulse_event_id"],
      ]),
      fields: JSON.stringify(["name", "unique", "fieldtype"]),
      limit_page_length: "2",
    });
    const metadata = await this.request(
      `/api/resource/Custom%20Field?${query}`,
    );
    if (
      !Array.isArray(metadata.data) ||
      metadata.data.length !== 1 ||
      ![1, true].includes(metadata.data[0]?.unique) ||
      metadata.data[0]?.fieldtype !== "Data"
    )
      throw new Error("ERP unique event field is missing.");
    const existing = await this.find(job.kind, eventId);
    if (existing)
      return this.confirm(job.kind, existing, company, eventId, job);
    let name: string | undefined;
    try {
      const result = await this.request(
        `/api/resource/${encodeURIComponent(job.kind)}`,
        {
          company,
          [job.kind === "Sales Invoice" ? "customer" : "supplier"]: job.party,
          posting_date: job.postingDate,
          currency: "INR",
          custom_aquapulse_event_id: eventId,
          items: job.lines.map((line) => ({
            item_code: line.itemCode,
            qty: line.quantity,
            rate: line.rate,
            ...(line.warehouse ? { warehouse: line.warehouse } : {}),
          })),
          docstatus: 0,
          update_stock: 0,
        },
      );
      name = (result.data as { name?: string })?.name;
    } catch {
      // POST may have committed even when its response is lost.
      name = await this.find(job.kind, eventId);
    }
    if (!name) throw new Error("ERP draft was not confirmed.");
    return this.confirm(job.kind, name, company, eventId, job);
  }
}

export function createFarmErpGateway(
  env: Record<string, string | undefined>,
): FarmErpGateway | undefined {
  if (
    env.AQUAPULSE_ERP_ENABLED !== "true" ||
    env.AQUAPULSE_FARM_DEMO === "true"
  )
    return undefined;
  return new FrappeFarmErpGateway(
    env.AQUAPULSE_ERP_URL || "",
    env.AQUAPULSE_ERP_API_KEY || "",
    env.AQUAPULSE_ERP_API_SECRET || "",
    fetch,
    env.NODE_ENV !== "production" &&
      env.AQUAPULSE_ERP_ALLOW_LOCAL_HTTP === "true",
  );
}
