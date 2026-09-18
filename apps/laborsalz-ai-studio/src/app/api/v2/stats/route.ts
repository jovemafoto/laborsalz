import { NextResponse } from "next/server";

import { readRecentEvents } from "@/server/events";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const requestedDays = Number(url.searchParams.get("days") ?? "31");
  const days = Math.min(90, Math.max(1, Number.isFinite(requestedDays) ? requestedDays : 31));
  const events = await readRecentEvents(days);
  const byModel: Record<string, number> = {};
  const byType: Record<string, number> = {};

  for (const event of events) {
    byType[event.type] = (byType[event.type] ?? 0) + 1;
    const model = event.data.model;
    if (typeof model === "string") byModel[model] = (byModel[model] ?? 0) + 1;
  }

  return NextResponse.json({
    windowDays: days,
    totalEvents: events.length,
    generations: {
      submitted: byType["generation.submitted"] ?? 0,
      completed: byType["generation.completed"] ?? 0,
      failed: byType["generation.failed"] ?? 0,
    },
    uploads: byType["media.uploaded"] ?? 0,
    byModel,
    generatedAt: new Date().toISOString(),
  });
}
