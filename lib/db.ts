import "server-only";
import postgres from "postgres";

type CaregridGlobal = typeof globalThis & {
  caregridSql?: ReturnType<typeof postgres>;
};

const globalForCaregrid = globalThis as CaregridGlobal;

export function getDb() {
  const connectionString = process.env.DATABASE_URL?.trim();

  if (!connectionString) {
    throw new Error("DATABASE_URL is not configured");
  }

  if (!globalForCaregrid.caregridSql) {
    globalForCaregrid.caregridSql = postgres(connectionString, {
      max: 1,
      idle_timeout: 20,
      connect_timeout: 10,
      prepare: false,
      onnotice: () => undefined,
    });
  }

  return globalForCaregrid.caregridSql;
}
