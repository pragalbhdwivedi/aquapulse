import Link from "next/link";
import { readResolvedFrontendRuntimeDiagnostics } from "@web/features/auth-session-server";
import { getPondsPageData } from "@web/queries";
import { PageShell } from "../_components/page-shell";
import { PondCreateForm } from "./_components/pond-create-form";

export default async function PondsPage() {
  const diagnostics = await readResolvedFrontendRuntimeDiagnostics();
  const ponds = await getPondsPageData();

  return (
    <PageShell
      title="Ponds"
      description="Pond list for operator walkthroughs, with bounded detail reads and a safe create flow that remains auth-aware without forcing full SSO locally."
    >
      <p>
        Active pond list: {ponds.items.length} item(s). Open a pond to review water-quality context, manual follow-up, and AI-assisted summaries.
      </p>
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
