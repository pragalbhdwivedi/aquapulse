import { PageShell } from "../_components/page-shell";

export default function FeedPage() {
  return (
    <PageShell
      title="Feed"
      description="This route will support feed planning, logging, and consumption review."
      todo={[
        "Add schedule and actual-feed entry shells.",
        "Connect inventory and pond consumption context.",
      ]}
    />
  );
}
