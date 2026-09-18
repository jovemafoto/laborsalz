import { appendNdjson, listDirectory, readText } from "./storage";

export type StudioEvent = {
  id: string;
  type: string;
  at: string;
  data: Record<string, unknown>;
};

function dayOf(iso: string): string {
  return iso.slice(0, 10);
}

export async function writeStudioEvent(
  type: string,
  data: Record<string, unknown> = {},
): Promise<StudioEvent> {
  const event: StudioEvent = {
    id: crypto.randomUUID(),
    type,
    at: new Date().toISOString(),
    data,
  };
  await appendNdjson(["events", `${dayOf(event.at)}.ndjson`], event);
  void deliverWebhook(event);
  return event;
}

async function deliverWebhook(event: StudioEvent): Promise<void> {
  const url = process.env.N8N_EVENT_WEBHOOK_URL?.trim();
  if (!url) return;
  try {
    await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(event),
      signal: AbortSignal.timeout(3000),
    });
  } catch {
    // Local persistence is authoritative; the webhook is best-effort.
  }
}

export async function readRecentEvents(maxDays = 31): Promise<StudioEvent[]> {
  const names = (await listDirectory(["events"]))
    .filter((name) => /^\d{4}-\d{2}-\d{2}\.ndjson$/.test(name))
    .sort()
    .reverse()
    .slice(0, maxDays);

  const events: StudioEvent[] = [];
  for (const name of names) {
    let raw = "";
    try {
      raw = await readText(["events", name]);
    } catch {
      continue;
    }
    for (const line of raw.split("\n")) {
      if (!line.trim()) continue;
      try {
        const parsed = JSON.parse(line) as StudioEvent;
        if (
          parsed &&
          typeof parsed.id === "string" &&
          typeof parsed.type === "string" &&
          typeof parsed.at === "string" &&
          parsed.data &&
          typeof parsed.data === "object"
        ) {
          events.push(parsed);
        }
      } catch {
        // Ignore a malformed line instead of losing the rest of the event log.
      }
    }
  }
  return events.sort((a, b) => b.at.localeCompare(a.at));
}
