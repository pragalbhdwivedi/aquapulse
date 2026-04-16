import Link from "next/link";
import { getPondsPageData } from "@web/queries";
import { PageShell } from "../_components/page-shell";

export default async function PondsPage() {
  const ponds = await getPondsPageData();

  return (
    <PageShell title="Ponds" description="Placeholder pond list using the repository and query layer.">
      <ul>
        {ponds.items.map((pond) => (
          <li key={pond.id}>
            <Link href={`/ponds/${pond.id}`}>{pond.name}</Link> - {pond.code}
          </li>
        ))}
      </ul>
    </PageShell>
  );
}
