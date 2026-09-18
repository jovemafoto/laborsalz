import { access, mkdir } from "node:fs/promises";
import { constants } from "node:fs";

import { NextResponse } from "next/server";

import { generationBaseUrl } from "@/server/gateway";
import { storagePath, storageRoot } from "@/server/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await mkdir(storageRoot(), { recursive: true });
    await access(storagePath(), constants.R_OK | constants.W_OK);
    return NextResponse.json({
      ok: true,
      service: "LaborSalz AI Studio",
      version: 2,
      storage: "ready",
      generationGateway: Boolean(process.env.LABORSALZ_AI_API_KEY?.trim())
        ? "configured"
        : "pending",
      generationApi: generationBaseUrl(),
      at: new Date().toISOString(),
    });
  } catch (caught) {
    return NextResponse.json(
      {
        ok: false,
        service: "LaborSalz AI Studio",
        error: caught instanceof Error ? caught.message : String(caught),
        at: new Date().toISOString(),
      },
      { status: 503 },
    );
  }
}
