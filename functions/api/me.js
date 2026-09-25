import { getDb } from "../_lib/db.js";
import { getUserFromRequest, json } from "../_lib/auth.js";

export async function onRequestGet({ request, env }) {
  const sql = getDb(env);
  const user = await getUserFromRequest(request, sql);
  if (!user) return json({ user: null }, { status: 401 });
  return json({ user: { email: user.email } });
}
