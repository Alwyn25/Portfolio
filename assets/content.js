/* Content loader: defaults render instantly; live content from /api/content replaces them when it differs.
   Contract: window.Content.get() -> {site, systems, experience, skills, projects}
             window.Content.load() -> Promise<{content, changed}>  (never rejects) */
(function(){
  const clone = o => JSON.parse(JSON.stringify(o));
  const defaults = () => ({
    site: clone(window.DEFAULT_SITE.site),
    systems: clone(window.DEFAULT_SITE.systems),
    experience: clone(window.DEFAULT_SITE.experience),
    skills: clone(window.DEFAULT_SITE.skills),
    projects: clone(window.DEFAULT_PROJECTS || []),
    customSections: clone(window.DEFAULT_SITE.customSections || [])
  });
  let current = defaults();
  const KEYS = ['site', 'systems', 'experience', 'skills', 'projects', 'customSections'];

  async function load(timeoutMs = 3000){
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), timeoutMs);
    try {
      const r = await fetch('/api/content', { signal: ctl.signal, cache: 'no-cache', headers: { accept: 'application/json' } });
      if (!r.ok) throw new Error('status ' + r.status);
      const body = await r.json();
      const next = defaults();
      let changed = false;
      KEYS.forEach(k => {
        const row = body && body.content && body.content[k];
        if (row && row.data != null && JSON.stringify(row.data) !== JSON.stringify(next[k])) { next[k] = row.data; changed = true; }
      });
      current = next;
      return { content: current, changed };
    } catch (e) {
      return { content: current, changed: false, error: String(e) };   // offline / API down: keep defaults
    } finally { clearTimeout(t); }
  }

  /* Safe inline formatting: escape everything, then allow **bold** only. */
  const esc = s => String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const rich = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
  /* Only allow http(s), mailto, tel, root-relative and hash links. */
  const safeHref = h => { const s = String(h || '').trim(); return /^(https?:|mailto:|tel:|\/|#)/i.test(s) ? esc(s) : '#'; };

  window.Content = { get: () => current, load, esc, rich, safeHref };
})();
