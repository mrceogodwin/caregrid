import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const requiredTables = [
  "organizations",
  "facilities",
  "departments",
  "memberships",
  "patients",
  "patient_identifiers",
  "audit_events",
  "appointments",
  "encounters",
  "encounter_amendments",
  "observations",
  "facility_memberships",
  "membership_invitations",
] as const;

export async function GET() {
  if (!process.env.DATABASE_URL?.trim()) {
    return NextResponse.json(
      { status: "unavailable", dependency: "database" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const db = getDb();
    await db`select 1 as ok`;

    // Report only a generic readiness state; never expose schema names or DB errors.
    const [schema] = await db`
      SELECT count(*)::int AS ready_tables
      FROM (VALUES
        ('organizations'), ('facilities'), ('departments'), ('memberships'),
        ('patients'), ('patient_identifiers'), ('audit_events'),
        ('appointments'), ('encounters'), ('encounter_amendments'), ('observations'),
        ('facility_memberships'), ('membership_invitations')
      ) AS required(table_name)
      JOIN pg_class c ON c.relname = required.table_name
      JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = 'public'
      WHERE c.relkind = 'r'
        AND c.relrowsecurity = true
        AND c.relforcerowsecurity = true
    `;

    const schemaReady = Number(schema.ready_tables) === requiredTables.length;
    return NextResponse.json(
      {
        status: "ok",
        dependency: "database",
        schema: schemaReady ? "tables_ready" : "pending",
      },
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
