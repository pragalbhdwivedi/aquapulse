import Link from "next/link";
import { readResolvedFrontendRuntimeDiagnostics } from "@web/features/auth-session-server";
import { getPondsPageData } from "@web/queries";
import { PageShell } from "../_components/page-shell";
import { PondCreateForm } from "./_components/pond-create-form";

export default async function PondsPage() {
  const diagnostics = await readResolvedFrontendRuntimeDiagnostics();
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
      <PondCreateForm
        session={diagnostics.session}
        initialFarmId={ponds.items[0]?.farmId}
        initialKind={ponds.items[0]?.kind}
      />
    </PageShell>
  );
}
