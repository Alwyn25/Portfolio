/* Case-study page renderer.
   Reads the slug from /projects/:slug (or ?p=), renders from Content (defaults first, then live /api/content).
   All content is escaped; links are allow-listed; payloads are plain text highlighted at render time. */
(function(){
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const { esc, safeHref } = window.Content;
const arr = v => Array.isArray(v) ? v : [];
const app = document.getElementById('app');
const slug = decodeURIComponent((location.pathname.match(/\/projects\/([^/?#]+)/) || [])[1] || new URLSearchParams(location.search).get('p') || '');

/* Minimal JSON/code highlighter over escaped text. */
function highlight(txt){
  return esc(txt)
    .replace(/(\/\/[^\n]*)/g, '<span class="cc">$1</span>')
    .replace(/(&quot;[^&\n]*?&quot;)(\s*:)/g, '<span class="kk">$1</span>$2')
    .replace(/(:\s*|\[\s*|,\s*)(&quot;[^&\n]*?&quot;)/g, '$1<span class="ss">$2</span>');
}

let state = null;          // { p, steps, scene, cur, ... } for the current render
let io = null;

function render(list){
  const idx = list.findIndex(p => p.slug === slug);
  if (idx < 0) {
    app.innerHTML = `<div class="wrap nf"><div class="eyebrow" style="justify-content:center">404</div><h1 style="margin:0 auto">Project not found</h1><p class="p-lede" style="margin:24px auto">That case study doesn't exist.</p><a class="btn primary" href="/#projects">Back to projects</a></div>`;
    state = null; return;
  }
  const p = list[idx], next = list[(idx + 1) % list.length];
  const arch = p.arch || { cols: [], nodes: [], edges: [] };
  document.title = `${p.title} — Alwyn Sebastian`;
  const md = document.querySelector('meta[name="description"]'); if (md) md.content = p.lede || '';
  const words = String(p.title).split(' ').map((w, i) => `<span class="word" style="animation-delay:${i * 70}ms">${esc(w)}</span>`).join(' ');

  app.innerHTML = `
<header class="p-hero"><div class="wrap">
  <div class="eyebrow">${esc(p.tag)}</div>
  <h1>${words}</h1>
  <p class="p-lede">${esc(p.lede)}</p>
  <div class="meta">${arr(p.meta).map(m => `<span class="pill">${esc(m)}</span>`).join('')}${p.status ? `<span class="pill status">in progress</span>` : ''}</div>
  ${p.status ? `<div class="honest">${esc(p.status)}</div>` : ''}
  ${arr(p.links).length ? `<div class="links">${arr(p.links).map(l => `<a class="btn primary" href="${safeHref(l[1])}" target="_blank" rel="noopener">${esc(l[0])}</a>`).join('')}</div>` : ''}
  <div class="metrics reveal">${arr(p.metrics).map(m => `<div><b>${esc(m[0])}</b><span>${esc(m[1])}</span></div>`).join('')}</div>
</div></header>

<section style="padding-top:20px"><div class="wrap two">
  <div class="panel reveal"><div class="k">The problem</div><p>${esc(p.problem)}</p></div>
  <div class="panel reveal"><div class="k">My role</div><ul>${arr(p.role).map(r => `<li>${esc(r)}</li>`).join('')}</ul></div>
</div></section>

<section id="architecture" style="padding-top:0"><div class="wrap">
  <div class="sec-head reveal"><span class="sec-num">01</span><h2>Architecture</h2><p class="sec-sub">Click any component to see its responsibility, contract, and stack. Dots trace data flowing between components.</p></div>
  <div class="arch">
    <div class="arch-canvas reveal" id="archCanvas">${arr(arch.nodes).length ? window.renderArch(p) : ''}</div>
    <aside class="arch-info reveal" id="archInfo"></aside>
  </div>
</div></section>

<section id="walkthrough" style="padding-top:0"><div class="wrap">
  <div class="sec-head reveal"><span class="sec-num">02</span><h2>${esc(p.walkTitle)}</h2><p class="sec-sub">${esc(p.walkSub)}</p></div>
  <div class="walk">
    <div class="stage-view"><div class="scene" id="scene"></div><div class="payload" id="payload" hidden></div></div>
    <div class="steps">${arr(p.steps).map((s, i) => `
      <article class="step" data-i="${i}">
        <div class="n">${String(i + 1).padStart(2, '0')} / ${String(arr(p.steps).length).padStart(2, '0')}</div>
        <h3>${esc(s.title)}</h3>
        <p>${esc(s.body)}</p>
        ${s.detects ? `<div class="detects"><b>${p.scene === 'forensic' ? 'Detects' : 'Why it matters'}</b>${esc(s.detects)}</div>` : ''}
        ${s.fail ? `<div class="fail"><b>Failure mode → fix</b>${esc(s.fail)}</div>` : ''}
      </article>`).join('')}
    </div>
  </div>
</div></section>

<section id="stack" style="padding-top:0"><div class="wrap">
  <div class="sec-head reveal"><span class="sec-num">03</span><h2>Stack</h2></div>
  <div class="stack">${arr(p.stack).map(g => `<div class="panel reveal"><h3>${esc(g[0])}</h3><div class="chips">${arr(g[1]).map(t => `<span class="chip">${esc(t)}</span>`).join('')}</div></div>`).join('')}</div>
</div></section>

<section id="decisions" style="padding-top:0"><div class="wrap">
  <div class="sec-head reveal"><span class="sec-num">04</span><h2>Engineering decisions</h2><p class="sec-sub">What was chosen, why, and what it cost.</p></div>
  <div class="decisions">${arr(p.decisions).map(d => `<div class="dec reveal"><h3>${esc(d.h)}</h3><div class="choice">${esc(d.c)}</div><p>${esc(d.p)}</p><div class="trade"><b>Trade-off</b>${esc(d.t)}</div></div>`).join('')}</div>
</div></section>

<section style="padding-top:0"><div class="wrap">
  <div class="next"><div><div class="lbl">NEXT CASE STUDY</div><a class="big" href="/projects/${encodeURIComponent(next.slug)}">${esc(next.title)} <i>→</i></a></div>
  <a class="btn ghost" href="/#projects">All projects</a></div>
</div></section>`;

  /* architecture interactions */
  const archSvg = document.querySelector('#archCanvas svg');
  const info = document.getElementById('archInfo');
  const nodeById = Object.fromEntries(arr(arch.nodes).map(n => [n.id, n]));
  function showNode(id){
    const n = nodeById[id]; if (!n) return;
    window.highlightArch(archSvg, id);
    info.innerHTML = `<div class="fade-swap">
      <div class="k">${esc(arr(arch.cols)[n.col] || '')}</div>
      <h3>${esc(n.label)}</h3>
      <p>${esc(n.desc)}</p>
      ${n.contract ? `<div class="row"><div class="lbl">Contract</div><div class="payload" style="max-height:none;white-space:normal">${esc(n.contract)}</div></div>` : ''}
      ${arr(n.tech).length ? `<div class="row"><div class="lbl">Stack</div><div class="chips">${arr(n.tech).map(t => `<span class="chip">${esc(t)}</span>`).join('')}</div></div>` : ''}
    </div>`;
  }
  if (archSvg) {
    archSvg.querySelectorAll('.node').forEach(g => {
      g.addEventListener('click', () => showNode(g.dataset.id));
      g.addEventListener('mouseenter', () => showNode(g.dataset.id));
      g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); showNode(g.dataset.id); } });
    });
    const first = arr(arch.nodes).find(n => n.decide) || arr(arch.nodes)[0];
    if (first) showNode(first.id);
  }

  /* scrollytelling */
  const sceneEl = document.getElementById('scene');
  const scene = (window.SCENES[p.scene] || window.SCENES.arch)(sceneEl, p);
  const payloadEl = document.getElementById('payload');
  const coEl = sceneEl.querySelector('#callout') || Object.assign(document.createElement('div'), { className: 'callout', id: 'callout' });
  sceneEl.parentNode.insertBefore(coEl, payloadEl);
  const hasCallouts = arr(p.steps).some(s => s.callout);
  if (!hasCallouts) coEl.classList.add('empty');
  state = { p, scene, sceneEl, payloadEl, coEl, hasCallouts, steps: [...document.querySelectorAll('.step')], cur: -1 };
  if (state.steps.length) activate(0);

  if (io) io.disconnect();
  io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .12 });
  document.querySelectorAll('.reveal').forEach(n => io.observe(n));
  onScroll();
}

function activate(i){
  const S = state; if (!S || i === S.cur) return; S.cur = i;
  const st = S.p.steps[i];
  S.steps.forEach((s, j) => s.classList.toggle('active', j === i));
  S.scene.set(i, st);
  const tag = S.sceneEl.querySelector('#scStep'); if (tag) tag.textContent = `step ${i + 1}/${S.p.steps.length}`;
  if (S.hasCallouts) {
    const co = S.coEl; co.classList.remove('show');
    if (st.callout) {
      const c = st.callout, tok = i;
      setTimeout(() => {
        if (!state || state.cur !== tok) return;
        co.innerHTML = `<div class="t">${esc(c.t)}</div><div class="h">${esc(c.h)}</div><div class="d">${esc(c.d)}</div>${arr(c.rows).length ? `<div class="grid2">${arr(c.rows).map(r => `<span>${esc(r[0])}</span><b>${esc(r[1])}</b>`).join('')}</div>` : ''}`;
        co.classList.add('show');
      }, reduce ? 0 : 220);
    }
  }
  const pe = S.payloadEl;
  if (st.payload) { pe.hidden = false; pe.innerHTML = highlight(st.payload); pe.classList.remove('fade-swap'); void pe.offsetWidth; pe.classList.add('fade-swap'); }
  else pe.hidden = true;
}

const bar = document.getElementById('progress');
function onScroll(){
  const h = document.documentElement.scrollHeight - innerHeight;
  bar.style.width = (h > 0 ? scrollY / h * 100 : 0) + '%';
  if (!state) return;
  const mid = innerHeight * (innerWidth <= 960 ? 0.72 : 0.5);
  let best = 0, bestD = Infinity;
  state.steps.forEach((s, i) => { const r = s.getBoundingClientRect(); const d = Math.abs(r.top + r.height / 2 - mid); if (d < bestD) { bestD = d; best = i; } });
  activate(best);
}
addEventListener('scroll', onScroll, { passive: true });
addEventListener('resize', onScroll);

render(window.Content.get().projects);
window.Content.load().then(({ content, changed }) => {
  if (!changed) return;
  const y = scrollY; render(content.projects); scrollTo(0, y);
});
})();
