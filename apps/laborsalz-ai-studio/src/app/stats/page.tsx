import Link from "next/link";

import { readRecentEvents } from "@/server/events";

export const dynamic = "force-dynamic";

export default async function StatsPage() {
  const events = await readRecentEvents(31);
  const submitted = events.filter((event) => event.type === "generation.submitted").length;
  const completed = events.filter((event) => event.type === "generation.completed").length;
  const failed = events.filter((event) => event.type === "generation.failed").length;
  const uploads = events.filter((event) => event.type === "media.uploaded").length;

  const models = new Map<string, number>();
  for (const event of events) {
    const model = event.data.model;
    if (typeof model === "string") models.set(model, (models.get(model) ?? 0) + 1);
  }
  const topModels = [...models.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12);

  return (
    <main style={{ minHeight: "100vh", background: "#0a0a0b", color: "#edefef", padding: 32, fontFamily: "system-ui, sans-serif" }}>
      <nav style={{ display: "flex", gap: 16, marginBottom: 32 }}>
        <Link href="/">Studio</Link>
        <Link href="/generations">Generations</Link>
      </nav>
      <h1 style={{ fontSize: 36, marginBottom: 8 }}>LaborSalz AI Studio — Stats</h1>
      <p style={{ color: "#a8aeaf", marginBottom: 28 }}>Local telemetry from the last 31 event-log days.</p>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 32 }}>
        {[
          ["Submitted", submitted],
          ["Completed", completed],
          ["Failed", failed],
          ["Uploads", uploads],
          ["Events", events.length],
        ].map(([label, value]) => (
          <article key={String(label)} style={{ background: "#151719", border: "1px solid rgba(255,255,255,.08)", borderRadius: 12, padding: 18 }}>
            <div style={{ color: "#a8aeaf", fontSize: 13 }}>{label}</div>
            <strong style={{ display: "block", fontSize: 30, marginTop: 6 }}>{value}</strong>
          </article>
        ))}
      </section>

      <h2 style={{ fontSize: 22, marginBottom: 12 }}>Model activity</h2>
      {topModels.length === 0 ? (
        <p style={{ color: "#a8aeaf" }}>No model activity recorded yet.</p>
      ) : (
        <div style={{ maxWidth: 760 }}>
          {topModels.map(([model, count]) => (
            <div key={model} style={{ display: "flex", justifyContent: "space-between", gap: 24, borderBottom: "1px solid rgba(255,255,255,.06)", padding: "10px 0" }}>
              <span>{model}</span>
              <strong>{count}</strong>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
