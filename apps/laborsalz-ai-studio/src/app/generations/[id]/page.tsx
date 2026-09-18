import Link from "next/link";
import { notFound } from "next/navigation";

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
  settings?: Record<string, unknown>;
  error?: string;
};

async function findGeneration(id: string): Promise<StoredRun | null> {
  const files = (await listDirectory(["history"])).filter((name) => name.endsWith(".json"));
  let found: StoredRun | null = null;

  for (const file of files) {
    const rows = await readJson<StoredRun[]>(["history", file], []);
    for (const row of rows) {
      if (row.id !== id && row.requestId !== id) continue;
      if (!found || (row.createdAt ?? 0) > (found.createdAt ?? 0)) found = row;
    }
  }

  return found;
}

export default async function GenerationDetailPage(
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const row = await findGeneration(decodeURIComponent(id));
  if (!row) notFound();

  return (
    <main style={{ minHeight: "100vh", background: "#0a0a0b", color: "#edefef", padding: 32, fontFamily: "system-ui, sans-serif" }}>
      <nav style={{ display: "flex", gap: 16, marginBottom: 32 }}>
        <Link href="/">Studio</Link>
        <Link href="/generations">Generation Bank</Link>
        <Link href="/stats">Stats</Link>
      </nav>

      <p style={{ color: "#a8aeaf", marginBottom: 8 }}>{row.surface ?? "generation"}</p>
      <h1 style={{ fontSize: 34, marginBottom: 8 }}>{row.modelLabel ?? row.modelId ?? "Generation"}</h1>
      <p style={{ color: "#a8aeaf", marginBottom: 28 }}>
        {row.createdAt ? new Date(row.createdAt).toLocaleString("pt-BR") : "Unknown date"} · {row.status ?? "unknown"}
      </p>

      <section style={{ maxWidth: 980, display: "grid", gap: 20 }}>
        <article style={{ background: "#151719", border: "1px solid rgba(255,255,255,.08)", borderRadius: 12, padding: 20 }}>
          <h2 style={{ fontSize: 18, marginBottom: 10 }}>Prompt</h2>
          <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{row.prompt || "—"}</p>
        </article>

        <article style={{ background: "#151719", border: "1px solid rgba(255,255,255,.08)", borderRadius: 12, padding: 20 }}>
          <h2 style={{ fontSize: 18, marginBottom: 10 }}>Parameters</h2>
          <pre style={{ overflowX: "auto", whiteSpace: "pre-wrap", color: "#d7dcdd" }}>
            {JSON.stringify(row.settings ?? {}, null, 2)}
          </pre>
        </article>

        {row.error && (
          <article style={{ background: "#151719", border: "1px solid rgba(255,255,255,.08)", borderRadius: 12, padding: 20 }}>
            <h2 style={{ fontSize: 18, marginBottom: 10 }}>Error</h2>
            <p>{row.error}</p>
          </article>
        )}

        {row.urls?.length ? (
          <article style={{ background: "#151719", border: "1px solid rgba(255,255,255,.08)", borderRadius: 12, padding: 20 }}>
            <h2 style={{ fontSize: 18, marginBottom: 14 }}>Outputs</h2>
            <div style={{ display: "grid", gap: 16 }}>
              {row.urls.map((url) =>
                row.surface === "video" ? (
                  <video key={url} src={url} controls style={{ width: "100%", maxHeight: "70vh", background: "#000" }} />
                ) : (
                  <img key={url} src={url} alt="" style={{ width: "100%", maxHeight: "75vh", objectFit: "contain", background: "#000" }} />
                ),
              )}
            </div>
          </article>
        ) : null}

        <article style={{ color: "#878e90", fontSize: 13 }}>
          Request: {row.requestId ?? "—"} · Record: {row.id ?? "—"}
        </article>
      </section>
    </main>
  );
}
