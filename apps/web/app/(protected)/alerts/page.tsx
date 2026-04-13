import { alertsMockAdapter } from "@web/mocks/adapters";
import { PageShell } from "../_components/page-shell";

export default async function AlertsPage() {
  const alerts = await alertsMockAdapter.list();
  const explanation = await alertsMockAdapter.explain({
    alertId: alerts.data.items[0]?.id ?? "alert-placeholder",
    includeRecommendations: true,
  });

  return (
    <PageShell title="Alerts" description="Placeholder alerts inbox using typed mock contracts and AI explanation.">
      <ul style={{ display: "grid", gap: "0.75rem", padding: 0, listStyle: "none" }}>
        {alerts.data.items.map((alert) => (
          <li key={alert.id} style={{ border: "1px solid #1f2937", borderRadius: "16px", padding: "1rem" }}>
            <strong>{alert.title}</strong>
            <p style={{ color: "#94a3b8" }}>
              {alert.severity} · {alert.source} · {alert.status}
            </p>
          </li>
        ))}
      </ul>
      <div style={{ border: "1px solid #1f2937", borderRadius: "16px", padding: "1rem" }}>
        <strong>AI Explanation</strong>
        <p>{explanation.data.explanation}</p>
      </div>
    </PageShell>
  );
}
