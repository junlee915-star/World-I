import { getDb } from "../_lib/db.js";
import { hashPassword, isValidEmail, createSession, sessionCookieHeader, json } from "../_lib/auth.js";

export async function onRequestPost({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "잘못된 요청입니다." }, { status: 400 });
  }
  const email = (body.email || "").trim().toLowerCase();
  const password = body.password || "";
  const newsletter = !!body.newsletter;

  if (!isValidEmail(email)) return json({ error: "올바른 이메일 주소를 입력해 주세요." }, { status: 400 });
  if (password.length < 8) return json({ error: "비밀번호는 8자 이상이어야 합니다." }, { status: 400 });

  const sql = getDb(env);

  const existing = await sql`select id from users where email = ${email}`;
  if (existing.length) return json({ error: "이미 가입된 이메일이에요. 로그인해 주세요." }, { status: 409 });

  const { hash, salt } = await hashPassword(password);
  const rows = await sql`
    insert into users (email, password_hash, password_salt, newsletter)
    values (${email}, ${hash}, ${salt}, ${newsletter})
    returning id, email
  `;
  const user = rows[0];
  const { token, expiresAt } = await createSession(sql, user.id);

  return json(
    { user: { email: user.email } },
    { status: 201, headers: { "Set-Cookie": sessionCookieHeader(token, expiresAt) } }
  );
}
