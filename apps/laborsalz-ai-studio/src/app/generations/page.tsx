import Link from "next/link";

import { listDirectory, readJson } from "@/server/storage";

export const dynamic = "force-dynamic";

type StoredRun = {
  id?: string;
  requestId?: string;
  modelId?: string;
  modelLabel?: string;
  surface?: string;
  prompt?: string;
  status?: string;
  createdAt?: number;
  urls?: string[];
};

export default async function GenerationsPage() {
  const files = (await listDirectory(["history"])).filter((name) => name.endsWith(".json"));
  const rows: StoredRun[] = [];
  for (const file of files) {
    rows.push(...(await readJson<StoredRun[]>(["history", file], [])));
  }

  const unique = new Map<string, StoredRun>();
  for (const row of rows) {
    const id = row.id ?? row.requestId;
    if (!id) continue;
    const previous = unique.get(id);
    if (!previous || (row.createdAt ?? 0) >= (previous.createdAt ?? 0)) unique.set(id, row);
  }
  const generations = [...unique.values()]
    .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))
    .slice(0, 500);

  return (
    <main style={{ minHeight: "100vh", background: "#0a0a0b", color: "#edefef", padding: 32, fontFamily: "system-ui, sans-serif" }}>
      <nav style={{ display: "flex", gap: 16, marginBottom: 32 }}>
        <Link href="/">Studio</Link>
        <Link href="/stats">Stats</Link>
      </nav>
      <h1 style={{ fontSize: 36, marginBottom: 8 }}>Generation Bank</h1>
      <p style={{ color: "#a8aeaf", marginBottom: 28 }}>
        Persistent server history across {files.length} device store{files.length === 1 ? "" : "s"}.
      </p>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
          <thead>
            <tr style={{ textAlign: "left", color: "#a8aeaf" }}>
              <th style={{ padding: "10px 8px" }}>Date</th>
              <th style={{ padding: "10px 8px" }}>Model</th>
              <th style={{ padding: "10px 8px" }}>Type</th>
              <th style={{ padding: "10px 8px" }}>Status</th>
              <th style={{ padding: "10px 8px" }}>Prompt</th>
              <th style={{ padding: "10px 8px" }}>Output</th>
            </tr>
          </thead>
          <tbody>
            {generations.map((row, index) => (
              <tr key={row.id ?? row.requestId ?? String(index)} style={{ borderTop: "1px solid rgba(255,255,255,.07)" }}>
                <td style={{ padding: "12px 8px", whiteSpace: "nowrap" }}>
                  {row.createdAt ? new Date(row.createdAt).toLocaleString("pt-BR") : "—"}
                </td>
                <td style={{ padding: "12px 8px" }}>
                  {row.id ?? row.requestId ? (
                    <Link href={`/generations/${encodeURIComponent(row.id ?? row.requestId ?? "")}`}>
                      {row.modelLabel ?? row.modelId ?? "Open generation"}
                    </Link>
                  ) : (
                    row.modelLabel ?? row.modelId ?? "—"
                  )}
                </td>
                <td style={{ padding: "12px 8px" }}>{row.surface ?? "—"}</td>
                <td style={{ padding: "12px 8px" }}>{row.status ?? "—"}</td>
                <td style={{ padding: "12px 8px", maxWidth: 560 }}>{row.prompt ?? "—"}</td>
                <td style={{ padding: "12px 8px" }}>
                  {row.urls?.[0] ? (
                    <a href={row.urls[0]} target="_blank" rel="noreferrer">Open</a>
                  ) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {generations.length === 0 && <p style={{ color: "#a8aeaf", marginTop: 24 }}>No generations persisted yet.</p>}
    </main>
  );
}
