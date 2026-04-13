import Link from "next/link";
import { apiClients } from "@web/clients";
import { PageShell } from "../_components/page-shell";

export default async function PondsPage() {
  const ponds = await apiClients.ponds.list();

  return (
    <PageShell title="Ponds" description="Placeholder pond list using the frontend API client layer.">
      <ul>
        {ponds.data.items.map((pond) => (
          <li key={pond.id}>
            <Link href={`/ponds/${pond.id}`}>{pond.name}</Link> - {pond.code}
          </li>
        ))}
      </ul>
    </PageShell>
  );
}
