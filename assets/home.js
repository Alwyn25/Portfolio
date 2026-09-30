/* Homepage: render every section from Content, then bind interactions.
   Renders defaults immediately; re-renders if /api/content returns different data. */
(function(){
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = matchMedia('(pointer: fine)').matches;
const { esc, rich, safeHref } = window.Content;
const $ = id => document.getElementById(id);

/* ======================= RENDERERS ======================= */
function render(c){
  const s = c.site;
  document.title = `${s.name} — ${s.role}`;
  const [first, ...rest] = String(s.name).split(' ');
  $('heroInner').innerHTML = `
    <div class="eyebrow">${esc(s.role)} · ${esc(s.location)}</div>
    <h1><span class="line"><span>${esc(first)}</span></span><span class="line"><span>${esc(rest.join(' '))}</span></span></h1>
    <div class="role">&gt; building <b id="typed"></b><span class="caret"></span></div>
    <p class="lede">${rich(s.lede)}</p>
    <div class="cta">
      <a class="btn primary magnetic" href="${safeHref(s.ctaPrimary.href)}">${esc(s.ctaPrimary.label)}</a>
      <a class="btn ghost magnetic" href="${safeHref(s.ctaSecondary.href)}">${esc(s.ctaSecondary.label)}</a>
    </div>`;
  $('legend').innerHTML = (s.legend || []).map((l, i) => i === 0 ? esc(l).replace(/→/g, '<span>→</span>') : `<span>${esc(l)}</span>`).join('<br>');

  $('stats').innerHTML = (s.stats || []).map(st => `
    <div class="stat"><div class="n"><span data-count="${Number(st.value) || 0}" data-dec="${Number(st.decimals) || 0}">0</span>${st.suffix ? `<em>${esc(st.suffix)}</em>` : ''}</div><div class="l">${esc(st.label)}</div></div>`).join('');

  const tones = { cyan: 'hl2', amber: 'hl' };
  const ph = s.photos || {};
  const fig = (o, cls) => o && o.src ? `<figure class="photo ${cls}"><img src="${safeHref(o.src)}" alt="${esc(o.alt)}" loading="lazy" decoding="async">${cls === 'main' ? '<div class="scan"></div>' : ''}${o.caption ? `<figcaption>${esc(o.caption)}</figcaption>` : ''}</figure>` : '';
  if (ph.avatar && ph.avatar.src) $('navAvatar').src = ph.avatar.src;
  $('aboutBody').innerHTML = `
    <div class="reveal"><div class="about-media">${fig(ph.portrait, 'main')}${fig(ph.secondary, 'second')}</div><p class="quote about-quote">${(s.about.quote || []).map(q => `${esc(q.text)}<span class="${tones[q.tone] || 'hl'}">${esc(q.accent)}</span>${esc(q.end || '')}`).join('<br>')}</p></div>
    <div class="reveal">
      ${(s.about.paragraphs || []).map(p => `<p>${rich(p)}</p>`).join('')}
      <ul class="principles">${(s.about.principles || []).map((p, i) => `<li><span>${String(i + 1).padStart(2, '0')}</span>${rich(p)}</li>`).join('')}</ul>
    </div>`;

  $('systemsList').innerHTML = (c.systems || []).map(sy => `
    <article class="sys reveal">
      <div>
        <div class="tag">${esc(sy.tag)}</div>
        <h3><a href="/projects/${encodeURIComponent(sy.slug)}">${esc(sy.title)}</a></h3>
        <p>${rich(sy.text)}</p>
        <div class="chips">${(sy.chips || []).map(x => `<span class="chip">${esc(x)}</span>`).join('')}</div>
        <div class="metric">${(sy.metrics || []).map(m => `<div><b>${esc(m[0])}</b>${esc(m[1])}</div>`).join('')}</div>
        <a class="case-link" href="/projects/${encodeURIComponent(sy.slug)}">${esc(sy.cta || 'Read the case study')} <i>→</i></a>
      </div>
      <div class="flow" data-flow>${(sy.stages || []).map(st => `<div class="stage${st.decide ? ' decide' : ''}"><span class="i">${esc(st.i)}</span><div>${esc(st.title)}<small>${esc(st.sub)}</small></div></div>`).join('')}</div>
    </article>`).join('');

  $('jobs').innerHTML = (c.experience || []).map(j => `
    <div class="job reveal">
      <div class="job-top"><h3>${esc(j.role)} <span class="co">@ ${esc(j.company)}</span></h3>${j.when ? `<span class="when">${esc(j.when)}</span>` : ''}</div>
      <ul>${(j.bullets || []).map(b => `<li>${rich(b)}</li>`).join('')}${(j.more || []).map(b => `<li class="extra">${rich(b)}</li>`).join('')}</ul>
      ${(j.more || []).length ? '<button class="more" data-more>+ show more</button>' : ''}
    </div>`).join('');

  $('projectGrid').innerHTML = (c.projects || []).filter(p => p.showInGrid && p.card).map(p => `
    <a class="card${p.card.wide ? ' wide' : ''} reveal tilt" href="/projects/${encodeURIComponent(p.slug)}">
      <div class="k"><span>${esc(p.card.k1)}</span><span>${esc(p.card.k2)}</span></div>
      <h3>${esc(p.title)}</h3>
      <p>${rich(p.card.text)}</p>
      <div class="chips">${(p.card.chips || []).map(x => `<span class="chip">${esc(x)}</span>`).join('')}</div>
      <span class="go">${esc(p.card.cta || 'read more')} <i>→</i></span>
    </a>`).join('');

  $('filters').innerHTML = `<button class="act" data-f="all">all</button>` + (c.skills || []).map(g => `<button data-f="${esc(g.id)}">${esc(g.label)}</button>`).join('');
  $('cloud').innerHTML = (c.skills || []).map(g => (g.items || []).map(x => `<span class="sk" data-cat="${esc(g.id)}">${esc(x)}</span>`).join('')).join('');

  $('writingList').innerHTML = (s.writing || []).map(w => `
    <a class="w reveal" href="${safeHref(w.href)}" target="_blank" rel="noopener">
      <div class="tag">${esc(w.tag)}</div><h3>${esc(w.title)}</h3><p>${rich(w.text)}</p>
    </a>`).join('');

  const custom = Array.isArray(c.customSections) ? c.customSections : [];
  $('customSections').innerHTML = custom.map((sec, i) => `
    <section id="${esc(sec.id || 'section-' + (i + 1))}" style="padding-top:0">
      <div class="wrap">
        <div class="sec-head reveal"><span class="sec-num">${String(7 + i).padStart(2, '0')}</span><h2>${esc(sec.title)}</h2></div>
        ${sec.subtitle ? `<p class="reveal" style="color:var(--muted);max-width:680px;margin:-30px 0 36px">${rich(sec.subtitle)}</p>` : ''}
        <div class="${sec.layout === 'list' ? 'principles' : 'writing'}">${(sec.items || []).map(it => sec.layout === 'list'
          ? `<li class="reveal" style="list-style:none"><span>${esc(it.tag || '')}</span>${it.href ? `<a href="${safeHref(it.href)}" target="_blank" rel="noopener"><b>${esc(it.title)}</b></a>` : `<b>${esc(it.title)}</b>`}${it.text ? ` — ${rich(it.text)}` : ''}</li>`
          : `<${it.href ? 'a' : 'div'} class="w reveal"${it.href ? ` href="${safeHref(it.href)}" target="_blank" rel="noopener"` : ''}>${it.tag ? `<div class="tag">${esc(it.tag)}</div>` : ''}<h3>${esc(it.title)}</h3><p>${rich(it.text)}</p></${it.href ? 'a' : 'div'}>`).join('')}</div>
      </div>
    </section>`).join('');

  const ct = s.contact;
  $('contactBody').innerHTML = `
    ${ph.contact && ph.contact.src ? `<div class="contact-photo"><img src="${safeHref(ph.contact.src)}" alt="${esc(ph.contact.alt)}" loading="lazy" decoding="async"></div>` : ''}
    <div class="sec-num" style="margin-bottom:20px">${String(7 + custom.length).padStart(2, '0')} · contact</div>
    <h2><a href="mailto:${esc(ct.email)}">${esc(ct.heading)}</a></h2>
    <p>${rich(ct.text)}</p>
    <div class="socials">
      <a class="btn primary magnetic" href="mailto:${esc(ct.email)}">${esc(ct.email)}</a>
      ${(ct.links || []).map(l => `<a class="btn ghost magnetic" href="${safeHref(l.href)}" target="_blank" rel="noopener">${esc(l.label)}</a>`).join('')}
    </div>`;
  $('footerBody').innerHTML = `<span>${esc(s.footer.left)}</span><span>${esc(s.footer.right)}</span>`;
}

/* ======================= HERO CANVAS (content-independent) ======================= */
(function canvas(){
  const cv = $('pipeline'), ctx = cv.getContext('2d');
  let W, H, particles = [], mouse = {x:-9999, y:-9999};
  const LAYERS = 5;
  function size(){ const dpr = Math.min(devicePixelRatio || 1, 2); W = cv.clientWidth; H = cv.clientHeight; cv.width = W*dpr; cv.height = H*dpr; ctx.setTransform(dpr,0,0,dpr,0,0); }
  const layerX = i => W*(0.18 + i*0.16);
  const target = () => ({x: W*0.9, y: H*0.5});
  const spawn = () => ({x: -20 - Math.random()*W*0.3, y: Math.random()*H, vx: 0.6+Math.random()*0.9, vy:0, r: 0.8+Math.random()*1.6, hue: Math.random()<0.18 ? 'a' : 'c'});
  function init(){ size(); const n = Math.round(Math.min(260, W*H/5500)); particles = Array.from({length:n}, spawn); particles.forEach(p=>p.x=Math.random()*W); }
  function step(){
    ctx.clearRect(0,0,W,H);
    for(let i=0;i<LAYERS;i++){
      const x = layerX(i), g = ctx.createLinearGradient(0,H*0.15,0,H*0.85);
      g.addColorStop(0,'rgba(92,225,230,0)'); g.addColorStop(.5,'rgba(92,225,230,0.10)'); g.addColorStop(1,'rgba(92,225,230,0)');
      ctx.fillStyle = g; ctx.fillRect(x-0.5, H*0.15, 1, H*0.7);
    }
    const t = target(), pulse = 1 + Math.sin(performance.now()/600)*0.12;
    const rg = ctx.createRadialGradient(t.x,t.y,0,t.x,t.y,60*pulse);
    rg.addColorStop(0,'rgba(255,181,71,0.35)'); rg.addColorStop(1,'rgba(255,181,71,0)');
    ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(t.x,t.y,60*pulse,0,Math.PI*2); ctx.fill();
    ctx.fillStyle = '#ffb547'; ctx.beginPath(); ctx.arc(t.x,t.y,4,0,Math.PI*2); ctx.fill();
    for(const p of particles){
      const pull = Math.max(0, (p.x - layerX(LAYERS-1)) / (t.x - layerX(LAYERS-1)));
      p.vy += (t.y - p.y) * 0.0009 * pull;
      p.vy += Math.sin((p.x+p.y)*0.01)*0.004;
      const dx = p.x-mouse.x, dy = p.y-mouse.y, d2 = dx*dx+dy*dy;
      if(d2 < 14000){ const f = (14000-d2)/14000; p.vy += (dy/Math.sqrt(d2+1))*f*0.9; p.x += (dx/Math.sqrt(d2+1))*f*1.2; }
      p.vy *= 0.94; const ox = p.x, oy = p.y; p.y += p.vy; p.x += p.vx*(1+pull*0.8);
      let near = 0; for(let i=0;i<LAYERS;i++){ const d = Math.abs(p.x-layerX(i)); if(d<10) near = 1-d/10; }
      const col = p.hue==='a' ? '255,181,71' : '92,225,230';
      ctx.strokeStyle = `rgba(${col},${0.12+near*0.3})`; ctx.lineWidth = p.r;
      ctx.beginPath(); ctx.moveTo(ox-(p.x-ox)*6, oy-(p.y-oy)*6); ctx.lineTo(p.x,p.y); ctx.stroke();
      ctx.fillStyle = `rgba(${col},${0.35+near*0.6})`;
      ctx.beginPath(); ctx.arc(p.x,p.y,p.r+near*1.4,0,Math.PI*2); ctx.fill();
      if(p.x > t.x-6 && Math.abs(p.y-t.y)<40 || p.x > W+20){ Object.assign(p, spawn()); }
    }
    if(!reduce) requestAnimationFrame(step);
  }
  init(); step();
  addEventListener('resize', () => { init(); if(reduce) step(); });
  const hero = document.querySelector('.hero');
  hero.addEventListener('pointermove', e => { const r = cv.getBoundingClientRect(); mouse.x = e.clientX-r.left; mouse.y = e.clientY-r.top; });
  hero.addEventListener('pointerleave', () => { mouse.x = mouse.y = -9999; });
})();

/* ======================= GLOBAL (bound once) ======================= */
const nav = $('nav'), bar = $('progress'), fill = $('tlFill');
function onScroll(){
  const s = scrollY, h = document.documentElement.scrollHeight - innerHeight;
  bar.style.width = (h > 0 ? s/h*100 : 0)+'%';
  nav.classList.toggle('scrolled', s > 20);
  const sec = document.querySelector('.photo.second');
  if (sec && !reduce) { const rr = sec.parentNode.getBoundingClientRect(); const k = (rr.top + rr.height/2 - innerHeight/2) / innerHeight; sec.style.transform = `translateY(${(k * 60).toFixed(1)}px)`; }
  const r = $('timeline').getBoundingClientRect();
  const prog = Math.min(1, Math.max(0, (innerHeight*0.6 - r.top) / r.height));
  fill.style.height = (prog * Math.max(0, r.height-12)) + 'px';
}
addEventListener('scroll', onScroll, {passive:true});
if(fine && !reduce) addEventListener('pointermove', e => { const g = $('glow'); g.style.left = e.clientX+'px'; g.style.top = e.clientY+'px'; });
const links = $('links');
$('menuBtn').addEventListener('click', () => links.classList.toggle('open'));
links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => links.classList.remove('open')));

/* skills filter: only the selected category is shown (container persists across renders: bind once) */
$('filters').addEventListener('click', e => {
  const b = e.target.closest('button'); if(!b) return;
  $('filters').querySelectorAll('button').forEach(x => x.classList.toggle('act', x===b));
  const f = b.dataset.f; let k = 0;
  $('cloud').querySelectorAll('.sk').forEach(s => {
    const show = f==='all' || s.dataset.cat===f;
    s.classList.toggle('off', !show); s.classList.remove('pop');
    if(show && !reduce){ void s.offsetWidth; s.style.animationDelay = (k++*18)+'ms'; s.classList.add('pop'); }
  });
});

/* ======================= PER-RENDER BINDINGS ======================= */
let typeTimer = null, flowTimers = [], observers = [];
function teardown(){
  clearTimeout(typeTimer); flowTimers.forEach(clearInterval); flowTimers = [];
  observers.forEach(o => o.disconnect()); observers = [];
}
function bind(c){
  teardown();
  /* typed roles */
  const roles = (c.site.typedRoles && c.site.typedRoles.length) ? c.site.typedRoles : [''];
  const el = $('typed');
  if (reduce) el.textContent = roles[0];
  else {
    let ri = 0, ci = 0, del = false;
    (function type(){
      const w = roles[ri]; el.textContent = w.slice(0, ci);
      if(!del && ci===w.length){ del = true; typeTimer = setTimeout(type, 1700); return; }
      if(del && ci===0){ del = false; ri = (ri+1)%roles.length; }
      ci += del ? -1 : 1;
      typeTimer = setTimeout(type, del ? 28 : 62);
    })();
  }
  /* reveal + counters */
  const count = n => {
    const end = parseFloat(n.dataset.count), dec = +(n.dataset.dec||0), t0 = performance.now(), dur = reduce?0:1400;
    (function tick(now){ const k = dur ? Math.min(1,(now-t0)/dur) : 1, e = 1-Math.pow(1-k,3); n.textContent = (end*e).toFixed(dec); if(k<1) requestAnimationFrame(tick); })(t0);
  };
  const io = new IntersectionObserver(es => es.forEach(e => {
    if(!e.isIntersecting) return;
    e.target.classList.add('in'); io.unobserve(e.target);
    e.target.querySelectorAll('[data-count]').forEach(count);
  }), {threshold:.15, rootMargin:'0px 0px -40px 0px'});
  document.querySelectorAll('.reveal:not(.in)').forEach(n => {
    if (n.getBoundingClientRect().bottom < 0) n.classList.add('in');   // already scrolled past (live refresh)
    else io.observe(n);
  });
  document.querySelectorAll('.reveal.in [data-count]').forEach(count);
  observers.push(io);
  /* pipeline stage sequencer */
  document.querySelectorAll('[data-flow]').forEach(flow => {
    const st = [...flow.children]; let i = 0, timer = null;
    const run = () => { st.forEach((s,j)=>s.classList.toggle('on', j===i)); i = (i+1)%st.length; };
    const o = new IntersectionObserver(([e]) => {
      if(e.isIntersecting && !timer){ run(); timer = setInterval(run, reduce?4000:1100); flowTimers.push(timer); }
      else if(!e.isIntersecting && timer){ clearInterval(timer); timer = null; }
    }, {threshold:.3});
    o.observe(flow); observers.push(o);
  });
  /* spotlight */
  document.querySelectorAll('.sys').forEach(card => card.addEventListener('pointermove', e => {
    const r = card.getBoundingClientRect(); card.style.setProperty('--mx', (e.clientX-r.left)+'px'); card.style.setProperty('--my', (e.clientY-r.top)+'px');
  }));
  /* tilt + magnetic */
  if(fine && !reduce){
    document.querySelectorAll('.tilt').forEach(card => {
      card.addEventListener('pointermove', e => {
        const r = card.getBoundingClientRect(), x = (e.clientX-r.left)/r.width-.5, y = (e.clientY-r.top)/r.height-.5;
        card.style.transform = `perspective(900px) rotateY(${x*7}deg) rotateX(${-y*7}deg) translateY(-4px)`;
      });
      card.addEventListener('pointerleave', () => card.style.transform = '');
    });
    document.querySelectorAll('.magnetic').forEach(b => {
      b.addEventListener('pointermove', e => { const r = b.getBoundingClientRect(); b.style.transform = `translate(${(e.clientX-r.left-r.width/2)*.18}px, ${(e.clientY-r.top-r.height/2)*.28}px)`; });
      b.addEventListener('pointerleave', () => b.style.transform = '');
    });
  }
  /* experience expand */
  document.querySelectorAll('[data-more]').forEach(b => b.addEventListener('click', () => {
    const j = b.closest('.job'); j.classList.toggle('open');
    b.textContent = j.classList.contains('open') ? '− show less' : '+ show more'; onScroll();
  }));
  onScroll();
}

/* ======================= BOOT ======================= */
function paint(c){ render(c); bind(c); }
paint(window.Content.get());
window.Content.load().then(({ content, changed }) => {
  if (changed) paint(content);
});
})();
