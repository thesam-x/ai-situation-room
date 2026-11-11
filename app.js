(function(){
const U = window.U, V = window.V, D = window.AID, HQ = window.HQ, M = U.months, NOW = U.NOW, esc = U.esc;
const $ = s => document.querySelector(s);
const CATS = [['models','Models'],['bench','Benchmarks'],['econ','Economics'],['prod','Products'],['news','News'],['compute','Compute']];
const state = {cats: new Set(CATS.map(c => c[0])), labs: new Set(U.LABS.map(l => l.id)), sort: 'default', open: new Set(), view: 'dash'};
const COMPUTE = V.computeHits();

// ---------- small helpers ----------
const meta = (date, url, name, q) => `<div class="meta">${date ? U.fmtD(date) : '<span class="unkb">NO DATE</span>'}${url ? ` · <a href="${esc(url)}" target="_blank" rel="noopener">${esc(name || hostOf(url))} ↗</a>` : ''}${q ? U.rep(q) : ''}</div>`;
function hostOf(u){ try { return new URL(u).hostname.replace('www.',''); } catch(e){ return 'source'; } }
const byDateDesc = (a, b) => String(b || '').localeCompare(String(a || ''));
const latestOf = f => Array.isArray(f) ? f.slice().sort((a,b) => byDateDesc(a.date, b.date))[0] : f;
const relDate = m => m.release_date && m.release_date.date;
const totalItems = id => M.reduce((a, _, i) => a + (U.labActivity(id, i) || 0), 0);
const latestRelease = l => l.models.map(relDate).filter(Boolean).sort(byDateDesc)[0] || '';
const heatBg = n => n ? U.heatColor(Math.min(10, 1.2 + n*1.6), .9) : 'rgba(255,255,255,.04)';

// ---------- card sections ----------
function econLine(label, f){
  if(!f) return '';
  if(U.isUnknown(f.value)) return `<div class="it"><b class="k">${label}:</b> <span class="unkb">UNKNOWN</span>${f.note ? `<div class="d">${esc(f.note)}</div>` : ''}</div>`;
  return `<div class="it"><b class="k">${label}:</b> ${esc(U.val(f.value))}${meta(f.date, f.source_url, f.source_name, f.qualifier)}</div>`;
}
function sec(cls, title, inner, extra){ return `<div class="sec s-${cls}"><h4><span>${title}</span>${extra ? `<small>${extra}</small>` : ''}</h4>${inner}</div>`; }
function card(l){
  const h = HQ[l.id], open = state.open.has(l.id), g = U.maxGap(l.id), fc = U.fc(l.id)[0];
  const models = open ? l.models : l.models.filter(relDate).sort((a,b) => byDateDesc(relDate(a), relDate(b))).slice(0, 2);
  const mHtml = open ? V.models(l) : models.map(m => { const r = m.release_date; return `<div class="it"><b class="k">${esc(m.name)}</b><span class="st ${esc(m.status)}">${esc(U.pretty(m.status))}</span> <span class="d">${esc(U.pretty(m.role))}</span>${meta(r.date, r.source_url, r.source_name, r.qualifier)}</div>`; }).join('');
  const bl = l.benchmarks;
  const vItem = b => `<div class="it"><div class="bench"><span>${esc(b.benchmark)} <span class="d">· ${esc(b.model)}</span></span><span class="s">${U.isUnknown(b.score) ? '<span class="unkb">UNKNOWN</span>' : esc(b.score)}</span></div>${open && b.note ? `<div class="d">${esc(b.note)}</div>` : ''}${meta(b.date, b.source_url, b.source_name)}</div>`;
  const bHtml = (window.BM ? BM.parityList(l.id) : '') + (window.BM ? BM.vendorDetails(bl, vItem) : bl.map(vItem).join(''));
  const e = l.economics;
  const eHtml = open ? V.econ(l) : [['Revenue', latestOf(e.revenue)], ['Funding', latestOf(e.latest_funding)], ['Valuation', latestOf(e.valuation)], ['IPO', latestOf(e.ipo_status)]].map(([k,f]) => econLine(k, f)).join('');
  const prods = open ? l.products_and_devices : l.products_and_devices.slice(0, 3);
  const feats = open ? l.features : l.features.slice(0, 2);
  const pHtml = prods.map(p => `<div class="it"><b class="k">${esc(p.name)}</b>${U.isUnknown(p.status) ? ' <span class="unkb">UNKNOWN</span>' : `<span class="st ${esc(p.status)}">${esc(U.pretty(p.status))}</span>`}${open && p.note ? `<div class="d">${esc(p.note)}</div>` : ''}${meta(p.date, p.source_url, hostOf(p.source_url))}</div>`).join('')
    + feats.map(f => U.isUnknown(f.value) ? `<div class="it">Feature: <span class="unkb">UNKNOWN</span></div>` : `<div class="it">${esc(U.val(f.value))}${meta(f.date, f.source_url, f.source_name, f.qualifier)}</div>`).join('');
  const news = l.recent_news.slice().sort((a,b) => byDateDesc(a.date, b.date)).slice(0, open ? 99 : 4);
  const nHtml = news.map(n => `<div class="it">${esc(n.headline)}${meta(n.date, n.source_url, n.source_name, n.qualifier)}</div>`).join('');
  const comp = COMPUTE.filter(c => c.lab === l.id);
  const cHtml = comp.length ? comp.map(c => `<div class="it">${esc(open || c.text.length < 170 ? c.text : c.text.slice(0, 168) + '…')}${meta(c.date, c.url, c.name, c.q)}</div>`).join('') : '<div class="it d">No compute or chip items for this lab in the dataset.</div>';
  const strip = `<div class="mstrip" title="Count of dated, sourced items per month (duplicates merged). Hatched = estimate window, no counts.">${M.map((m,i) => { const n = U.labActivity(l.id, i); return m.forecast ? '<i class="f"></i>' : `<i style="background:${heatBg(n)}">${n || ''}</i>`; }).join('')}</div><div class="mlab">${M.map(m => `<span>${esc(m.label.slice(0,3))}</span>`).join('')}</div>`;
  const hide = CATS.filter(([k]) => !state.cats.has(k)).map(([k]) => 'hidecat-' + k).join(' ');
  return `<article class="card ${hide}" style="--c:${h.color}" id="card-${l.id}">
   <div class="hd"><div><h3>${esc(l.name)}</h3><div class="hq">${esc(h.city)} · ${esc(l.parent)}</div></div>${g ? `<button class="gapchip" data-bts="${l.id}" title="Beneath the Surface: highest gap score (analytic judgment)">◐ Gap ${g}/10</button>` : ''}</div>
   ${strip}
   ${sec('models', 'Latest models', mHtml, open ? `${l.models.length} tracked` : `${Math.min(2, models.length)} of ${l.models.length}`)}
   ${sec('bench', 'Key benchmarks · independent', bHtml, window.BM ? `${BM.PCOLS.length} fixed rows` : '')}
   ${sec('econ', 'Economics', eHtml)}
   ${sec('prod', 'Products & features', pHtml, open ? '' : `${prods.length + feats.length} of ${l.products_and_devices.length + l.features.length}`)}
   ${sec('news', 'Latest news', nHtml, open ? '' : `${news.length} of ${l.recent_news.length}`)}
   ${sec('compute', 'Compute & chips', cHtml)}
   ${open ? sec('outlook', '3-month outlook · ESTIMATE, not a fact', V.outlook(l)) + sec('btsx', '◐ Beneath the Surface', V.bts(l)) :
     (fc ? `<div class="outl"><span class="fcl">3-MONTH ESTIMATE · NOT A FACT</span> · ${esc(fc.title)} <span class="d">(confidence: ${esc(fc.confidence)})</span></div>` : '')}
   <button class="more" data-exp="${l.id}">${open ? 'Show less ▲' : 'Full details ▼'}</button>
  </article>`;
}
function renderGrid(){
  let labs = U.LABS.filter(l => state.labs.has(l.id));
  const s = state.sort;
  if(s === 'name') labs.sort((a,b) => a.name.localeCompare(b.name));
  if(s === 'release') labs.sort((a,b) => byDateDesc(latestRelease(a), latestRelease(b)));
  if(s === 'activity') labs.sort((a,b) => totalItems(b.id) - totalItems(a.id));
  if(s === 'gap') labs.sort((a,b) => U.maxGap(b.id) - U.maxGap(a.id));
  $('#grid').innerHTML = labs.map(card).join('') || '<div class="note">No labs selected. <button type="button" class="qbtn" data-qempty="labs">Show all labs</button></div>';
  $('#grid').querySelectorAll('[data-exp]').forEach(b => b.onclick = () => { const id = b.dataset.exp; state.open.has(id) ? state.open.delete(id) : state.open.add(id); renderGrid(); if(!state.open.has(id)) document.getElementById('card-' + id).scrollIntoView({block:'nearest'}); });
  $('#grid').querySelectorAll('[data-bts]').forEach(b => b.onclick = () => { setView('bts'); const el = document.getElementById('bts-' + b.dataset.bts); if(el) el.scrollIntoView({block:'start'}); });
  $('#expAll').textContent = state.open.size === U.LABS.length ? 'Collapse all' : 'Expand all';
}
// ---------- heat strip ----------
function heatTable(){
  return `<table class="heat"><thead><tr><th class="lab">Lab</th>${M.map((m,i) => `<th class="${m.forecast?'f':''} ${i===NOW?'now':''}">${m.label.replace(' 20',' ’')}${i===NOW?' · NOW':''}${m.forecast?' · est.':''}</th>`).join('')}<th>Total</th></tr></thead><tbody>${U.LABS.map(l => `<tr><td class="lab" style="--c:${HQ[l.id].color}">${esc(U.SHORT[l.id])}</td>${M.map((m,i) => { const n = U.labActivity(l.id, i); return m.forecast ? '<td class="c f" title="Estimate window: no counts">—</td>' : `<td class="c ${n?'':'z'}" style="background:${heatBg(n)}" title="${n} dated sourced item(s) in ${m.label}">${n}</td>`; }).join('')}<td class="c" style="color:var(--mut)">${totalItems(l.id)}</td></tr>`).join('')}</tbody></table>
  <div class="heatnote">Numbers are counts, not scores: items from the dataset's timeline, news, model release dates and economics facts, with near-duplicate entries on the same day merged. May starts May 10; Nov runs to Nov 10. Hatched months (Dec–Feb) are the estimate window, so they have no counts.</div>`;
}
// ---------- timeline ----------
function renderTimeline(){
  const MONTHRX = {'2026-12': /\bDec(ember)?\b/i, '2027-01': /\bJan(uary)?\b/i, '2027-02': /\bFeb(ruary)?\b/i};
  const fcs = U.LABS.flatMap(l => U.fc(l.id)), placed = new Set();
  const cols = M.map((m, i) => {
    if(!m.forecast){
      const ev = D.timeline.filter(t => t.date.startsWith(m.key)).sort((a,b) => a.date.localeCompare(b.date));
      return `<div class="tcol ${i===NOW?'now':''}"><h3>${m.label}<span>${ev.length} sourced</span></h3>${ev.map(t => `<div class="tev" style="--c:${HQ[t.lab].color}"><div class="w"><b>${esc(U.SHORT[t.lab])}</b> · ${U.fmtD(t.date)}</div>${esc(t.headline)}${U.rep(t.qualifier)}<div class="meta"><a href="${esc(t.source_url)}" target="_blank" rel="noopener">${esc(t.source_name)} ↗</a></div></div>`).join('') || '<div class="note">No timeline entries (window starts May 10).</div>'}</div>`;
    }
    const its = fcs.filter(f => !placed.has(f) && MONTHRX[m.key].test(f.title + ' ' + f.estimate)); its.forEach(f => placed.add(f));
    return `<div class="tcol f"><h3>${m.label}<span class="fcl">ESTIMATE</span></h3>${fcItems(its) || '<div class="note">No estimate tied to this month.</div>'}</div>`;
  });
  const rest = fcs.filter(f => !placed.has(f));
  cols.push(`<div class="tcol f"><h3>Nov 10 – Feb 10<span class="fcl">ESTIMATE</span></h3><div class="note" style="margin-bottom:6px">Estimates not tied to a specific month.</div>${fcItems(rest)}</div>`);
  $('#v-timeline').innerHTML = `<h2>Timeline · May 2026 → Now → Feb 2027</h2><div class="sub">Sourced events from the dataset (left), then the 3-month window (hatched). Hatched columns are <b class="fcl">ESTIMATES, NOT FACTS</b>, each with a confidence label. Scroll sideways →</div><div class="tstrip">${cols.join('')}</div><div class="heatwrap" style="margin-top:12px"><div class="hsum">Activity per lab per month — count of dated, sourced items</div>${heatTable()}</div>`;
}
const fcItems = its => its.map(f => `<div class="tev" style="--c:${HQ[f.lab].color}"><div class="w"><b>${esc(U.SHORT[f.lab])}</b> · confidence: ${esc(f.confidence)}</div><b style="color:var(--heading)">${esc(f.title)}</b><div class="d">${esc(f.estimate)}</div></div>`).join('');
// ---------- BTS ----------
function renderBts(){
  const items = U.bts.slice().sort((a,b) => b.gap_score - a.gap_score), seen = new Set();
  $('#v-bts').innerHTML = `<h2>◐ Beneath the Surface · narrative vs. observed signal</h2><div class="sub">Each item pairs a dated public claim with a later, sourced signal. The gap score (0–10) is <b>analytic judgment</b> from the dataset, not a fact.</div>
  <div class="btsgrid">${items.map(b => { const anchor = seen.has(b.lab) ? '' : `id="bts-${b.lab}"`; seen.add(b.lab); return `<div class="btsbox" ${anchor}>${V.btsOne(b)}</div>`; }).join('')}</div>`;
}
// ---------- X posts ----------
function pick(o, ks){ for(const k of ks){ const v = k.split('.').reduce((a, p) => a && a[p], o); if(v) return v; } return ''; }
function renderX(posts, srcName){
  posts = (posts || []).filter(p => p && typeof p === 'object');
  if(!posts.length){ $('#xpanel').classList.remove('has'); return; }
  $('#xsub').textContent = `${posts.length} post${posts.length===1?'':'s'} from ${srcName || 'X Posts file'} · links only, no embeds`;
  $('#xitems').innerHTML = posts.map(p => {
    const name = pick(p, ['author_name','author.name','name','display_name','author']), handle = pick(p, ['author_handle','handle','username','author.username','screen_name']);
    const date = pick(p, ['date','created_at','posted_at','timestamp']), text = String(pick(p, ['text','snippet','content','full_text','body']));
    const url = pick(p, ['url','post_url','link','permalink']), safe = /^https?:\/\//.test(url) ? url : '';
    return `<div class="xp"><div class="a">${esc(typeof name === 'string' ? name : '')} ${handle ? `<span>@${esc(String(handle).replace(/^@/,''))}</span>` : ''}</div><div class="d">${esc(U.fmtD(String(date)))}</div><div class="t">${esc(text.length > 240 ? text.slice(0,238) + '…' : text)}</div>${safe ? `<a href="${esc(safe)}" target="_blank" rel="noopener">Open post on X ↗</a>` : ''}</div>`;
  }).join('');
  $('#xpanel').classList.add('has');
}
const XP = window.XPOSTS || {posts: []};
renderX(XP.posts, XP.source_file); // embedded by build.py; re-run it after X Posts drops a posts file

// ---------- toolbar ----------
$('#catChips').innerHTML = CATS.map(([k,n]) => `<button class="chip on" data-cat="${k}">${n}</button>`).join('');
$('#labChips').innerHTML = U.LABS.map(l => `<button class="chip on" data-lab="${l.id}" style="--c:${HQ[l.id].color}"><span class="sw"></span>${esc(U.SHORT[l.id])}</button>`).join('');
const SOLO_TIP = 'Click to toggle · Alt/Option-click or double-click to show only this one';
const GROUPS = {cats: {attr: 'cat', all: () => CATS.map(c => c[0])}, labs: {attr: 'lab', all: () => U.LABS.map(l => l.id)}};
const syncChips = () => {
  Object.entries(GROUPS).forEach(([g, G]) => {
    document.querySelectorAll(`[data-${G.attr}]`).forEach(b => { const on = state[g].has(b.dataset[G.attr]); b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
    const n = state[g].size, total = G.all().length;
    document.querySelectorAll(`[data-qall="${g}"]`).forEach(b => b.setAttribute('aria-disabled', n === total));
    document.querySelectorAll(`[data-qnone="${g}"]`).forEach(b => b.setAttribute('aria-disabled', n === 0));
  });
};
const applyChips = () => { if(q.has('pm')) pst.mode = q.get('pm'); if(q.has('plab')) pst.lab = q.get('plab'); if(q.has('range')) pst.range = q.get('range'); if(q.has('bench')) pst.bench = q.get('bench');
  window.P.render(pst); syncChips(); renderGrid(); };
Object.entries(GROUPS).forEach(([g, G]) => {
  document.querySelectorAll(`[data-${G.attr}]`).forEach(b => {
    const k = b.dataset[G.attr]; b.title = SOLO_TIP;
    const solo = () => { state[g] = new Set([k]); applyChips(); };
    b.onclick = e => { if(e.altKey){ e.preventDefault(); return solo(); } state[g].has(k) ? state[g].delete(k) : state[g].add(k); applyChips(); };
    b.ondblclick = e => { e.preventDefault(); solo(); };
    b.onkeydown = e => { if(e.altKey && (e.key === 'Enter' || e.key === ' ')){ e.preventDefault(); solo(); } };
  });
  document.querySelectorAll(`[data-qall="${g}"]`).forEach(b => b.onclick = () => { state[g] = new Set(G.all()); applyChips(); });
  document.querySelectorAll(`[data-qnone="${g}"]`).forEach(b => b.onclick = () => { state[g] = new Set(); applyChips(); });
});
$('#grid').addEventListener('click', e => { if(e.target.closest('[data-qempty]')){ state.labs = new Set(GROUPS.labs.all()); applyChips(); } });
$('#sortSel').onchange = e => { state.sort = e.target.value; renderGrid(); };
$('#expAll').onclick = () => { if(state.open.size === U.LABS.length) state.open.clear(); else U.LABS.forEach(l => state.open.add(l.id)); renderGrid(); };
function setView(v){
  state.view = v; document.querySelectorAll('#tabs button').forEach(b => b.classList.toggle('on', b.dataset.v === v));
  document.querySelectorAll('.view').forEach(s => s.classList.toggle('open', s.id === 'v-' + v)); window.scrollTo(0, 0);
}
document.querySelectorAll('#tabs button').forEach(b => b.onclick = () => setView(b.dataset.v));
$('#methBtn').onclick = () => $('#modal').classList.add('open');
$('#modal').onclick = e => { if(e.target.id === 'modal') $('#modal').classList.remove('open'); };

// ---------- methodology ----------
$('#methBox').innerHTML = `<h3>Methodology</h3>
<p><b>Data.</b> Everything here comes from X Posts' dataset (as of ${U.fmtD(D.meta.as_of)}; window ${U.fmtD(D.meta.coverage_window.start)} – ${U.fmtD(D.meta.coverage_window.end)}). Every item shows its date and source; items marked unknown stay unknown. Dataset notes:</p>
<ul>${D.meta.methodology.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
<p><b>Benchmarks</b> are mostly company-reported and not directly comparable across labs.</p>
<p><b>Activity strip</b> = a plain count of dated, sourced items per lab and month (timeline, news, model release dates, economics facts), with near-duplicate entries on the same day merged. It is a count, not a score or a judgment of importance.</p>
<p><b>Estimates</b> (Nov 10, 2026 – Feb 10, 2027) are hatched and labeled ESTIMATE, not a fact. They come from the dataset's forecast items, each with reasoning and a confidence label.</p>
<p><b>Beneath the Surface</b> compares a dated public claim with a later observed signal, both sourced. The gap score (0–10) is analytic judgment.</p>
<p><b>Compute &amp; chips</b> lists dataset items that mention compute, chips or infrastructure. The dataset has no US–China export-control items; a short, clearly labeled cross-reference from the sibling World Situation Room is shown for context only.</p>
<p><b>HQ locations</b> are public reference locations, not part of the dataset.</p>
<p><b>X posts</b> appear as linked cards (author, date, snippet) once X Posts provides a posts file; no embeds. The panel is hidden until then.</p>
<button class="tbtn" onclick="document.getElementById('modal').classList.remove('open')">Close</button>`;

// ---------- init ----------
$('#heat').innerHTML = heatTable();
if(window.innerWidth < 700) $('#heatBox').open = false;
V.renderCompare(); if(window.BM) BM.render(); V.renderCompute(); renderTimeline(); renderBts();
const pst = {mode:'solo', lab:'openai', range:'recent', bench:null};
// URL hooks: ?v=dash|compare|timeline|bts|compute &exp=<lab>|all &cats=models,econ &labs=openai,xai &sort=gap &meth=1
const q = new URLSearchParams(location.search);
if(q.has('cats')) state.cats = new Set(q.get('cats').split(','));
if(q.has('labs')) state.labs = new Set(q.get('labs').split(','));
if(q.has('sort')){ state.sort = q.get('sort'); $('#sortSel').value = state.sort; }
if(q.get('exp') === 'all') U.LABS.forEach(l => state.open.add(l.id)); else if(q.has('exp')) state.open.add(q.get('exp'));
if(q.has('pm')) pst.mode = q.get('pm'); if(q.has('plab')) pst.lab = q.get('plab'); if(q.has('range')) pst.range = q.get('range'); if(q.has('bench')) pst.bench = q.get('bench');
window.P.render(pst);
syncChips(); renderGrid();
if(q.has('v')) setView(q.get('v'));
// tab anchors: #delivery (or any #dd-<section>) opens the Agent-Driven Delivery tab
const hashView = () => { const h = location.hash.slice(1); if(!h) return; const v = h.startsWith('dd-') ? 'delivery' : h; if(document.getElementById('v-' + v)){ setView(v); if(h.startsWith('dd-')) setTimeout(() => { const t = document.getElementById(h); if(t) window.scrollTo(0, t.getBoundingClientRect().top + window.scrollY - document.getElementById('top').offsetHeight - 8); }, 0); } };
hashView(); window.addEventListener('hashchange', hashView);
if(q.has('meth')) $('#modal').classList.add('open');
window.__ready = true;
})();
