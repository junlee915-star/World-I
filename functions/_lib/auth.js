const SESSION_COOKIE = "wi_session";
const SESSION_DAYS = 30;
// Cloudflare Workers' PBKDF2 implementation rejects iteration counts above 100,000.
const PBKDF2_ITERATIONS = 100000;

function toHex(buf) {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
function fromHex(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  return bytes;
}

async function deriveBits(password, salt) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  return crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" }, key, 256);
}

export async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const bits = await deriveBits(password, salt);
  return { hash: toHex(bits), salt: toHex(salt) };
}

export async function verifyPassword(password, salt, hash) {
  const bits = await deriveBits(password, fromHex(salt));
  const candidate = toHex(bits);
  if (candidate.length !== hash.length) return false;
  let diff = 0;
  for (let i = 0; i < candidate.length; i++) diff |= candidate.charCodeAt(i) ^ hash.charCodeAt(i);
  return diff === 0;
}

export function isValidEmail(email) {
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

function newToken() {
  return toHex(crypto.getRandomValues(new Uint8Array(32)));
}

export async function createSession(sql, userId) {
  const token = newToken();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000).toISOString();
  await sql`insert into sessions (token, user_id, expires_at) values (${token}, ${userId}, ${expiresAt})`;
  return { token, expiresAt };
}

export function sessionCookieHeader(token, expiresAt) {
  const expires = new Date(expiresAt).toUTCString();
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Expires=${expires}`;
}

export function clearSessionCookieHeader() {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

function parseCookies(request) {
  const header = request.headers.get("Cookie") || "";
  const out = {};
  for (const part of header.split(";")) {
    const i = part.indexOf("=");
    if (i === -1) continue;
    out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

export function getSessionToken(request) {
  return parseCookies(request)[SESSION_COOKIE] || null;
}

export async function getUserFromRequest(request, sql) {
  const token = getSessionToken(request);
  if (!token) return null;
  const rows = await sql`
    select u.id, u.email
    from sessions s
    join users u on u.id = s.user_id
    where s.token = ${token} and s.expires_at > now()
  `;
  return rows[0] || null;
}

export async function deleteSession(sql, token) {
  if (!token) return;
  await sql`delete from sessions where token = ${token}`;
}

export function json(data, init = {}) {
  const headers = new Headers(init.headers || {});
  headers.set("Content-Type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(data), { ...init, headers });
}
