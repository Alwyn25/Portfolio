// PUT /api/content/:key   (admin only)
//   body: { data: <any JSON>, version: <number | null> }   null = create a new section
//   -> 200 { key, version }  · 401 not signed in · 403 not admin / bad origin
//   -> 400 invalid key/body · 409 version conflict (someone else saved first) · 413 too large
// The database re-checks admin rights (RLS + definer RPC), so this layer is not the only gate.
const { sb, send, readJson, sameOrigin, getSession, allow, fail, KEY_RE } = require('../_lib/supabase');

module.exports = async function saveContent(req, res) {
  if (!allow(req, res, ['PUT'])) return;
  try {
    if (!sameOrigin(req)) return send(res, 403, { error: 'forbidden_origin' });
    const key = (req.query && req.query.key) || decodeURIComponent(String(req.url || '').split('?')[0].split('/').pop());
    if (!KEY_RE.test(key)) return send(res, 400, { error: 'invalid_key' });

    const s = await getSession(req);
    if (!s) return send(res, 401, { error: 'not_signed_in' });
    if (s.setCookies.length) res.setHeader('set-cookie', s.setCookies);

    let body;
    try { body = await readJson(req); } catch (e) { return send(res, e.status || 400, { error: e.status === 413 ? 'payload_too_large' : 'invalid_json' }); }
    if (!body || !('data' in body)) return send(res, 400, { error: 'missing_data' });
    const version = body.version === null || body.version === undefined ? null : Number(body.version);
    if (version !== null && !Number.isInteger(version)) return send(res, 400, { error: 'invalid_version' });

    const r = await sb('/rest/v1/rpc/save_content', {
      method: 'POST', token: s.token,
      body: { p_key: key, p_data: body.data, p_expected_version: version }
    });
    if (r.ok) return send(res, 200, { key, version: r.json }, { 'cache-control': 'no-store' });

    const msg = String((r.json && (r.json.message || r.json.hint)) || '');
    if (/version_conflict/.test(msg)) return send(res, 409, { error: 'version_conflict' });
    if (/not_authorized/.test(msg) || r.status === 401 || r.status === 403) return send(res, 403, { error: 'not_admin' });
    if (/invalid_key/.test(msg)) return send(res, 400, { error: 'invalid_key' });
    if (/payload_too_large/.test(msg)) return send(res, 413, { error: 'payload_too_large' });
    return send(res, 502, { error: 'upstream_error', detail: msg || r.status });
  } catch (e) { fail(res, e); }
};
