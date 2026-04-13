import Link from "next/link";

const sections = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/ponds", label: "Ponds" },
  { href: "/ponds/map", label: "Pond Map" },
  { href: "/batches", label: "Batches" },
  { href: "/feed", label: "Feed" },
  { href: "/inventory", label: "Inventory" },
  { href: "/treatments", label: "Treatments" },
  { href: "/mortality", label: "Mortality" },
  { href: "/expenses", label: "Expenses" },
  { href: "/alerts", label: "Alerts" },
  { href: "/approvals", label: "Approvals" },
  { href: "/reports", label: "Reports" },
  { href: "/timeline", label: "Timeline" },
  { href: "/audit", label: "Audit" },
  { href: "/settings", label: "Settings" },
  { href: "/admin", label: "Admin" },
];

export default function HomePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "2rem",
        background:
          "linear-gradient(135deg, rgba(8, 47, 73, 1), rgba(15, 23, 42, 1))",
        color: "#e2e8f0",
      }}
    >
      <section
        style={{
          width: "min(860px, 100%)",
          borderRadius: "24px",
          padding: "2rem",
          background: "rgba(15, 23, 42, 0.72)",
          boxShadow: "0 20px 60px rgba(2, 6, 23, 0.45)",
          border: "1px solid rgba(148, 163, 184, 0.18)",
        }}
      >
        <p style={{ margin: 0, fontSize: "0.9rem", letterSpacing: "0.08em" }}>
          AquaPulse / web
        </p>
        <h1 style={{ fontSize: "3rem", marginBottom: "1rem" }}>
          Protected route scaffold ready
        </h1>
        <p style={{ fontSize: "1.1rem", lineHeight: 1.7, marginBottom: "1.5rem" }}>
          Placeholder-only page shells are wired for the authenticated app
          surface. Real data, permissions, and final UI design still need to be
          implemented in later branches.
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "0.75rem",
          }}
        >
          {sections.map((section) => (
            <Link
              href={section.href}
              key={section.href}
              style={{
                display: "block",
                padding: "0.9rem 1rem",
                borderRadius: "16px",
                background: "#082f49",
                color: "#dbeafe",
                textDecoration: "none",
                fontWeight: 700,
              }}
            >
              {section.label}
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
