function resolveOrigin(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/+$/, "");
  return "http://localhost:3000";
}

export const SITE_URL = resolveOrigin();

export const SITE_NAME =
  process.env.NEXT_PUBLIC_STUDIO_NAME?.trim() || "LaborSalz AI Studio";
export const SITE_DESCRIPTOR = "Internal image and video generation studio";
export const SITE_TITLE = `${SITE_NAME} — ${SITE_DESCRIPTOR}`;

export const SITE_DESCRIPTION =
  "LaborSalz internal studio for image and video generation, reusable presets, persistent history and production workflows.";

export const STUDIO_BG = "#0a0a0b";

export function openGraphFor({
  path,
  title = SITE_TITLE,
  description = SITE_DESCRIPTION,
}: {
  path: string;
  title?: string;
  description?: string;
}) {
  return {
    type: "website" as const,
    siteName: SITE_NAME,
    locale: "pt_BR",
    url: path,
    title,
    description,
  };
}

export function twitterFor({
  title = SITE_TITLE,
  description = SITE_DESCRIPTION,
}: { title?: string; description?: string } = {}) {
  return {
    card: "summary" as const,
    title,
    description,
  };
}
