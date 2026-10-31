import "server-only";
import { createNeonAuth } from "@neondatabase/auth/next/server";

const baseUrl = process.env.NEON_AUTH_BASE_URL;
const cookieSecret = process.env.NEON_AUTH_COOKIE_SECRET;

if (!baseUrl || !cookieSecret || cookieSecret.length < 32) {
  throw new Error("Neon Auth is not configured correctly.");
}

export const auth = createNeonAuth({
  baseUrl,
  cookies: { secret: cookieSecret, sessionDataTtl: 300 },
});
