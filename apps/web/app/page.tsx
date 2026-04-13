import { Button } from "@aquapulse/ui";

export default function HomePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "2rem",
        background:
          "linear-gradient(135deg, rgba(204, 242, 255, 1), rgba(236, 253, 245, 1))"
      }}
    >
      <section
        style={{
          width: "min(720px, 100%)",
          borderRadius: "24px",
          padding: "2rem",
          background: "rgba(255, 255, 255, 0.82)",
          boxShadow: "0 20px 60px rgba(15, 23, 42, 0.12)"
        }}
      >
        <p style={{ margin: 0, fontSize: "0.9rem", letterSpacing: "0.08em" }}>
          AquaPulse / web
        </p>
        <h1 style={{ fontSize: "3rem", marginBottom: "1rem" }}>
          Frontend scaffold ready
        </h1>
        <p style={{ fontSize: "1.1rem", lineHeight: 1.7, marginBottom: "1.5rem" }}>
          This Next.js app is intentionally thin. Shared packages, infra, and docs
          are wired so the next branch can focus on platform foundations.
        </p>
        <Button label="Build the platform foundation next" />
      </section>
    </main>
  );
}
