// GET /api/content  (public)
//   -> 200 { content: { <key>: { data, version, updated_at } } }
//   CDN-cached for 60s with stale-while-revalidate; ?fresh=1 bypasses the cache (used by the admin panel).
const { sb, send, allow, fail } = require('../_lib/supabase');

module.exports = async function listContent(req, res) {
  if (!allow(req, res, ['GET'])) return;
  try {
    const r = await sb('/rest/v1/content?select=key,data,version,updated_at');
    if (!r.ok) return send(res, 502, { error: 'upstream_error', status: r.status });
    const content = {};
    for (const row of r.json || []) content[row.key] = { data: row.data, version: row.version, updated_at: row.updated_at };
    const fresh = (req.query && req.query.fresh) || /[?&]fresh=1/.test(req.url || '');
    send(res, 200, { content }, {
      'cache-control': fresh ? 'no-store' : 'public, max-age=0, s-maxage=60, stale-while-revalidate=600'
    });
  } catch (e) { fail(res, e); }
};
