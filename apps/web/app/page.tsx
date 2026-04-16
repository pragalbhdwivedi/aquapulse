import Link from "next/link";

export default function HomePage() {
  return (
    <main style={{ padding: "2rem" }}>
      <h1>AquaPulse</h1>
      <ul>
        <li><Link href="/dashboard">Dashboard</Link></li>
        <li><Link href="/ponds">Ponds</Link></li>
        <li><Link href="/alerts">Alerts</Link></li>
        <li><Link href="/reports">Reports</Link></li>
        <li><Link href="/audit">Audit</Link></li>
      </ul>
    </main>
  );
}
