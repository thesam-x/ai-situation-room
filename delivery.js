// Agent-Driven Delivery tab. Editorial text comes from data/delivery-brief.js; every date, price,
// score and source link is read from the dataset (data/ai-data.js) so nothing is typed twice.
(function(){
const U = window.U, D = window.AID, B = window.DELIVERY_BRIEF, HQ = window.HQ, esc = U.esc;
if(!B) return;
const UNK = '<span class="unkb">UNKNOWN</span>';
const findModel = (lab, name) => (D.labs[lab] && D.labs[lab].models.find(m => m.name.startsWith(name))) || null;
const findNews = (lab, match) => (D.labs[lab] && D.labs[lab].recent_news.find(n => n.headline.includes(match))) || null;
const link = (url, name) => url ? `<a href="${esc(url)}" target="_blank" rel="noopener">${esc(name || 'source')} ↗</a>` : UNK;
const labTag = lab => `<span class="dlab" style="--c:${HQ[lab].color}">${esc(U.SHORT[lab])}</span>`;
const unknowns = [];
const markUnknown = what => { unknowns.push(what); return UNK; };

function relInfo(row){
  if(row.src && row.src.kind === 'news'){ const n = findNews(row.lab, row.src.match); return n ? {date: n.date, url: n.source_url, name: n.source_name, q: n.qualifier} : null; }
  const m = findModel(row.lab, row.model); const r = m && m.release_date;
  if(!r || U.isUnknown(r.value) || !r.date) return null;
  return {date: r.date, url: r.source_url, name: r.source_name, q: r.qualifier};
}
function sec(id, n, title, inner, sub){ return `<section class="dsec" id="dd-${id}"><h3><span class="dn">${n}</span>${title}</h3>${sub ? `<div class="sub">${sub}</div>` : ''}${inner}</section>`; }

function modelTable(){
  const rows = B.modelUpdates.map(r => {
    const i = relInfo(r), m = findModel(r.lab, r.model), unkDate = !i || (m && U.isUnknown(m.release_date && m.release_date.value));
    const dateCell = i ? U.fmtD(i.date) : markUnknown(`${r.model}: release date`);
    const relCell = (r.src && m && U.isUnknown(m.release_date && m.release_date.value)) ? `<div class="d">Release date: ${markUnknown(`${r.model}: public release date`)}</div>` : '';
    return `<tr><td data-l="Release">${labTag(r.lab)}<div class="dm">${esc(m ? m.name : r.model)}</div><div class="d">${dateCell}</div>${relCell}</td>
      <td data-l="What shipped">${esc(r.shipped)}</td><td data-l="Delivery effect">${esc(r.effect)}</td>
      <td data-l="Confidence"><span class="conf ${r.confidence.toLowerCase()}">${esc(r.confidence)}</span><div class="d">${esc(r.why)}</div></td>
      <td data-l="Source">${i ? link(i.url, i.name) + U.rep(i.q) : UNK}</td></tr>`;
  }).join('');
  return `<div class="dtbl"><table class="cmp dtable"><thead><tr><th>Release</th><th>What shipped</th><th>Delivery effect</th><th>Confidence</th><th>Source</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

function capability(){
  const BENCH = (window.P && window.P.BENCH) || [];
  const cards = B.capabilityWatch.map(name => {
    const pts = BENCH.filter(b => b.benchmark === name && b.date).sort((a,b) => a.date.localeCompare(b.date));
    const num = pts.filter(p => p.pct != null);
    const leader = num.slice().sort((a,b) => b.pct - a.pct)[0];
    const moves = num.map(p => { const prev = num.filter(x => x.lab === p.lab && x.date < p.date).pop(); return prev ? {p, prev, d: Math.round((p.pct - prev.pct)*10)/10} : null; }).filter(Boolean);
    const labs = new Set(pts.map(p => p.lab)), missing = U.LABS.filter(l => !labs.has(l.id)).map(l => U.SHORT[l.id]);
    if(missing.length) unknowns.push(`${name}: no score for ${missing.join(', ')}`);
    return `<div class="dcard"><h4>${esc(name)}</h4>
      ${leader ? `<div class="lead2">Leader in dataset: ${labTag(leader.lab)} <b>${esc(leader.model)}</b> · <b class="big">${esc(leader.score)}</b> <span class="d">${U.fmtD(leader.date)}</span> ${link(leader.source_url, leader.source_name)}</div>` : `<div>Leader: ${UNK}</div>`}
      <table class="mini"><tbody>${pts.map(p => `<tr><td>${labTag(p.lab)}</td><td>${esc(p.model)}</td><td class="r"><b>${esc(p.score)}</b></td><td class="d">${U.fmtD(p.date)}</td><td>${link(p.source_url, p.source_name)}</td></tr>`).join('')}</tbody></table>
      <div class="dmv"><b>Moves:</b> ${moves.length ? moves.map(x => `${esc(U.SHORT[x.p.lab])} ${x.d >= 0 ? '+' : ''}${x.d} pts (${esc(x.prev.model)} ${esc(x.prev.score)} → ${esc(x.p.model)} ${esc(x.p.score)}, ${U.fmtD(x.p.date)})`).join('; ') : 'no same-lab repeat scores in the dataset'}</div>
      <div class="d">No score in dataset (unknown): ${esc(missing.join(', ') || '—')}</div>
      ${B.capabilityNotes && B.capabilityNotes[name] ? `<div class="d">${esc(B.capabilityNotes[name])}</div>` : ''}</div>`;
  }).join('');
  return `<div class="caveat">⚠ ${esc(B.capabilityCaveat)}</div><div class="dgrid">${cards}</div>`;
}

function lifecycle(){ return `<div class="dlife">${B.lifecycle.map((s, i) => `<div class="dstage"><div class="ds-n">${i+1}</div><h4>${esc(s.stage)}</h4><p>${esc(s.note)}</p></div>`).join('')}</div>`; }
function governance(){ return `<div class="dnote">Guidance for delivery teams, not sourced data. Adapt to your quality system.</div><div class="dgrid">${B.governance.map(g => `<div class="dcard"><h4>${esc(g.area)}</h4><ul>${g.items.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>`).join('')}</div>`; }

function cost(){
  const rows = B.costModels.map(c => {
    const m = findModel(c.lab, c.model), f = m && m.pricing_per_million_tokens_usd;
    let price, src = '';
    if(!m){ price = markUnknown(`${c.model}: model not in dataset`); }
    else if(!f){ price = markUnknown(`${m.name}: API price`) + ' <span class="d">not in dataset</span>'; }
    else if(U.isUnknown(f.value)){ price = markUnknown(`${m.name}: API price`) + (f.note ? `<div class="d">${esc(f.note)}</div>` : ''); }
    else { price = esc(U.val(f.value)) + (f.note ? `<div class="d">${esc(f.note)}</div>` : ''); src = `${U.fmtD(f.date)} · ${link(f.source_url, f.source_name)}${U.rep(f.qualifier)}`; }
    return `<tr><td data-l="Model">${labTag(c.lab)}<div class="dm">${esc(m ? m.name : c.model)}</div></td><td data-l="List price per 1M tokens (USD)">${price}</td><td data-l="Date · source">${src || UNK}</td></tr>`;
  }).join('');
  return `<div class="dtbl"><table class="cmp dtable"><thead><tr><th>Model</th><th>List price per 1M tokens (USD)</th><th>Date · source</th></tr></thead><tbody>${rows}</tbody></table></div>
    <ul class="dlist">${B.costNotes.map(n => `<li>${esc(n)}</li>`).join('')}</ul>`;
}
function twi(){
  const col = (cls, t, list) => `<div class="dcard twi ${cls}"><h4>${t}</h4><ul>${list.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>`;
  return `<div class="dgrid three">${col('try', 'Try', B.tryList)}${col('watch', 'Watch', B.watchList)}${col('ignore', 'Ignore (for now)', B.ignoreList)}</div>`;
}
function outlook(){
  const all = Object.values(D.forecast.items_by_lab).flat();
  return `<div class="fcbox"><div class="lbl">3-MONTH OUTLOOK · ${esc(D.forecast.horizon)} · ESTIMATE, NOT A FACT</div></div>` + B.outlook.map(o => {
    const f = all.find(x => x.lab === o.lab && x.title === o.title);
    if(!f) return '';
    return `<div class="fcbox"><div class="lbl">ESTIMATE · confidence: ${esc(f.confidence)}</div>${labTag(o.lab)} <b>${esc(f.title)}</b><div class="d">${esc(f.estimate)}</div><div class="dimp"><b>Delivery implication (estimate):</b> ${esc(o.implication)}</div></div>`;
  }).join('');
}

(B.extraUnknowns || []).forEach(u => unknowns.push(u));
const hs = B.headlineSources.map(s => { const m = findModel(s.lab, s.model), r = m && m.release_date; return r ? `${esc(m.name)}: ${U.fmtD(r.date)} · ${link(r.source_url, r.source_name)}` : ''; }).filter(Boolean).join(' &nbsp;|&nbsp; ');
const toc = [['headline','Headline'],['models','Model updates'],['capability','Agent capability watch'],['lifecycle','Lifecycle impact'],['governance','SDLC & governance'],['cost','Cost & economics'],['twi','Try / Watch / Ignore'],['outlook','3-month outlook']];
const body =
  sec('models', 2, 'Model updates that affect delivery', modelTable(), 'Release dates and links come from the dataset. Benchmarks quoted are company-reported.') +
  sec('capability', 3, 'Agent capability watch', capability()) +
  sec('lifecycle', 4, 'Delivery lifecycle impact', lifecycle(), 'Qualitative notes; no measured effect sizes are available in the dataset.') +
  sec('governance', 5, 'SDLC &amp; governance', governance()) +
  sec('cost', 6, 'Cost &amp; economics', cost(), 'List prices only, from the dataset. Unknowns stay unknown.') +
  sec('twi', 7, 'Try / Watch / Ignore', twi()) +
  sec('outlook', 8, '3-month outlook', outlook());
document.getElementById('v-delivery').innerHTML = `<div class="dhead"><div><h2>Agent-Driven Delivery · weekly brief</h2><div class="sub">${esc(B.weekLabel)} · data as of ${esc(B.asOf)} · for teams delivering software with AI agents</div></div>
  <nav class="dtoc">${toc.map(([id,t]) => `<a href="#dd-${id}" data-dd="${id}">${t}</a>`).join('')}</nav></div>
  <section class="dsec dheadline" id="dd-headline"><h3><span class="dn">1</span>Headline</h3><p class="hl">${esc(B.headline)}</p><div class="d">${hs}</div></section>${body}
  <details class="dsec"><summary>Items marked unknown in this brief (${unknowns.length})</summary><ul class="dlist">${unknowns.map(u => `<li>${esc(u)}</li>`).join('')}</ul></details>`;
document.querySelectorAll('[data-dd]').forEach(a => a.onclick = e => { e.preventDefault(); const t = document.getElementById('dd-' + a.dataset.dd); if(t) window.scrollTo({top: t.getBoundingClientRect().top + window.scrollY - (document.getElementById('top').offsetHeight + 8), behavior: 'smooth'}); });
window.DELIVERY_UNKNOWNS = unknowns;
})();
