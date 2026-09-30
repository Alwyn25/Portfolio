// Shared helpers for Vercel Node functions. Zero dependencies (Node 20+ global fetch).
// Files under api/_lib are not exposed as routes.

const COOKIE_AT = 'pf_at';   // Supabase access token (short-lived)
const COOKIE_RT = 'pf_rt';   // Supabase refresh token (scoped to /api)
const KEY_RE = /^[a-z][a-zA-Z0-9_-]{0,40}$/;
const MAX_BODY = 1024 * 1024; // 1 MB

function config() {
  const url = process.env.SUPABASE_URL, anon = process.env.SUPABASE_ANON_KEY;
  if (!url || !anon) {
    const e = new Error('Server is not configured: SUPABASE_URL / SUPABASE_ANON_KEY missing');
    e.status = 500; throw e;
  }
  return { url: url.replace(/\/+$/, ''), anon };
}

async function sb(path, { method = 'GET', token, body, headers = {} } = {}) {
  const { url, anon } = config();
  const r = await fetch(url + path, {
    method,
    headers: {
      apikey: anon,
      authorization: `Bearer ${token || anon}`,
      'content-type': 'application/json',
      accept: 'application/json',
      ...headers
    },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const text = await r.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { json = { raw: text }; }
  return { ok: r.ok, status: r.status, json };
}

function send(res, status, obj, extraHeaders = {}) {
  res.statusCode = status;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.setHeader('x-content-type-options', 'nosniff');
  for (const [k, v] of Object.entries(extraHeaders)) res.setHeader(k, v);
  res.end(JSON.stringify(obj));
}

function parseCookies(req) {
  if (req.cookies && typeof req.cookies === 'object') return req.cookies;
  const out = {};
  String(req.headers.cookie || '').split(';').forEach(p => {
    const i = p.indexOf('='); if (i < 0) return;
    out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim());
  });
  return out;
}

function cookie(name, value, { maxAge, path = '/' } = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`, `Path=${path}`, 'HttpOnly', 'Secure', 'SameSite=Strict'];
  if (maxAge !== undefined) parts.push(`Max-Age=${Math.max(0, Math.floor(maxAge))}`);
  return parts.join('; ');
}

function sessionCookies(session) {
  return [
    cookie(COOKIE_AT, session.access_token, { maxAge: session.expires_in || 3600, path: '/' }),
    cookie(COOKIE_RT, session.refresh_token, { maxAge: 60 * 60 * 24 * 30, path: '/api' })
  ];
}
const clearCookies = () => [cookie(COOKIE_AT, '', { maxAge: 0, path: '/' }), cookie(COOKIE_RT, '', { maxAge: 0, path: '/api' })];

async function readJson(req) {
  if (req.body !== undefined && req.body !== null && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) return req.body;
  if (typeof req.body === 'string') return JSON.parse(req.body || '{}');
  const chunks = []; let size = 0;
  for await (const c of req) {
    size += c.length;
    if (size > MAX_BODY) { const e = new Error('Payload too large'); e.status = 413; throw e; }
    chunks.push(c);
  }
  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : {};
}

/* CSRF defence for state-changing requests: SameSite=Strict cookies + same-origin check + custom header. */
function sameOrigin(req) {
  if (req.headers['x-requested-with'] !== 'portfolio-admin') return false;
  const origin = req.headers.origin;
  if (!origin) return true; // same-origin fetches may omit Origin on some browsers for same-site GET; writes still need the header
  try { return new URL(origin).host === req.headers.host; } catch { return false; }
}

/* Resolve the signed-in user from cookies; refreshes an expired access token. Returns { user, token, setCookies } or null. */
async function getSession(req) {
  const c = parseCookies(req);
  if (c[COOKIE_AT]) {
    const u = await sb('/auth/v1/user', { token: c[COOKIE_AT] });
    if (u.ok && u.json && u.json.id) return { user: u.json, token: c[COOKIE_AT], setCookies: [] };
  }
  if (c[COOKIE_RT]) {
    const r = await sb('/auth/v1/token?grant_type=refresh_token', { method: 'POST', body: { refresh_token: c[COOKIE_RT] } });
    if (r.ok && r.json && r.json.access_token) return { user: r.json.user, token: r.json.access_token, setCookies: sessionCookies(r.json) };
  }
  return null;
}

async function isAdmin(userId, token) {
  const r = await sb(`/rest/v1/admins?select=user_id&user_id=eq.${encodeURIComponent(userId)}`, { token });
  return r.ok && Array.isArray(r.json) && r.json.length === 1;
}

function allow(req, res, methods) {
  if (methods.includes(req.method)) return true;
  res.setHeader('allow', methods.join(', '));
  send(res, 405, { error: 'method_not_allowed' });
  return false;
}

function fail(res, e) {
  const status = e.status || 500;
  send(res, status, { error: status === 500 ? 'server_error' : e.message, detail: status === 500 ? String(e.message || e) : undefined });
}

module.exports = { sb, send, parseCookies, cookie, sessionCookies, clearCookies, readJson, sameOrigin, getSession, isAdmin, allow, fail, KEY_RE, COOKIE_AT, COOKIE_RT };
