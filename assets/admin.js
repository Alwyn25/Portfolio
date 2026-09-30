/* Admin panel: session-gated, schema-less content editor.
   Every section is plain JSON; the editor builds controls from the data's shape, so new fields,
   list items and whole sections can be added without code changes.
   All user data goes into the DOM via textContent / .value (never innerHTML). */
(function(){
const app = document.getElementById('app');
const HDR = { 'content-type': 'application/json', 'x-requested-with': 'portfolio-admin' };
const LABELS = { site: 'Site, hero & about', systems: 'Flagship systems', experience: 'Experience', projects: 'Projects & case studies', skills: 'Stack', customSections: 'Custom sections' };
const HINTS = {
  site: 'Hero text, typed roles, stats, about, photos, writing, contact and footer. Text supports **bold**.',
  systems: 'Cards in the "Flagship systems" section. <slug> links to /projects/<slug>, so it must match a project slug.',
  experience: 'Timeline entries. "bullets" show by default; "more" appears behind "show more". Leave "when" empty to hide dates.',
  projects: 'Case-study pages at /projects/<slug>. Set showInGrid + card to list one in the Projects grid. scene: forensic | call | insights | plate | forecast | arch.',
  skills: 'Filter groups for the Stack section. Each group: id, label, items[].',
  customSections: 'Add sections here and they render on the homepage automatically (before Contact). layout: "cards" or "list".'
};
const DEFAULTS = {
  site: window.DEFAULT_SITE.site, systems: window.DEFAULT_SITE.systems, experience: window.DEFAULT_SITE.experience,
  skills: window.DEFAULT_SITE.skills, customSections: window.DEFAULT_SITE.customSections || [], projects: window.DEFAULT_PROJECTS
};
const clone = o => JSON.parse(JSON.stringify(o));

/* ---------- tiny DOM helper ---------- */
function h(tag, attrs, ...kids){
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === undefined || v === null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'value') el.value = v;
    else if (k === 'checked') el.checked = !!v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  kids.flat().forEach(c => { if (c !== null && c !== undefined && c !== false) el.append(c.nodeType ? c : document.createTextNode(String(c))); });
  return el;
}
let toastT;
function toast(msg, kind){
  const t = document.getElementById('toast');
  t.textContent = msg; t.className = 'show ' + (kind || '');
  clearTimeout(toastT); toastT = setTimeout(() => t.className = '', 3200);
}
async function api(path, opts = {}){
  const r = await fetch(path, { credentials: 'same-origin', cache: 'no-store', ...opts, headers: { ...HDR, ...(opts.headers || {}) } });
  let body = null; try { body = await r.json(); } catch {}
  return { status: r.status, ok: r.ok, body };
}

/* ---------- state ---------- */
const S = { user: null, sections: {}, active: 'site', raw: false };
// sections[key] = { data, version (null = not in DB yet), saved: JSON string }

/* ================= LOGIN ================= */
function renderLogin(msg){
  const email = h('input', { class: 'in', type: 'email', autocomplete: 'username', required: true, id: 'em' });
  const pw = h('input', { class: 'in', type: 'password', autocomplete: 'current-password', required: true, id: 'pw' });
  const err = h('div', { class: 'err' }, msg || '');
  const btn = h('button', { class: 'btn primary', type: 'submit' }, 'Sign in');
  const form = h('form', { onsubmit: async e => {
      e.preventDefault(); err.textContent = ''; btn.disabled = true; btn.textContent = 'Signing in…';
      const r = await api('/api/auth/login', { method: 'POST', body: JSON.stringify({ email: email.value, password: pw.value }) }).catch(() => ({ status: 0 }));
      btn.disabled = false; btn.textContent = 'Sign in';
      if (r.ok) { S.user = r.body.user; pw.value = ''; return boot(); }
      err.textContent = ({ 401: 'Wrong email or password.', 403: r.body && r.body.error === 'not_admin' ? 'This account is not an admin.' : 'Request blocked.', 429: 'Too many attempts. Wait a minute.', 0: 'Network error.' })[r.status] || 'Sign-in failed (' + r.status + ').';
    } },
    h('div', { class: 'brand' }, h('img', { src: '/assets/img/avatar.webp', alt: '' }), h('div', {}, h('h1', {}, 'Admin'), h('p', { class: 'sub' }, 'portfolio content editor'))),
    h('label', { class: 'f', for: 'em' }, 'Email'), email,
    h('label', { class: 'f', for: 'pw' }, 'Password'), pw,
    btn, err);
  app.replaceChildren(h('div', { class: 'login' }, form));
  email.focus();
}

/* ================= DATA ================= */
async function loadSections(){
  const r = await api('/api/content?fresh=1', { headers: { accept: 'application/json' } });
  if (!r.ok) throw new Error('Could not load content (' + r.status + ')');
  const live = (r.body && r.body.content) || {};
  const keys = [...new Set([...Object.keys(DEFAULTS), ...Object.keys(live)])];
  S.sections = {};
  keys.forEach(k => {
    const row = live[k];
    const data = row ? row.data : clone(DEFAULTS[k] !== undefined ? DEFAULTS[k] : {});
    S.sections[k] = { data, version: row ? row.version : null, updated_at: row ? row.updated_at : null, saved: row ? JSON.stringify(row.data) : null };
  });
  if (!S.sections[S.active]) S.active = keys[0];
}
const dirty = k => { const s = S.sections[k]; return JSON.stringify(s.data) !== s.saved; };

async function save(){
  const k = S.active, s = S.sections[k];
  if (S.raw && !applyRaw()) return;
  const btn = document.getElementById('saveBtn'); if (btn) { btn.disabled = true; btn.textContent = 'Saving…'; }
  const r = await api('/api/content/' + encodeURIComponent(k), { method: 'PUT', body: JSON.stringify({ data: s.data, version: s.version }) }).catch(() => ({ status: 0 }));
  if (r.ok) {
    s.version = r.body.version; s.saved = JSON.stringify(s.data); s.updated_at = new Date().toISOString();
    toast(`Saved "${LABELS[k] || k}" (v${s.version}). Live within a minute.`, 'ok');
  } else if (r.status === 409) {
    toast('Someone saved a newer version. Reload to get it, then re-apply your change.', 'bad');
  } else if (r.status === 401) {
    toast('Session expired. Sign in again (your edits are kept in this tab).', 'bad'); return renderLogin('Session expired.');
  } else {
    toast('Save failed: ' + ((r.body && r.body.error) || r.status), 'bad');
  }
  renderShell();
}

/* ================= EDITOR (schema-less) ================= */
const TITLE_KEYS = ['title', 'label', 'name', 'role', 'slug', 'h', 'id', 'k', 'heading', 'text'];
function preview(v){
  if (Array.isArray(v)) return v.length + ' item' + (v.length === 1 ? '' : 's');
  if (v && typeof v === 'object') { for (const t of TITLE_KEYS) if (typeof v[t] === 'string' && v[t]) return v[t]; return Object.keys(v).length + ' fields'; }
  return String(v);
}
const typeOf = v => v === null ? 'null' : Array.isArray(v) ? 'list' : typeof v === 'object' ? 'group' : typeof v === 'number' ? 'number' : typeof v === 'boolean' ? 'yes/no' : 'text';
function blankLike(v){
  if (Array.isArray(v)) return [];
  if (v && typeof v === 'object') { const o = {}; for (const [k, x] of Object.entries(v)) o[k] = blankLike(x); return o; }
  if (typeof v === 'number') return 0;
  if (typeof v === 'boolean') return false;
  return '';
}
const NEW_BY_TYPE = { text: '', 'long text': '', number: 0, 'yes/no': false, list: [], group: {} };
const LONG = new Set(['text', 'body', 'lede', 'desc', 'description', 'problem', 'bio', 'summary', 'payload', 'detects', 'fail', 'subtitle']);
const longPaths = new WeakMap(); // container -> Set(keys) created as "long text" this session

/* Renders an editor for `container[key]`. Mutations write straight into the data and mark dirty. */
function field(container, key, depth, onStructure){
  const v = container[key];
  const touch = () => markDirty();
  if (v === null) return h('span', { class: 'empty' }, 'empty (null)');
  if (typeof v === 'boolean') return h('label', { class: 'chk' }, h('input', { type: 'checkbox', checked: v, onchange: e => { container[key] = e.target.checked; touch(); } }), v ? 'yes' : 'no');
  if (typeof v === 'number') return h('input', { class: 'in', type: 'number', step: 'any', value: v, oninput: e => { const n = parseFloat(e.target.value); container[key] = isNaN(n) ? 0 : n; touch(); } });
  if (typeof v === 'string') {
    const long = v.length > 70 || v.includes('\n') || LONG.has(key) || longPaths.has(container) && longPaths.get(container).has(key);
    const el = long
      ? h('textarea', { class: 'in', rows: Math.min(8, Math.max(3, Math.ceil(v.length / 90))), value: v, oninput: e => { container[key] = e.target.value; touch(); } })
      : h('input', { class: 'in', type: 'text', value: v, oninput: e => { container[key] = e.target.value; touch(); if (img) img.src = e.target.value; } });
    let img = null;
    if (/\.(webp|png|jpe?g|gif|svg)$/i.test(v) || (key === 'src')) {
      img = h('img', { src: v, alt: '' });
      return h('div', {}, el, h('div', { class: 'img-prev' }, img, h('span', {}, 'preview · use a /assets/img/… path or an https:// URL')));
    }
    return el;
  }
  return node(v, depth + 1, onStructure);
}

function node(v, depth, onStructure){
  const body = h('div', { class: 'body' });
  const redraw = () => { body.replaceChildren(...inner()); if (onStructure) onStructure(); };
  function inner(){
    if (Array.isArray(v)) {
      const rows = v.map((_, i) => h('div', { class: 'item' },
        h('div', { class: 'idx' }, String(i + 1)),
        h('div', {}, isComplex(v[i]) ? collapsible(v, i, depth, redraw) : field(v, i, depth, redraw)),
        h('div', { class: 'acts' },
          h('button', { class: 'ib', type: 'button', title: 'Move up', disabled: i === 0, onclick: () => { [v[i - 1], v[i]] = [v[i], v[i - 1]]; markDirty(); redraw(); } }, '↑'),
          h('button', { class: 'ib', type: 'button', title: 'Move down', disabled: i === v.length - 1, onclick: () => { [v[i + 1], v[i]] = [v[i], v[i + 1]]; markDirty(); redraw(); } }, '↓'),
          h('button', { class: 'ib', type: 'button', title: 'Duplicate', onclick: () => { v.splice(i + 1, 0, clone(v[i])); markDirty(); redraw(); } }, '⧉'),
          h('button', { class: 'ib del', type: 'button', title: 'Remove', onclick: () => { if (isComplex(v[i]) && !confirm('Remove this item?')) return; v.splice(i, 1); markDirty(); redraw(); } }, '×'))));
      const typeSel = h('select', { class: 'in' }, ...Object.keys(NEW_BY_TYPE).map(t => h('option', { value: t }, t)));
      const addBtn = h('button', { class: 'btn sm', type: 'button', onclick: () => {
        v.push(v.length ? blankLike(v[v.length - 1]) : clone(NEW_BY_TYPE[typeSel.value])); markDirty(); redraw();
      } }, '+ add item');
      return [...(rows.length ? rows : [h('div', { class: 'empty' }, 'No items yet.')]), h('div', { class: 'add' }, addBtn, v.length ? null : typeSel, v.length ? h('span', { class: 'empty' }, 'new items copy the shape of the last one') : null)];
    }
    const rows = Object.keys(v).map(k => h('div', { class: 'row' },
      h('div', { class: 'k' }, k),
      h('div', {}, isComplex(v[k]) ? collapsible(v, k, depth, redraw) : field(v, k, depth, redraw)),
      h('div', { class: 'acts' }, h('button', { class: 'ib del', type: 'button', title: 'Remove field', onclick: () => { if (!confirm(`Remove field "${k}"?`)) return; delete v[k]; markDirty(); redraw(); } }, '×'))));
    const name = h('input', { class: 'in', placeholder: 'new field name', maxlength: 40 });
    const typeSel = h('select', { class: 'in' }, ...Object.keys(NEW_BY_TYPE).map(t => h('option', { value: t }, t)));
    const add = h('button', { class: 'btn sm', type: 'button', onclick: () => {
      const n = name.value.trim();
      if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(n)) return toast('Field names: letters, digits, underscore; start with a letter.', 'bad');
      if (n in v) return toast('That field already exists.', 'bad');
      v[n] = clone(NEW_BY_TYPE[typeSel.value]);
      if (typeSel.value === 'long text') { if (!longPaths.has(v)) longPaths.set(v, new Set()); longPaths.get(v).add(n); }
      markDirty(); redraw();
    } }, '+ add field');
    return [...(rows.length ? rows : [h('div', { class: 'empty' }, 'No fields yet.')]), h('div', { class: 'add' }, name, typeSel, add)];
  }
  body.append(...inner());
  return body;
}
const isComplex = x => x && typeof x === 'object';
function collapsible(container, key, depth, redrawParent){
  const v = container[key];
  const d = h('details', { class: 'node' });
  const sum = h('summary', {}, h('span', { class: 'chev' }, '›'), h('span', { class: 'preview' }, preview(v)), h('span', { class: 'type' }, typeOf(v)));
  d.append(sum);
  let built = false;
  d.addEventListener('toggle', () => {
    if (d.open && !built) { built = true; d.append(node(v, depth + 1, () => { sum.querySelector('.preview').textContent = preview(v); })); }
  });
  return d;
}

/* ================= SHELL ================= */
function markDirty(){
  const k = S.active, d = dirty(k);
  const btn = document.getElementById('saveBtn'); if (btn) { btn.disabled = !d; btn.textContent = S.sections[k].version === null ? 'Publish' : 'Save'; }
  const dot = document.querySelector(`.nav-k[data-k="${CSS.escape(k)}"] .dot`); if (dot) dot.style.visibility = d ? 'visible' : 'hidden';
}
function applyRaw(){
  const ta = document.getElementById('raw');
  try { S.sections[S.active].data = JSON.parse(ta.value); ta.classList.remove('bad'); return true; }
  catch (e) { ta.classList.add('bad'); toast('Invalid JSON: ' + e.message, 'bad'); return false; }
}
function renderShell(){
  const k = S.active, s = S.sections[k];
  const navItems = Object.keys(S.sections).map(key => h('button', { class: 'nav-k' + (key === k ? ' act' : ''), 'data-k': key, type: 'button', onclick: () => {
      if (S.raw && !applyRaw()) return;
      S.active = key; renderShell(); window.scrollTo(0, 0);
    } }, h('span', {}, LABELS[key] || key), h('span', { style: 'display:flex;align-items:center;gap:6px' }, S.sections[key].version === null ? h('small', {}, 'not saved') : h('small', {}, 'v' + S.sections[key].version), h('span', { class: 'dot', style: 'visibility:' + (dirty(key) ? 'visible' : 'hidden') }))));
  const newKey = h('button', { class: 'btn sm', type: 'button', onclick: () => {
    const name = prompt('New data key (letters/digits, e.g. "talks" or "certifications").\nTip: to show a new section on the homepage, add it inside "Custom sections" instead.');
    if (!name) return;
    if (!/^[a-z][a-zA-Z0-9_-]{0,40}$/.test(name)) return toast('Key must start with a lowercase letter; letters, digits, _ or - only.', 'bad');
    if (S.sections[name]) return toast('That key exists.', 'bad');
    S.sections[name] = { data: {}, version: null, saved: null }; S.active = name; renderShell();
  } }, '+ new data key');
  const logout = h('button', { class: 'btn sm', type: 'button', onclick: async () => { await api('/api/auth/logout', { method: 'POST' }).catch(() => {}); S.user = null; renderLogin('Signed out.'); } }, 'Sign out');
  const aside = h('aside', {},
    h('div', { class: 'me' }, h('img', { src: '/assets/img/avatar.webp', alt: '' }), h('div', {}, h('b', {}, 'Admin'), S.user ? S.user.email : '')),
    ...navItems, h('div', { class: 'grow' }),
    h('div', { class: 'foot' }, newKey, h('a', { class: 'btn sm', href: '/', target: '_blank', rel: 'noopener' }, 'View site ↗'), logout));

  const saveBtn = h('button', { class: 'btn primary', id: 'saveBtn', type: 'button', disabled: !dirty(k), onclick: save }, s.version === null ? 'Publish' : 'Save');
  const revert = h('button', { class: 'btn', type: 'button', onclick: () => {
    if (!dirty(k) || !confirm('Discard unsaved changes in this section?')) return;
    s.data = s.saved ? JSON.parse(s.saved) : clone(DEFAULTS[k] !== undefined ? DEFAULTS[k] : {}); renderShell();
  } }, 'Discard');
  const rawBtn = h('button', { class: 'btn', type: 'button', onclick: () => { if (S.raw && !applyRaw()) return; S.raw = !S.raw; renderShell(); } }, S.raw ? 'Form view' : 'JSON view');
  const bar = h('div', { class: 'bar' },
    h('h2', {}, LABELS[k] || k),
    h('span', { class: 'meta' }, s.version === null ? 'default content · not in database yet' : `v${s.version}${s.updated_at ? ' · saved ' + new Date(s.updated_at).toLocaleString() : ''}`),
    rawBtn, revert, saveBtn);

  const content = h('div', { class: 'content' });
  if (HINTS[k]) content.append(h('div', { class: 'hint' }, HINTS[k]));
  if (S.raw) {
    const ta = h('textarea', { class: 'raw', id: 'raw', spellcheck: 'false', value: JSON.stringify(s.data, null, 2), oninput: () => { try { s.data = JSON.parse(ta.value); ta.classList.remove('bad'); markDirty(); } catch { ta.classList.add('bad'); } } });
    content.append(ta);
  } else {
    content.append(node(s.data, 0));
  }
  app.replaceChildren(h('div', { class: 'shell' }, aside, h('main', {}, bar, content)));
}

/* ================= BOOT ================= */
async function boot(){
  app.replaceChildren(h('div', { class: 'loading' }, 'loading…'));
  const s = await api('/api/auth/session').catch(() => ({ status: 0 }));
  if (!s.ok) return renderLogin(s.status === 403 ? 'This account is not an admin.' : s.status === 0 ? 'Network error.' : '');
  S.user = s.body.user;
  try { await loadSections(); } catch (e) { return app.replaceChildren(h('div', { class: 'loading' }, e.message)); }
  renderShell();
}
addEventListener('beforeunload', e => { if (Object.keys(S.sections).some(dirty)) { e.preventDefault(); e.returnValue = ''; } });
addEventListener('keydown', e => { if ((e.metaKey || e.ctrlKey) && e.key === 's') { e.preventDefault(); const b = document.getElementById('saveBtn'); if (b && !b.disabled) save(); } });
boot();
})();
