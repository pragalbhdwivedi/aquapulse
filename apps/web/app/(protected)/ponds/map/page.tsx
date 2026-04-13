import { PageShell } from "../../_components/page-shell";

export default function PondMapPage() {
  return (
    <PageShell
      title="Pond Map"
      description="This page will visualize pond geography, layout, and map overlays."
      todo={[
        "Add map canvas and layer controls.",
        "Connect pond geometry and status overlays.",
      ]}
    />
  );
}
