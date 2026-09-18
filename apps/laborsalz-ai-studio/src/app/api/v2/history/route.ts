import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  DEVICE_COOKIE,
  DEVICE_COOKIE_OPTIONS,
  resolveDeviceId,
} from "@/generation/device";
import { readJson, writeJsonAtomic } from "@/server/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type HistoryRow = Record<string, unknown>;

async function device() {
  const jar = await cookies();
  return resolveDeviceId(jar.get(DEVICE_COOKIE)?.value);
}

function withDevice(
  response: NextResponse,
  resolved: { deviceId: string; minted: boolean },
) {
  if (resolved.minted) {
    response.cookies.set(DEVICE_COOKIE, resolved.deviceId, DEVICE_COOKIE_OPTIONS);
  }
  return response;
}

export async function GET() {
  const resolved = await device();
  const rows = await readJson<HistoryRow[]>(
    ["history", `${resolved.deviceId}.json`],
    [],
  );
  return withDevice(NextResponse.json({ history: rows }), resolved);
}

export async function PUT(request: Request) {
  const resolved = await device();
  const body = (await request.json()) as { history?: unknown };
  if (!Array.isArray(body.history)) {
    return withDevice(
      NextResponse.json({ error: "history must be an array" }, { status: 400 }),
      resolved,
    );
  }
  const configured = Number(process.env.LABORSALZ_HISTORY_LIMIT ?? "1000");
  const limit = Number.isFinite(configured) ? Math.min(5000, Math.max(100, configured)) : 1000;
  const rows = body.history.slice(0, limit) as HistoryRow[];
  await writeJsonAtomic(["history", `${resolved.deviceId}.json`], rows);
  return withDevice(NextResponse.json({ ok: true, count: rows.length }), resolved);
}
