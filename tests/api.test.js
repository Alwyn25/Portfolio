// API contract tests. Run: npm test   (node >= 20, no dependencies)
// Supabase is stubbed via global.fetch so these run offline and deterministically.
const test = require('node:test');
const assert = require('node:assert/strict');
const { Readable } = require('node:stream');

process.env.SUPABASE_URL = 'https://stub.supabase.co';
process.env.SUPABASE_ANON_KEY = 'anon-key';

const login = require('../api/auth/login');
const logout = require('../api/auth/logout');
const session = require('../api/auth/session');
const list = require('../api/content/index');
const save = require('../api/content/[key]');

/* ---------- harness ---------- */
function mkReq({ method = 'GET', url = '/', body, cookies = '', headers = {}, query } = {}) {
  const r = Readable.from(body === undefined ? [] : [Buffer.from(typeof body === 'string' ? body : JSON.stringify(body))]);
  r.method = method; r.url = url; r.query = query;
  r.headers = { host: 'alwyn-sebastian.vercel.app', cookie: cookies, ...headers };
  return r;
}
function mkRes() {
  const h = {};
  return {
    statusCode: 200, headers: h, body: '',
    setHeader(k, v) { h[k.toLowerCase()] = v; }, getHeader(k) { return h[k.toLowerCase()]; },
    end(b) { this.body = b || ''; },
    get json() { return JSON.parse(this.body); }
  };
}
const ADMIN = { 'x-requested-with': 'portfolio-admin', origin: 'https://alwyn-sebastian.vercel.app' };
const calls = [];
function stub(routes) {
  calls.length = 0;
  global.fetch = async (url, init = {}) => {
    const path = url.replace('https://stub.supabase.co', '');
    calls.push({ path, init });
    for (const [re, fn] of routes) if (re.test(path)) {
      const [status, json] = fn(init, path);
      return { ok: status < 400, status, text: async () => JSON.stringify(json) };
    }
    return { ok: false, status: 404, text: async () => '{}' };
  };
}
const session200 = { access_token: 'AT', refresh_token: 'RT', expires_in: 3600, user: { id: 'u1', email: 'a@b.co' } };

/* ---------- login ---------- */
test('login: valid admin -> 200, httpOnly Secure SameSite=Strict cookies', async () => {
  stub([[/grant_type=password/, () => [200, session200]], [/rest\/v1\/admins/, () => [200, [{ user_id: 'u1' }]]]]);
  const res = mkRes();
  await login(mkReq({ method: 'POST', body: { email: 'A@B.co', password: 'secret123' }, headers: ADMIN }), res);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.json.user, { id: 'u1', email: 'a@b.co' });
  const ck = res.getHeader('set-cookie');
  assert.equal(ck.length, 2);
  ck.forEach(c => { assert.match(c, /HttpOnly/); assert.match(c, /Secure/); assert.match(c, /SameSite=Strict/); });
  assert.match(ck[1], /Path=\/api/);
  assert.equal(JSON.parse(calls[0].init.body).email, 'a@b.co', 'email normalized');
});

test('login: wrong password -> 401, no cookies', async () => {
  stub([[/grant_type=password/, () => [400, { error: 'invalid_grant' }]]]);
  const res = mkRes();
  await login(mkReq({ method: 'POST', body: { email: 'a@b.co', password: 'wrongpass' }, headers: ADMIN }), res);
  assert.equal(res.statusCode, 401);
  assert.equal(res.getHeader('set-cookie'), undefined);
});

test('login: valid user who is not an admin -> 403 and session revoked', async () => {
  stub([[/grant_type=password/, () => [200, session200]], [/rest\/v1\/admins/, () => [200, []]], [/logout/, () => [204, {}]]]);
  const res = mkRes();
  await login(mkReq({ method: 'POST', body: { email: 'a@b.co', password: 'secret123' }, headers: ADMIN }), res);
  assert.equal(res.statusCode, 403);
  assert.ok(calls.some(c => /logout/.test(c.path)));
  assert.equal(res.getHeader('set-cookie'), undefined);
});

test('login: cross-origin request -> 403 before hitting Supabase', async () => {
  stub([]);
  const res = mkRes();
  await login(mkReq({ method: 'POST', body: { email: 'a@b.co', password: 'secret123' }, headers: { ...ADMIN, origin: 'https://evil.example' } }), res);
  assert.equal(res.statusCode, 403);
  assert.equal(calls.length, 0);
});

test('login: missing CSRF header -> 403', async () => {
  stub([]);
  const res = mkRes();
  await login(mkReq({ method: 'POST', body: { email: 'a@b.co', password: 'secret123' } }), res);
  assert.equal(res.statusCode, 403);
});

test('login: malformed JSON / bad fields -> 400; GET -> 405', async () => {
  stub([]);
  let res = mkRes(); await login(mkReq({ method: 'POST', body: '{nope', headers: ADMIN }), res); assert.equal(res.statusCode, 400);
  res = mkRes(); await login(mkReq({ method: 'POST', body: { email: 'x', password: '1' }, headers: ADMIN }), res); assert.equal(res.statusCode, 400);
  res = mkRes(); await login(mkReq({ method: 'GET' }), res); assert.equal(res.statusCode, 405);
});

/* ---------- session / logout ---------- */
test('session: expired access token is refreshed via refresh cookie', async () => {
  stub([[/auth\/v1\/user/, () => [401, {}]], [/grant_type=refresh_token/, () => [200, session200]], [/rest\/v1\/admins/, () => [200, [{ user_id: 'u1' }]]]]);
  const res = mkRes();
  await session(mkReq({ cookies: 'pf_at=old; pf_rt=RT' }), res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.getHeader('set-cookie').length, 2);
});

test('session: no cookies -> 401', async () => {
  stub([]);
  const res = mkRes(); await session(mkReq({}), res);
  assert.equal(res.statusCode, 401);
});

test('logout: clears both cookies', async () => {
  stub([[/logout/, () => [204, {}]]]);
  const res = mkRes(); await logout(mkReq({ method: 'POST', cookies: 'pf_at=AT', headers: ADMIN }), res);
  assert.equal(res.statusCode, 200);
  res.getHeader('set-cookie').forEach(c => assert.match(c, /Max-Age=0/));
});

/* ---------- content ---------- */
test('content GET: shapes rows by key and is CDN-cacheable; fresh=1 is no-store', async () => {
  stub([[/rest\/v1\/content/, () => [200, [{ key: 'site', data: { a: 1 }, version: 3, updated_at: 't' }]]]]);
  let res = mkRes(); await list(mkReq({ url: '/api/content' }), res);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.json.content.site, { data: { a: 1 }, version: 3, updated_at: 't' });
  assert.match(res.getHeader('cache-control'), /s-maxage=60/);
  res = mkRes(); await list(mkReq({ url: '/api/content?fresh=1', query: { fresh: '1' } }), res);
  assert.equal(res.getHeader('cache-control'), 'no-store');
});

test('content PUT: not signed in -> 401', async () => {
  stub([]);
  const res = mkRes(); await save(mkReq({ method: 'PUT', query: { key: 'site' }, body: { data: {}, version: 1 }, headers: ADMIN }), res);
  assert.equal(res.statusCode, 401);
});

test('content PUT: invalid key -> 400 (no DB call)', async () => {
  stub([]);
  const res = mkRes(); await save(mkReq({ method: 'PUT', query: { key: 'Bad Key!' }, body: { data: {} }, cookies: 'pf_at=AT', headers: ADMIN }), res);
  assert.equal(res.statusCode, 400);
  assert.equal(calls.length, 0);
});

test('content PUT: success passes user token + expected version to the RPC', async () => {
  stub([[/auth\/v1\/user/, () => [200, { id: 'u1' }]], [/rpc\/save_content/, () => [200, 4]]]);
  const res = mkRes(); await save(mkReq({ method: 'PUT', query: { key: 'site' }, body: { data: { x: 1 }, version: 3 }, cookies: 'pf_at=AT', headers: ADMIN }), res);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.json, { key: 'site', version: 4 });
  const rpc = calls.find(c => /rpc/.test(c.path));
  assert.equal(rpc.init.headers.authorization, 'Bearer AT');
  assert.deepEqual(JSON.parse(rpc.init.body), { p_key: 'site', p_data: { x: 1 }, p_expected_version: 3 });
});

test('content PUT: version conflict -> 409; DB denies -> 403', async () => {
  stub([[/auth\/v1\/user/, () => [200, { id: 'u1' }]], [/rpc\/save_content/, () => [400, { message: 'version_conflict' }]]]);
  let res = mkRes(); await save(mkReq({ method: 'PUT', query: { key: 'site' }, body: { data: {}, version: 1 }, cookies: 'pf_at=AT', headers: ADMIN }), res);
  assert.equal(res.statusCode, 409);
  stub([[/auth\/v1\/user/, () => [200, { id: 'u2' }]], [/rpc\/save_content/, () => [400, { message: 'not_authorized' }]]]);
  res = mkRes(); await save(mkReq({ method: 'PUT', query: { key: 'site' }, body: { data: {}, version: 1 }, cookies: 'pf_at=AT', headers: ADMIN }), res);
  assert.equal(res.statusCode, 403);
});

test('content PUT: cross-origin -> 403', async () => {
  stub([]);
  const res = mkRes(); await save(mkReq({ method: 'PUT', query: { key: 'site' }, body: { data: {} }, cookies: 'pf_at=AT', headers: { ...ADMIN, origin: 'https://evil.example' } }), res);
  assert.equal(res.statusCode, 403);
});

test('missing env config -> 500 with clear message', async () => {
  const u = process.env.SUPABASE_URL; delete process.env.SUPABASE_URL;
  const res = mkRes(); await list(mkReq({ url: '/api/content' }), res);
  process.env.SUPABASE_URL = u;
  assert.equal(res.statusCode, 500);
  assert.match(res.json.detail, /SUPABASE_URL/);
});
