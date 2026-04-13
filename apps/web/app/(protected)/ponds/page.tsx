import Link from "next/link";
import { pondsMockAdapter } from "@web/mocks/adapters";
import { PageShell } from "../_components/page-shell";

export default async function PondsPage() {
  const response = await pondsMockAdapter.list();

  return (
    <PageShell title="Ponds" description="Placeholder pond list powered by typed mock contracts.">
      <ul style={{ display: "grid", gap: "0.75rem", padding: 0, listStyle: "none" }}>
        {response.data.items.map((pond) => (
          <li key={pond.id} style={{ border: "1px solid #1f2937", borderRadius: "16px", padding: "1rem" }}>
            <Link href={`/ponds/${pond.id}`} style={{ color: "#e2e8f0" }}>
              {pond.name}
            </Link>
            <p style={{ color: "#94a3b8" }}>
              {pond.code} · {pond.kind} · {pond.status}
            </p>
          </li>
        ))}
      </ul>
    </PageShell>
  );
}
