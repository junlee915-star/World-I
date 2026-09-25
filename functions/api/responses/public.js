import { getDb } from "../../_lib/db.js";
import { json } from "../../_lib/auth.js";

export async function onRequestGet({ env }) {
  const sql = getDb(env);
  const rows = await sql`
    select book_id, question_index, answer_text, created_at
    from responses
    where is_public = true
    order by created_at desc
    limit 200
  `;
  return json({ entries: rows });
}
