// GET /api/auth/session -> 200 { user, admin: true } | 401 { error }
// Refreshes an expired access token transparently using the refresh cookie.
const { send, getSession, isAdmin, clearCookies, allow, fail } = require('../_lib/supabase');

module.exports = async function session(req, res) {
  if (!allow(req, res, ['GET'])) return;
  try {
    const s = await getSession(req);
    if (!s) { res.setHeader('set-cookie', clearCookies()); return send(res, 401, { error: 'not_signed_in' }, { 'cache-control': 'no-store' }); }
    if (!(await isAdmin(s.user.id, s.token))) { res.setHeader('set-cookie', clearCookies()); return send(res, 403, { error: 'not_admin' }, { 'cache-control': 'no-store' }); }
    if (s.setCookies.length) res.setHeader('set-cookie', s.setCookies);
    send(res, 200, { user: { id: s.user.id, email: s.user.email }, admin: true }, { 'cache-control': 'no-store' });
  } catch (e) { fail(res, e); }
};
