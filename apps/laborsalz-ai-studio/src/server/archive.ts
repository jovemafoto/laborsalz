import { createWriteStream } from "node:fs";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

import type { GenerationStatus } from "@/generation/platform";
import { SITE_URL } from "@/site";

import { writeStudioEvent } from "./events";
import { storagePath } from "./storage";

const CONTENT_EXTENSIONS: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "video/mp4": ".mp4",
};

export async function archiveGenerationStatus(
  status: GenerationStatus,
): Promise<GenerationStatus> {
  if (status.status !== "completed") return status;

  const requestId = safeSegment(status.requestId || crypto.randomUUID());
  const images = status.images
    ? await Promise.all(
        status.images.map(async (image, index) => ({
          url: await archiveRemoteAsset(requestId, image.url, "image", index),
        })),
      )
    : undefined;

  const video = status.video
    ? {
        url: await archiveRemoteAsset(requestId, status.video.url, "video", 0),
      }
    : undefined;

  return {
    ...status,
    ...(images?.length ? { images } : {}),
    ...(video ? { video } : {}),
  };
}

async function archiveRemoteAsset(
  requestId: string,
  sourceUrl: string,
  kind: "image" | "video",
  index: number,
): Promise<string> {
  if (sourceUrl.startsWith(`${SITE_URL}/api/v2/results/`)) return sourceUrl;

  try {
    const response = await fetch(sourceUrl, {
      signal: AbortSignal.timeout(120_000),
    });
    if (!response.ok || !response.body) {
      throw new Error(`asset fetch failed with ${response.status}`);
    }

    const extension =
      CONTENT_EXTENSIONS[response.headers.get("content-type")?.split(";")[0]?.trim() ?? ""] ??
      extensionFromUrl(sourceUrl, kind);
    const filename = `${String(index + 1).padStart(2, "0")}${extension}`;
    const relative = path.posix.join("results", requestId, filename);
    const target = storagePath(...relative.split("/"));
    await mkdir(path.dirname(target), { recursive: true });

    const body = Readable.fromWeb(response.body as never);
    await pipeline(body, createWriteStream(target));

    await writeStudioEvent("media.archived", {
      requestId,
      kind,
      localPath: relative,
    });

    const encoded = relative
      .split("/")
      .map((segment) => encodeURIComponent(segment))
      .join("/");
    return `${SITE_URL}/api/v2/results/${encoded}`;
  } catch (caught) {
    await writeStudioEvent("media.archive_failed", {
      requestId,
      kind,
      error: caught instanceof Error ? caught.message : String(caught),
    });
    return sourceUrl;
  }
}

function extensionFromUrl(sourceUrl: string, kind: "image" | "video"): string {
  try {
    const extension = path.extname(new URL(sourceUrl).pathname).toLowerCase();
    if (/^\.(jpg|jpeg|png|webp|gif|mp4)$/.test(extension)) {
      return extension === ".jpeg" ? ".jpg" : extension;
    }
  } catch {
    // Fall through to a safe media-type default.
  }
  return kind === "video" ? ".mp4" : ".jpg";
}

function safeSegment(value: string): string {
  return value.replace(/[^A-Za-z0-9._-]+/g, "_").slice(0, 180) || crypto.randomUUID();
}
