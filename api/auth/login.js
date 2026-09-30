// POST /api/auth/login  { email, password }  ->  200 { user: { id, email } } + httpOnly session cookies
// 401 bad credentials · 403 valid user but not an admin · 400 malformed request
const { sb, send, readJson, sameOrigin, sessionCookies, isAdmin, allow, fail } = require('../_lib/supabase');

module.exports = async function login(req, res) {
  if (!allow(req, res, ['POST'])) return;
  try {
    if (!sameOrigin(req)) return send(res, 403, { error: 'forbidden_origin' });
    let body;
    try { body = await readJson(req); } catch (e) { return send(res, e.status || 400, { error: e.status === 413 ? 'payload_too_large' : 'invalid_json' }); }
    const { email, password } = body || {};
    if (typeof email !== 'string' || typeof password !== 'string' || !email.includes('@') || password.length < 6 || email.length > 254 || password.length > 256) {
      return send(res, 400, { error: 'invalid_request' });
    }
    const r = await sb('/auth/v1/token?grant_type=password', { method: 'POST', body: { email: email.trim().toLowerCase(), password } });
    if (!r.ok || !r.json || !r.json.access_token) {
      await new Promise(ok => setTimeout(ok, 400)); // blunt timing / brute-force signal; Supabase Auth also rate-limits
      return send(res, r.status === 429 ? 429 : 401, { error: r.status === 429 ? 'rate_limited' : 'invalid_credentials' });
    }
    const user = r.json.user || {};
    if (!(await isAdmin(user.id, r.json.access_token))) {
      await sb('/auth/v1/logout', { method: 'POST', token: r.json.access_token });
      return send(res, 403, { error: 'not_admin' });
    }
    res.setHeader('set-cookie', sessionCookies(r.json));
    send(res, 200, { user: { id: user.id, email: user.email } }, { 'cache-control': 'no-store' });
  } catch (e) { fail(res, e); }
};
