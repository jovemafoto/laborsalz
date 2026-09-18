import { appendFile, mkdir, readFile, readdir, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

const FALLBACK_ROOT = path.join(process.cwd(), ".laborsalz-data");

export function storageRoot(): string {
  return path.resolve(process.env.LABORSALZ_STORAGE_ROOT?.trim() || FALLBACK_ROOT);
}

export function storagePath(...segments: string[]): string {
  const root = storageRoot();
  const full = path.resolve(root, ...segments);
  if (full !== root && !full.startsWith(`${root}${path.sep}`)) {
    throw new Error("Storage path escaped the configured root");
  }
  return full;
}

export async function ensureStorage(): Promise<void> {
  await Promise.all(
    ["uploads", "history", "events"].map((directory) =>
      mkdir(storagePath(directory), { recursive: true }),
    ),
  );
}

export async function writeJsonAtomic(
  segments: string[],
  value: unknown,
): Promise<void> {
  const target = storagePath(...segments);
  await mkdir(path.dirname(target), { recursive: true });
  const temp = `${target}.${process.pid}.${randomUUID()}.tmp`;
  await writeFile(temp, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  await rename(temp, target);
}

export async function readJson<T>(
  segments: string[],
  fallback: T,
): Promise<T> {
  try {
    return JSON.parse(await readFile(storagePath(...segments), "utf8")) as T;
  } catch {
    return fallback;
  }
}

export async function appendNdjson(
  segments: string[],
  value: unknown,
): Promise<void> {
  const target = storagePath(...segments);
  await mkdir(path.dirname(target), { recursive: true });
  await appendFile(target, `${JSON.stringify(value)}\n`, "utf8");
}

export async function readText(segments: string[]): Promise<string> {
  return readFile(storagePath(...segments), "utf8");
}

export async function listDirectory(segments: string[]): Promise<string[]> {
  try {
    return await readdir(storagePath(...segments));
  } catch {
    return [];
  }
}
