/* Architecture diagram renderer + scroll-driven scenes. */
(function(){
const NS = 'http://www.w3.org/2000/svg';
const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

/* ------------------------------------------------------------------ */
/* Architecture renderer (used for the main diagram and the mini scene) */
function renderArch(p, opts){
  opts = opts || {};
  const a = p.arch, C = a.cols.length, W = 900;
  const colW = W / C, nw = Math.min(colW - 26, 176), nh = 54, rowH = 80, top = 44;
  const maxRow = Math.max(...a.nodes.map(n => n.row));
  const H = top + (maxRow + 1) * rowH + 8;
  const pos = {};
  a.nodes.forEach(n => { pos[n.id] = { x: n.col * colW + (colW - nw) / 2, y: top + n.row * rowH, n }; });
  let s = `<svg viewBox="0 0 ${W} ${H}" xmlns="${NS}" role="img" aria-label="${esc(p.title)} architecture">`;
  a.cols.forEach((c, i) => {
    s += `<text class="lane-label" x="${i * colW + colW / 2}" y="18" text-anchor="middle">${esc(c)}</text>`;
    if (i) s += `<line x1="${i * colW}" y1="28" x2="${i * colW}" y2="${H - 4}" stroke="#1a2028" stroke-dasharray="2 5"/>`;
  });
  a.edges.forEach(([f, t], i) => {
    const A = pos[f], B = pos[t]; if (!A || !B) return;
    let d;
    if (A.n.col === B.n.col) {
      const x = A.x + nw / 2, y1 = A.y + (B.y > A.y ? nh : 0), y2 = B.y + (B.y > A.y ? 0 : nh);
      d = `M${x},${y1} L${x},${y2}`;
    } else {
      const fwd = B.n.col > A.n.col;
      const x1 = fwd ? A.x + nw : A.x, y1 = A.y + nh / 2, x2 = fwd ? B.x : B.x + nw, y2 = B.y + nh / 2;
      const mx = (x1 + x2) / 2;
      d = `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`;
    }
    s += `<path id="e-${opts.mini ? 'm' : 'a'}-${i}" class="edge" data-f="${f}" data-t="${t}" d="${d}"/>`;
    if (!opts.still) s += `<circle class="packet" r="2.6" opacity=".85"><animateMotion dur="${2.2 + (i % 4) * 0.35}s" repeatCount="indefinite" begin="${(i % 5) * 0.4}s"><mpath href="#e-${opts.mini ? 'm' : 'a'}-${i}"/></animateMotion></circle>`;
  });
  a.nodes.forEach(n => {
    const P = pos[n.id];
    s += `<g class="node${n.decide ? ' decide' : ''}" data-id="${n.id}" tabindex="0" role="button" aria-label="${esc(n.label)}">
      <rect x="${P.x}" y="${P.y}" width="${nw}" height="${nh}" rx="11"/>
      <circle class="dot" cx="${P.x + 14}" cy="${P.y + 18}" r="3.5"/>
      <text x="${P.x + 25}" y="${P.y + 22}">${esc(n.label)}</text>
      <text class="sub" x="${P.x + 14}" y="${P.y + 41}">${esc(n.sub || '')}</text></g>`;
  });
  return s + '</svg>';
}
window.renderArch = renderArch;

function highlight(svg, id, dim){
  if (!svg) return;
  svg.querySelectorAll('.node').forEach(g => {
    g.classList.toggle('sel', g.dataset.id === id);
    g.classList.toggle('dim-n', !!dim && !!id && g.dataset.id !== id);
  });
  svg.querySelectorAll('.edge').forEach(e => e.classList.toggle('hot', !!id && (e.dataset.t === id || e.dataset.f === id)));
}
window.highlightArch = highlight;

/* small helpers */
function el(html){ const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstChild; }
function prng(seed){ let x = seed; return () => (x = (x * 16807) % 2147483647) / 2147483647; }
function showOnly(root, key){ root.querySelectorAll('[data-ov]').forEach(g => g.classList.toggle('on', g.dataset.ov.split(' ').includes(key))); }

/* ------------------------------------------------------------------ */
/* FORENSIC DOCUMENT SCENE */
function forensic(host){
  const T = {x: 238, y: 338, w: 150, h: 34};           // tampered balance field
  const S1 = {cx: 108, cy: 462}, S2 = {cx: 318, cy: 470}; // stamp + copy-moved twin
  const r = prng(7);
  let cells = '';
  for (let y = 70; y < 520; y += 34) for (let x = 20; x < 400; x += 34) {
    const hit = x + 34 > T.x && x < T.x + T.w && y + 34 > T.y && y < T.y + T.h;
    const v = hit ? 0.55 + r() * 0.3 : r() * 0.1;
    cells += `<rect x="${x}" y="${y}" width="32" height="32" rx="3" fill="${hit ? '#ff6b8b' : '#5ce1e6'}" fill-opacity="${v.toFixed(2)}" stroke="${hit ? '#ff6b8b' : 'none'}" stroke-opacity=".8"/>`;
  }
  let rows = '';
  const tx = [['02 Aug','NEFT · Salary','+ 72,000.00'],['05 Aug','UPI · Grocery','− 3,418.00'],['09 Aug','Rent · IMPS','− 24,000.00'],['14 Aug','Card · Fuel','− 2,950.00'],['21 Aug','UPI · Utilities','− 1,862.00'],['28 Aug','Interest','+ 214.00']];
  tx.forEach((t, i) => { const y = 214 + i * 20; rows += `<text x="36" y="${y}" class="dt">${t[0]}</text><text x="104" y="${y}" class="dt">${t[1]}</text><text x="384" y="${y}" class="dt" text-anchor="end">${t[2]}</text>`; });
  const stamp = (c, id) => `<g ${id}><circle cx="${c.cx}" cy="${c.cy}" r="30" fill="none" stroke="#6b3fa0" stroke-width="2.4" opacity=".75"/><circle cx="${c.cx}" cy="${c.cy}" r="23" fill="none" stroke="#6b3fa0" stroke-width="1" opacity=".75"/><text x="${c.cx}" y="${c.cy - 3}" text-anchor="middle" font-size="7.5" fill="#6b3fa0" opacity=".85" font-family="IBM Plex Mono">NORTHWIND</text><text x="${c.cx}" y="${c.cy + 8}" text-anchor="middle" font-size="6.5" fill="#6b3fa0" opacity=".85" font-family="IBM Plex Mono">VERIFIED</text></g>`;

  host.innerHTML = `
  <div class="scene-tag">sample_statement.pdf · synthetic</div><div class="scene-step" id="scStep"></div>
  <svg viewBox="0 0 420 540" xmlns="${NS}" id="docsvg">
    <defs>
      <filter id="turb"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="3"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="table" tableValues="0 .55"/></feComponentTransfer></filter>
      <filter id="turb2"><feTurbulence type="fractalNoise" baseFrequency=".32" numOctaves="1" seed="9"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="table" tableValues="0 .9"/></feComponentTransfer></filter>
      <pattern id="stripes" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><rect width="3" height="6" fill="#ffb547" opacity=".55"/></pattern>
      <radialGradient id="heat"><stop offset="0" stop-color="#ff6b8b" stop-opacity=".95"/><stop offset=".45" stop-color="#ffb547" stop-opacity=".55"/><stop offset="1" stop-color="#ffb547" stop-opacity="0"/></radialGradient>
      <clipPath id="loupe"><circle cx="300" cy="258" r="62"/></clipPath>
      <style>.dt{font:9.5px 'IBM Plex Mono',monospace;fill:#3b3f46}.hd{font:700 15px 'Inter Tight',sans-serif;fill:#1d2733}.lb{font:9px 'IBM Plex Mono',monospace;fill:#6d737c}.ov{opacity:0;transition:opacity .6s}.ov.on{opacity:1}</style>
    </defs>
    <g class="doc-base" id="docbase">
      <rect x="10" y="10" width="400" height="520" rx="6" fill="#f3efe6"/>
      <rect x="10" y="10" width="400" height="54" rx="6" fill="#1d2733"/><rect x="10" y="50" width="400" height="14" fill="#1d2733"/>
      <text x="30" y="43" font-family="Bricolage Grotesque, sans-serif" font-weight="800" font-size="18" fill="#f3efe6">NORTHWIND BANK</text>
      <text x="390" y="42" text-anchor="end" class="lb" fill="#aab4c0" style="fill:#aab4c0">ACCOUNT STATEMENT</text>
      <text x="30" y="92" class="lb">ACCOUNT HOLDER</text><text x="30" y="108" class="hd" style="font-size:13px">R. Sharma</text>
      <text x="230" y="92" class="lb">ACCOUNT NO.</text><text x="230" y="108" class="hd" style="font-size:13px">XXXX XXXX 4821</text>
      <text x="30" y="136" class="lb">PERIOD</text><text x="30" y="151" class="dt">01 Aug 2026 – 31 Aug 2026</text>
      <line x1="30" y1="178" x2="390" y2="178" stroke="#c9c2b3"/>
      <text x="36" y="194" class="lb">DATE</text><text x="104" y="194" class="lb">DESCRIPTION</text><text x="384" y="194" class="lb" text-anchor="end">AMOUNT (₹)</text>
      ${rows}
      <line x1="30" y1="328" x2="390" y2="328" stroke="#c9c2b3"/>
      <text x="36" y="360" class="hd" style="font-size:12px">Closing balance</text>
      <text x="384" y="361" class="hd" text-anchor="end" style="font-size:15.5px;letter-spacing:.3px">₹ 1,85,420.00</text>
      <line x1="30" y1="390" x2="390" y2="390" stroke="#c9c2b3"/>
      ${stamp(S1, '')}
      <path d="M232 470 c12 -22 24 10 34 -6 s14 -18 22 2 s10 8 20 -4" fill="none" stroke="#1d2733" stroke-width="1.6" opacity=".7"/>
      ${stamp(S2, '')}
      <text x="30" y="514" class="lb">This is a computer-generated statement. Illustrative sample.</text>
    </g>

    <g class="ov" data-ov="meta">
      <rect x="10" y="10" width="400" height="520" rx="6" fill="none" stroke="#ffb547" stroke-width="2" stroke-dasharray="7 6" class="flowing"/>
      <rect x="186" y="70" width="216" height="92" rx="8" fill="#0a0c0f" stroke="#ffb547"/>
      <text x="198" y="90" font-family="IBM Plex Mono" font-size="9.5" fill="#8b95a3">/Producer</text><text x="394" y="90" text-anchor="end" font-family="IBM Plex Mono" font-size="9.5" fill="#ffb547">image-editor</text>
      <text x="198" y="108" font-family="IBM Plex Mono" font-size="9.5" fill="#8b95a3">/CreationDate</text><text x="394" y="108" text-anchor="end" font-family="IBM Plex Mono" font-size="9.5" fill="#e8ecf1">2026-09-01</text>
      <text x="198" y="126" font-family="IBM Plex Mono" font-size="9.5" fill="#8b95a3">/ModDate</text><text x="394" y="126" text-anchor="end" font-family="IBM Plex Mono" font-size="9.5" fill="#ff6b8b">2026-09-14</text>
      <text x="198" y="144" font-family="IBM Plex Mono" font-size="9.5" fill="#8b95a3">incremental saves</text><text x="394" y="144" text-anchor="end" font-family="IBM Plex Mono" font-size="9.5" fill="#ff6b8b">2</text>
    </g>
    <g class="ov" data-ov="ela">
      <rect x="10" y="10" width="400" height="520" rx="6" fill="#fff" filter="url(#turb)" opacity=".35"/>
      <rect x="${T.x}" y="${T.y}" width="${T.w}" height="${T.h}" fill="#fff" filter="url(#turb2)"/>
      <rect x="${T.x}" y="${T.y}" width="${T.w}" height="${T.h}" fill="#ffb547" opacity=".35"/>
    </g>
    <g class="ov" data-ov="noise">
      <rect x="10" y="10" width="400" height="520" rx="6" fill="#5ce1e6" filter="url(#turb)" opacity=".7"/>
      <rect x="${T.x}" y="${T.y}" width="${T.w}" height="${T.h}" fill="#ff6b8b" filter="url(#turb2)" opacity=".95"/>
      <rect x="${T.x - 3}" y="${T.y - 3}" width="${T.w + 6}" height="${T.h + 6}" rx="4" fill="none" stroke="#ff6b8b" stroke-width="1.5" class="blink"/>
    </g>
    <g class="ov" data-ov="patch">${cells}</g>
    <g class="ov" data-ov="ae">
      <ellipse cx="${T.x + T.w / 2}" cy="${T.y + T.h / 2}" rx="120" ry="44" fill="url(#heat)"/>
      <ellipse cx="150" cy="240" rx="40" ry="18" fill="url(#heat)" opacity=".15"/>
    </g>
    <g class="ov" data-ov="resample">
      <rect x="${T.x}" y="${T.y}" width="${T.w}" height="${T.h}" fill="url(#stripes)"/>
      <rect x="${T.x}" y="${T.y}" width="${T.w}" height="${T.h}" fill="none" stroke="#ffb547" stroke-width="1.5"/>
      <g transform="translate(236 72)">
        <rect width="166" height="90" rx="8" fill="#0a0c0f" stroke="#2a323c"/>
        <text x="10" y="16" font-family="IBM Plex Mono" font-size="8.5" fill="#8b95a3">FFT · pasted region</text>
        ${[4,6,5,7,30,6,5,8,6,34,7,5,6,9,31,6,5].map((h, i) => `<rect x="${12 + i * 8.6}" y="${80 - h * 1.6}" width="5" height="${h * 1.6}" fill="${h > 20 ? '#ffb547' : '#3a4654'}"/>`).join('')}
      </g>
    </g>
    <g class="ov" data-ov="unet">
      <path d="M${T.x + 4},${T.y + 4} h${T.w - 8} v${T.h - 8} h-${T.w - 8} z" fill="#5ce1e6" fill-opacity=".35" stroke="#5ce1e6" stroke-width="2"/>
      <text x="${T.x + T.w}" y="${T.y - 8}" text-anchor="end" font-family="IBM Plex Mono" font-size="9" fill="#5ce1e6">tamper mask</text>
    </g>
    <g class="ov" data-ov="cross">
      <circle cx="${S1.cx}" cy="${S1.cy}" r="38" fill="none" stroke="#ffb547" stroke-width="2"/>
      <circle cx="${S2.cx}" cy="${S2.cy}" r="38" fill="none" stroke="#ff6b8b" stroke-width="2"/>
      <path d="M${S1.cx + 38},${S1.cy} C${S1.cx + 90},${S1.cy - 50} ${S2.cx - 90},${S2.cy - 50} ${S2.cx - 38},${S2.cy}" fill="none" stroke="#ffb547" stroke-width="1.6" class="flowing"/>
      <rect x="160" y="404" width="104" height="20" rx="10" fill="#0a0c0f" stroke="#ffb547"/>
      <text x="212" y="417" text-anchor="middle" font-family="IBM Plex Mono" font-size="9" fill="#ffb547">near-identical</text>
    </g>
    <g class="ov" data-ov="font">
      <line x1="${T.x + 70}" y1="${T.y}" x2="286" y2="318" stroke="#ffb547" stroke-width="1"/>
      <circle cx="300" cy="258" r="64" fill="#0a0c0f" stroke="#ffb547" stroke-width="2"/>
      <g clip-path="url(#loupe)">
        <text x="252" y="252" font-family="Inter Tight" font-weight="700" font-size="48" fill="#e8ecf1">85</text>
        ${Array.from({length: 14}, (_, i) => `<line x1="${238 + i * 9}" y1="196" x2="${238 + i * 9}" y2="320" stroke="#0a0c0f" stroke-width=".8"/>`).join('')}
        <rect x="252" y="212" width="16" height="6" fill="#ff6b8b"/><rect x="286" y="236" width="10" height="6" fill="#ff6b8b"/>
        <text x="300" y="296" text-anchor="middle" font-family="IBM Plex Mono" font-size="8.5" fill="#ffb547">hard-edged AA</text>
      </g>
    </g>
    <g class="ov" data-ov="fusion">
      <rect x="120" y="76" width="180" height="34" rx="17" fill="#ff6b8b"/>
      <text x="210" y="98" text-anchor="middle" font-family="Inter Tight" font-weight="700" font-size="13" fill="#0a0c0f">RISK HIGH → HUMAN REVIEW</text>
      <rect x="40" y="120" width="340" height="250" rx="14" fill="#0a0c0f" stroke="#2a323c"/>
      <text x="60" y="148" font-family="IBM Plex Mono" font-size="10" fill="#8b95a3">FEATURE VECTOR → FUSION → RULES</text>
      ${[['metadata',.78],['ela',.84],['noiseprint',.8],['patch_cnn',.88],['ae_mahal',.74],['resample',.81],['unet_mask',.9],['cross_patch',.86],['render',.77]].map((f, i) => `<text x="60" y="${172 + i * 18}" font-family="IBM Plex Mono" font-size="9" fill="#c4cbd4">${f[0]}</text><rect x="150" y="${164 + i * 18}" width="200" height="8" rx="4" fill="#1a2028"/><rect x="150" y="${164 + i * 18}" width="${200 * f[1]}" height="8" rx="4" fill="${f[1] > .8 ? '#ff6b8b' : '#ffb547'}"/>`).join('')}
    </g>
  </svg>
  <div class="callout" id="callout"></div>`;
  const svg = host.querySelector('#docsvg'), base = host.querySelector('#docbase');
  const filters = { ela: 'grayscale(1) brightness(.32)', noise: 'grayscale(1) brightness(.3)', patch: 'brightness(.55)', ae: 'brightness(.6)', resample: 'brightness(.62)', unet: 'brightness(.5)', cross: 'brightness(.7)', font: 'brightness(.62)', fusion: 'blur(2px) brightness(.3)' };
  return { set(i, st){ showOnly(svg, st.k); base.style.filter = filters[st.k] || 'none'; } };
}

/* ------------------------------------------------------------------ */
/* LIVE CALL SCENE (voice platform) */
function call(host, p){
  const items = [
    ['sys', 'gate passed · dialing lead L-20931'],
    ['user', 'Haan, 3BHK chahiye, budget 1.2 crore ke around.'],
    ['sys', 'router → T1 state machine · 0 LLM calls'],
    ['sys', 'tool: check_inventory ✓ preconditions'],
    ['sys', 'facts: structured table · context: RRF retrieval'],
    ['bot', 'Ji, Skyline mein 3BHK 1.14 crore se available hai. Kya aap is weekend site visit karna chahenge?'],
    ['sys', 'CRM updated · site visit Sat 11:00 · trace dt_7f3a']
  ];
  const bars = Array.from({length: 38}, (_, i) => `<i style="animation-delay:${(i % 9) * 90}ms"></i>`).join('');
  host.innerHTML = `
  <style>
    .phone{width:min(360px,100%);min-width:0;height:100%;max-height:560px;display:flex;flex-direction:column;border:1px solid #2a323c;border-radius:26px;background:#07090b;overflow:hidden}
    .ph-top{padding:14px 16px;border-bottom:1px solid #1a2028;display:flex;align-items:center;justify-content:space-between;font-family:var(--mono);font-size:11px;color:var(--muted)}
    .ph-top b{color:var(--text);font-weight:500}
    .live{color:var(--green)}.live::before{content:"● "}
    .wave{height:38px;display:flex;align-items:center;justify-content:center;gap:3px;border-bottom:1px solid #1a2028}
    .wave i{width:3px;height:6px;border-radius:2px;background:var(--cyan);opacity:.7;animation:wv 1s ease-in-out infinite}
    @keyframes wv{50%{height:26px}}
    .msgs{flex:1;overflow:hidden;display:flex;flex-direction:column;justify-content:flex-end;gap:9px;padding:14px}
    .m{max-width:86%;font-size:13px;line-height:1.45;padding:9px 12px;border-radius:14px}
    .m.user{align-self:flex-start;background:#1a2028;border-bottom-left-radius:4px}
    .m.bot{align-self:flex-end;background:var(--amber);color:#0a0c0f;border-bottom-right-radius:4px}
    .m.sys{align-self:center;max-width:100%;white-space:normal;text-align:center;font-family:var(--mono);font-size:10.5px;color:var(--cyan);border:1px solid rgba(92,225,230,.3);border-radius:999px;padding:4px 10px}
    .m.sys.cur{border-color:var(--amber);color:var(--amber)}
    .m .who{display:block;font-family:var(--mono);font-size:9.5px;opacity:.6;margin-bottom:2px}
  </style>
  <div class="scene-tag">live call · illustrative</div><div class="scene-step" id="scStep"></div>
  <div class="phone">
    <div class="ph-top"><span><b>Skyline presales</b> · agent</span><span class="live">00:47</span></div>
    <div class="wave">${bars}</div>
    <div class="msgs" id="msgs">${items.map((m, i) => `<div class="m ${m[0]} bubble" data-i="${i}">${m[0] === 'user' ? '<span class="who">caller</span>' : m[0] === 'bot' ? '<span class="who">agent</span>' : ''}${esc(m[1])}</div>`).join('')}</div>
  </div>`;
  const b = [...host.querySelectorAll('.m')];
  return { set(i){ b.forEach((x, j) => { x.classList.toggle('on', j <= i); x.style.display = j <= i ? '' : 'none'; x.classList.toggle('cur', j === i); }); } };
}

/* ------------------------------------------------------------------ */
/* INSIGHTS SCENE */
function insights(host){
  const pts = [.31,.34,.29,.33,.36,.32,.30,.35,.33,.18];
  const px = i => 50 + i * 36, py = v => 330 - v * 520;
  host.innerHTML = `
  <div class="scene-tag">illustrative data</div><div class="scene-step" id="scStep"></div>
  <svg viewBox="0 0 420 420" xmlns="${NS}" id="insvg">
    <style>.lbl{font:10px 'IBM Plex Mono',monospace;fill:#8b95a3}.big{font:700 14px 'Inter Tight',sans-serif;fill:#e8ecf1}.bx{fill:#11151a;stroke:#2a323c}</style>
    <g class="ov" data-ov="capture">
      ${['Portals','Ad forms','Website','Missed calls'].map((s, i) => `<rect class="bx" x="20" y="${60 + i * 78}" width="120" height="46" rx="10"/><text class="big" x="80" y="${88 + i * 78}" text-anchor="middle" style="font-size:12.5px">${s}</text><path d="M140 ${83 + i * 78} C 220 ${83 + i * 78} 220 210 290 210" fill="none" stroke="#5ce1e6" stroke-width="1.4" class="flowing"/>`).join('')}
      <rect x="290" y="176" width="112" height="68" rx="12" fill="#11151a" stroke="#ffb547"/>
      <text class="big" x="346" y="206" text-anchor="middle">Unified</text><text class="lbl" x="346" y="226" text-anchor="middle">one schema</text>
    </g>
    <g class="ov" data-ov="dedupe">
      ${[['99acres','+91 98••• 21'],['Meta form','+91 98••• 21'],['Website','+91 98••• 21']].map((r, i) => `<g><rect class="bx" x="24" y="${70 + i * 90}" width="170" height="60" rx="10"/><text class="lbl" x="38" y="${94 + i * 90}">${r[0]}</text><text class="big" x="38" y="${114 + i * 90}" style="font-size:12px">${r[1]}</text><path d="M194 ${100 + i * 90} C 250 ${100 + i * 90} 250 200 290 200" fill="none" stroke="#ffb547" stroke-width="1.4" class="flowing"/></g>`).join('')}
      <rect x="290" y="160" width="116" height="80" rx="12" fill="#11151a" stroke="#5ce1e6"/>
      <text class="lbl" x="348" y="186" text-anchor="middle">hash(phone)</text><text class="big" x="348" y="208" text-anchor="middle">1 buyer</text><text class="lbl" x="348" y="226" text-anchor="middle" style="fill:#ffb547">2 duplicates</text>
    </g>
    <g class="ov" data-ov="funnel">
      ${[['Lead',1000],['Qualified',420],['Site visit',140],['Booking',38]].map((f, i) => `<text class="lbl" x="30" y="${100 + i * 70}">${f[0].toUpperCase()}</text><rect x="30" y="${108 + i * 70}" width="${300 * f[1] / 1000}" height="26" rx="6" fill="${i === 3 ? '#ffb547' : '#5ce1e6'}" opacity="${1 - i * .15}"/><text class="big" x="${40 + 300 * f[1] / 1000}" y="${126 + i * 70}">${f[1]}</text>`).join('')}
    </g>
    <g class="ov" data-ov="anomaly">
      <text class="lbl" x="30" y="50">SITE-VISIT RATE · PROJECT P-07 · WEEKLY</text>
      <path d="M50 ${py(.41)} L ${px(9)} ${py(.41)} L ${px(9)} ${py(.24)} L 50 ${py(.24)} Z" fill="#5ce1e6" opacity=".12"/>
      <text class="lbl" x="${px(9) - 4}" y="${py(.41) - 6}" text-anchor="end">credible band</text>
      <polyline points="${pts.map((v, i) => `${px(i)},${py(v)}`).join(' ')}" fill="none" stroke="#e8ecf1" stroke-width="1.6"/>
      ${pts.map((v, i) => `<circle cx="${px(i)}" cy="${py(v)}" r="${i === 9 ? 6 : 3.5}" fill="${i === 9 ? '#ff6b8b' : '#e8ecf1'}" ${i === 9 ? 'class="blink"' : ''}/>`).join('')}
      <rect x="220" y="${py(.18) + 14}" width="170" height="26" rx="13" fill="#ff6b8b"/>
      <text x="305" y="${py(.18) + 31}" text-anchor="middle" style="font:700 11px 'Inter Tight';fill:#0a0c0f">ALERT · below band</text>
    </g>
    <g class="ov" data-ov="narrate">
      <rect x="24" y="70" width="372" height="190" rx="14" fill="#11151a" stroke="#ffb547"/>
      <text class="lbl" x="44" y="98" style="fill:#ffb547">INSIGHT · P-07</text>
      ${['Site-visit rate fell to 18%, below its','expected 24–41% range. Most likely','cause: a shift in lead-source mix.','Next: review portal lead quality.','Owner: presales lead.'].map((l, i) => `<text class="big" x="44" y="${126 + i * 24}" style="font-weight:500;font-size:13px">${l}</text>`).join('')}
      ${['18% ∈ object','24–41% ∈ object','no invented figures'].map((c, i) => `<text class="lbl" x="44" y="${298 + i * 22}" style="fill:#5fd39a">✓ ${c}</text>`).join('')}
    </g>
    <g class="ov" data-ov="kyc">
      ${['L1 Capture','L2 Document','L3 Data match','L4 Verification','L5 Policy'].map((l, i) => `<rect class="bx" x="20" y="${46 + i * 70}" width="140" height="44" rx="10"/><text class="big" x="90" y="${73 + i * 70}" text-anchor="middle" style="font-size:12px">${l}</text>`).join('')}
      ${[['T1 Auto-resolve','#5fd39a',90],['T2 Borrower-guided','#ffb547',210],['T3 Human review','#ff6b8b',330]].map(t => `<rect x="270" y="${t[2] - 26}" width="136" height="52" rx="12" fill="#11151a" stroke="${t[1]}"/><text class="big" x="338" y="${t[2] + 5}" text-anchor="middle" style="font-size:11.5px;fill:${t[1]}">${t[0]}</text>`).join('')}
      ${[[0,90],[1,210],[2,90],[3,330],[4,210],[1,330],[3,90]].map(([a, b]) => `<path d="M160 ${68 + a * 70} C 215 ${68 + a * 70} 215 ${b} 270 ${b}" fill="none" stroke="#3a4654" stroke-width="1.3" class="flowing"/>`).join('')}
    </g>
  </svg><div class="callout" id="callout"></div>`;
  const svg = host.querySelector('#insvg');
  return { set(i, st){ showOnly(svg, st.k); } };
}

/* ------------------------------------------------------------------ */
/* PLATE SCENE */
function plate(host){
  host.innerHTML = `
  <div class="scene-tag">frame #1832 · illustrative</div><div class="scene-step" id="scStep"></div>
  <svg viewBox="0 0 420 400" xmlns="${NS}" id="plsvg">
    <style>.lbl{font:10px 'IBM Plex Mono',monospace;fill:#8b95a3}</style>
    <rect x="0" y="0" width="420" height="400" rx="16" fill="#0d1116"/>
    <rect x="0" y="300" width="420" height="100" fill="#141a21"/>
    <g id="car">
      <path d="M90 170 Q 110 110 170 104 L 250 104 Q 310 110 330 170 Z" fill="#26303b"/>
      <path d="M120 164 Q 135 124 175 120 L 245 120 Q 285 124 300 164 Z" fill="#5ce1e6" opacity=".18"/>
      <rect x="70" y="166" width="280" height="96" rx="20" fill="#303b48"/>
      <rect x="84" y="186" width="54" height="22" rx="6" fill="#ff6b8b" opacity=".8"/><rect x="282" y="186" width="54" height="22" rx="6" fill="#ff6b8b" opacity=".8"/>
      <rect x="160" y="220" width="100" height="28" rx="4" fill="#f3efe6"/>
      <text x="210" y="239" text-anchor="middle" font-family="IBM Plex Mono" font-weight="500" font-size="12.5" fill="#1d2733">KL 07 AB 1234</text>
      <rect x="86" y="262" width="46" height="36" rx="8" fill="#0d1116"/><rect x="288" y="262" width="46" height="36" rx="8" fill="#0d1116"/>
    </g>
    <g class="ov" data-ov="frame"><rect x="0" y="0" width="420" height="3" fill="#5ce1e6" opacity=".6"><animate attributeName="y" values="0;396;0" dur="3s" repeatCount="indefinite"/></rect></g>
    <g class="ov" data-ov="detect crop ocr log"><rect x="154" y="214" width="112" height="40" rx="4" fill="none" stroke="#ffb547" stroke-width="2"/><rect x="154" y="198" width="44" height="16" fill="#ffb547"/><text x="176" y="210" text-anchor="middle" font-family="IBM Plex Mono" font-size="9.5" fill="#0a0c0f">plate</text></g>
    <g class="ov" data-ov="crop ocr log">
      <rect x="60" y="316" width="300" height="70" rx="8" fill="#f3efe6" stroke="#ffb547" stroke-width="2"/>
      <text x="210" y="362" text-anchor="middle" font-family="IBM Plex Mono" font-weight="500" font-size="30" fill="#1d2733">KL 07 AB 1234</text>
    </g>
    <g class="ov" data-ov="ocr log">${'KL07AB1234'.split('').map((c, i) => `<rect x="${76 + i * 27.2 + (i > 1 ? 9 : 0) + (i > 3 ? 9 : 0) + (i > 5 ? 9 : 0)}" y="330" width="22" height="42" rx="3" fill="none" stroke="#5ce1e6" stroke-width="1.4"/>`).join('')}</g>
    <g class="ov" data-ov="log"><rect x="220" y="24" width="182" height="60" rx="10" fill="#0a0c0f" stroke="#5fd39a"/><text x="234" y="48" font-family="IBM Plex Mono" font-size="10" fill="#5fd39a">✓ logged to SQLite</text><text x="234" y="68" font-family="IBM Plex Mono" font-size="10" fill="#c4cbd4">KL07AB1234 · 10:42:07</text></g>
  </svg><div class="callout" id="callout"></div>`;
  const svg = host.querySelector('#plsvg');
  return { set(i, st){ showOnly(svg, st.k); } };
}

/* ------------------------------------------------------------------ */
/* FORECAST SCENE */
function forecast(host){
  const hist = [22,25,21,30,34,28,26,24,27,23,31,35,29,27,25,28,24,33,36,30,28];
  const fc = [26,29,25,34,38,31,29];
  const X = i => 30 + i * 13.5, Y = v => 320 - v * 6.5;
  const hPts = hist.map((v, i) => `${X(i)},${Y(v)}`).join(' ');
  const f0 = hist.length - 1;
  const fPts = [hist[f0], ...fc].map((v, i) => `${X(f0 + i)},${Y(v)}`).join(' ');
  const up = fc.map((v, i) => `${X(f0 + 1 + i)},${Y(v + 4 + i)}`), dn = fc.map((v, i) => `${X(f0 + 1 + i)},${Y(v - 4 - i)}`).reverse();
  host.innerHTML = `
  <div class="scene-tag">product #A12 · machine 07 · illustrative</div><div class="scene-step" id="scStep"></div>
  <svg viewBox="0 0 420 400" xmlns="${NS}" id="fcsvg">
    <style>.lbl{font:10px 'IBM Plex Mono',monospace;fill:#8b95a3}</style>
    ${[0,10,20,30,40].map(v => `<line x1="30" x2="400" y1="${Y(v)}" y2="${Y(v)}" stroke="#1a2028"/><text class="lbl" x="24" y="${Y(v) + 3}" text-anchor="end">${v}</text>`).join('')}
    <text class="lbl" x="30" y="40">UNITS / DAY</text>
    <polyline points="${hPts}" fill="none" stroke="#e8ecf1" stroke-width="1.8"/>
    <g class="ov" data-ov="fc band restock"><polyline points="${fPts}" fill="none" stroke="#ffb547" stroke-width="2" stroke-dasharray="5 4"/><text class="lbl" x="${X(f0) + 6}" y="${Y(40)}" style="fill:#ffb547">forecast →</text></g>
    <g class="ov" data-ov="band restock"><polygon points="${[...up, ...dn].join(' ')}" fill="#ffb547" opacity=".16"/><text class="lbl" x="${X(f0) - 6}" y="${Y(43)}" text-anchor="end">uncertainty band →</text></g>
    <g class="ov" data-ov="restock">${fc.map((v, i) => `<rect x="${X(f0 + 1 + i) - 4}" y="${Y(v + 5 + i)}" width="8" height="${320 - Y(v + 5 + i)}" fill="#5ce1e6" opacity=".35"/>`).join('')}<text class="lbl" x="${X(f0 + 1)}" y="352" style="fill:#5ce1e6">restock = forecast + safety stock</text></g>
    <line x1="${X(f0)}" x2="${X(f0)}" y1="60" y2="320" stroke="#3a4654" stroke-dasharray="3 4"/>
    <text class="lbl" x="${X(f0) - 4}" y="340" text-anchor="end">today</text>
  </svg><div class="callout" id="callout"></div>`;
  const svg = host.querySelector('#fcsvg');
  return { set(i, st){ showOnly(svg, st.k); } };
}

/* ------------------------------------------------------------------ */
/* DEFAULT: live mini architecture */
function arch(host, p){
  host.innerHTML = `<div class="scene-tag">pipeline</div><div class="scene-step" id="scStep"></div><div style="width:100%" id="miniArch">${renderArch(p, {mini: true})}</div><div class="callout" id="callout"></div>`;
  const svg = host.querySelector('#miniArch svg');
  svg.style.height = 'auto'; svg.style.width = '100%';
  return { set(i, st){ highlight(svg, st.node, true); } };
}

window.SCENES = { forensic, call, insights, plate, forecast, arch };
})();
