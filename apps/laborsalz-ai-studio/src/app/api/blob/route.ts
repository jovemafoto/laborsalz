import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error: "Vercel Blob upload is disabled. Use /api/v2/upload.",
      replacement: "/api/v2/upload",
    },
    { status: 410 },
  );
}
