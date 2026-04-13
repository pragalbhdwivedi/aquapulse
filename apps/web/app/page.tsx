import Link from "next/link";

const links = [
  "/dashboard",
  "/ponds",
  "/ponds/map",
  "/alerts",
  "/reports",
  "/audit",
];

export default function HomePage() {
  return (
    <main style={{ padding: "3rem" }}>
      <h1>AquaPulse Scaffold</h1>
      <p>Structural placeholder routes are available for the protected workspace.</p>
      <ul>
        {links.map((href) => (
          <li key={href}>
            <Link href={href}>{href}</Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
