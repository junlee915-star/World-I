import { getDb } from "../_lib/db.js";
import { getUserFromRequest, json } from "../_lib/auth.js";

export async function onRequestGet({ request, env }) {
  const sql = getDb(env);
  const user = await getUserFromRequest(request, sql);
  if (!user) return json({ error: "로그인이 필요합니다." }, { status: 401 });

  const rows = await sql`
    select id, book_id, question_index, answer_text, is_public, created_at
    from responses
    where user_id = ${user.id}
    order by created_at desc
  `;
  return json({ entries: rows });
}

export async function onRequestPost({ request, env }) {
  const sql = getDb(env);
  const user = await getUserFromRequest(request, sql);
  if (!user) return json({ error: "로그인이 필요합니다." }, { status: 401 });

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const bookId = String(body.book_id || "").slice(0, 100);
  const questionIndex = Number.isInteger(body.question_index) ? body.question_index : -1;
  const answerText = String(body.answer_text || "").trim();
  const isPublic = !!body.is_public;

  if (!bookId || questionIndex < 0) return json({ error: "잘못된 요청입니다." }, { status: 400 });
  if (!answerText) return json({ error: "답을 한 줄 이상 적어 주세요." }, { status: 400 });
  if (answerText.length > 4000) return json({ error: "답이 너무 길어요." }, { status: 400 });

  const rows = await sql`
    insert into responses (user_id, book_id, question_index, answer_text, is_public)
    values (${user.id}, ${bookId}, ${questionIndex}, ${answerText}, ${isPublic})
    returning id, book_id, question_index, answer_text, is_public, created_at
  `;
  return json({ entry: rows[0] }, { status: 201 });
}
