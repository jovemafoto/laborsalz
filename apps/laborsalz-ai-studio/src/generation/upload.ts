export async function uploadMedia(file: File): Promise<{ url: string }> {
  const form = new FormData();
  form.set("file", file);
  const response = await fetch("/api/v2/upload", {
    method: "POST",
    body: form,
  });
  const payload = (await response.json()) as { url?: unknown; error?: unknown };
  if (!response.ok || typeof payload.url !== "string") {
    const reason = typeof payload.error === "string" ? payload.error : "upload failed";
    throw new Error(reason);
  }
  return { url: payload.url };
}
