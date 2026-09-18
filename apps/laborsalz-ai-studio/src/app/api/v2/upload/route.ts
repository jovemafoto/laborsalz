import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  DEVICE_COOKIE,
  DEVICE_COOKIE_OPTIONS,
  resolveDeviceId,
  sanitizeFilename,
} from "@/generation/device";
import { writeStudioEvent } from "@/server/events";
import { createSignedMediaUrl } from "@/server/media-signing";
import { storagePath } from "@/server/storage";

export const runtime = "nodejs";

const ALLOWED = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "audio/wav",
  "audio/x-wav",
]);

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }
    if (!ALLOWED.has(file.type)) {
      return NextResponse.json({ error: `unsupported media type: ${file.type}` }, { status: 415 });
    }

    const configuredMb = Number(process.env.LABORSALZ_UPLOAD_MAX_MB ?? "150");
    const maxMb = Number.isFinite(configuredMb) ? Math.min(500, Math.max(1, configuredMb)) : 150;
    if (file.size > maxMb * 1024 * 1024) {
      return NextResponse.json({ error: `file exceeds ${maxMb} MB` }, { status: 413 });
    }

    const jar = await cookies();
    const resolved = resolveDeviceId(jar.get(DEVICE_COOKIE)?.value);
    const filename = `${crypto.randomUUID()}-${sanitizeFilename(file.name)}`;
    const relativePath = path.posix.join("uploads", resolved.deviceId, filename);
    const signedUrl = createSignedMediaUrl(relativePath);
    const fullPath = storagePath(...relativePath.split("/"));
    await mkdir(path.dirname(fullPath), { recursive: true });
    await writeFile(fullPath, Buffer.from(await file.arrayBuffer()));

    await writeStudioEvent("media.uploaded", {
      bytes: file.size,
      mimeType: file.type,
      deviceId: resolved.deviceId,
    });

    const response = NextResponse.json({
      url: signedUrl,
      path: relativePath,
      bytes: file.size,
      type: file.type,
    });
    if (resolved.minted) {
      response.cookies.set(DEVICE_COOKIE, resolved.deviceId, DEVICE_COOKIE_OPTIONS);
    }
    return response;
  } catch (caught) {
    return NextResponse.json(
      { error: caught instanceof Error ? caught.message : String(caught) },
      { status: 500 },
    );
  }
}
