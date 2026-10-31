import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!process.env.DATABASE_URL?.trim()) {
    return NextResponse.json(
      { status: "unavailable", dependency: "database" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    await getDb()`select 1 as ok`;
    return NextResponse.json(
      { status: "ok", dependency: "database" },
      { status: 200, headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    // Never return connection strings, provider errors or database details.
    return NextResponse.json(
      { status: "unavailable", dependency: "database" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
