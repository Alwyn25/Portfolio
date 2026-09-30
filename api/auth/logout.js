// POST /api/auth/logout -> 200 { ok: true }, clears cookies and revokes the Supabase session.
const { sb, send, parseCookies, clearCookies, sameOrigin, allow, fail, COOKIE_AT } = require('../_lib/supabase');

module.exports = async function logout(req, res) {
  if (!allow(req, res, ['POST'])) return;
  try {
    if (!sameOrigin(req)) return send(res, 403, { error: 'forbidden_origin' });
    const at = parseCookies(req)[COOKIE_AT];
    if (at) await sb('/auth/v1/logout', { method: 'POST', token: at }).catch(() => {});
    res.setHeader('set-cookie', clearCookies());
    send(res, 200, { ok: true }, { 'cache-control': 'no-store' });
  } catch (e) { fail(res, e); }
};
