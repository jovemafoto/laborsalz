import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";

import { NextResponse } from "next/server";

import { verifySignedMediaRequest } from "@/server/media-signing";
import { storagePath } from "@/server/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".mp4": "video/mp4",
  ".wav": "audio/wav",
};

export async function GET(
  request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path: parts } = await context.params;
  const relativePath = parts.join("/");
  const url = new URL(request.url);

  try {
    if (
      !verifySignedMediaRequest(
        relativePath,
        url.searchParams.get("exp"),
        url.searchParams.get("sig"),
      )
    ) {
      return NextResponse.json({ error: "invalid or expired media signature" }, { status: 403 });
    }

    const fullPath = storagePath(...parts);
    const info = await stat(fullPath);
    if (!info.isFile()) return NextResponse.json({ error: "not found" }, { status: 404 });

    const stream = Readable.toWeb(createReadStream(fullPath)) as ReadableStream;
    return new Response(stream, {
      headers: {
        "content-type": CONTENT_TYPES[path.extname(fullPath).toLowerCase()] ?? "application/octet-stream",
        "content-length": String(info.size),
        "cache-control": "private, max-age=300",
        "x-content-type-options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
}
