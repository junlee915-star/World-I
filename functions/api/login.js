import { getDb } from "../_lib/db.js";
import { verifyPassword, isValidEmail, createSession, sessionCookieHeader, json } from "../_lib/auth.js";

export async function onRequestPost({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "잘못된 요청입니다." }, { status: 400 });
  }
  const email = (body.email || "").trim().toLowerCase();
  const password = body.password || "";

  if (!isValidEmail(email) || !password) {
    return json({ error: "이메일과 비밀번호를 입력해 주세요." }, { status: 400 });
  }

  const sql = getDb(env);
  const rows = await sql`select id, email, password_hash, password_salt from users where email = ${email}`;
  const user = rows[0];
  if (!user || !(await verifyPassword(password, user.password_salt, user.password_hash))) {
    return json({ error: "이메일 또는 비밀번호가 올바르지 않습니다." }, { status: 401 });
  }

  const { token, expiresAt } = await createSession(sql, user.id);
  return json(
    { user: { email: user.email } },
    { status: 200, headers: { "Set-Cookie": sessionCookieHeader(token, expiresAt) } }
  );
}
