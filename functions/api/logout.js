import { getDb } from "../_lib/db.js";
import { getSessionToken, deleteSession, clearSessionCookieHeader, json } from "../_lib/auth.js";

export async function onRequestPost({ request, env }) {
  const token = getSessionToken(request);
  if (token) {
    const sql = getDb(env);
    await deleteSession(sql, token);
  }
  return json({ ok: true }, { headers: { "Set-Cookie": clearSessionCookieHeader() } });
}
