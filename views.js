// Lab cards, comparison table, compute section, lab panel tab bodies.
(function(){
const U = window.U, D = window.AID, esc = U.esc, V = {};
const ECON = [['revenue','Revenue'],['latest_funding','Latest funding'],['valuation','Valuation'],['ipo_status','IPO status'],['usage_metrics','Usage'],['users','Users'],['profitability','Profitability'],['commercial_footprint','Commercial footprint']];
V.models = l => l.models.map(m => {
  const r = m.release_date || {};
  const extra = [['api_id','API id'],['params','Parameters'],['context_window','Context'],['pricing_per_million_tokens_usd','Price per 1M tokens (USD)']].filter(([k]) => m[k]).map(([k,n]) => U.fact(m[k], n)).join('');
  return `<div class="fact"><b style="color:var(--heading)">${esc(m.name)}</b><span class="st ${esc(m.status)}">${esc(U.pretty(m.status))}</span> <span class="d">${esc(U.pretty(m.role))}</span>
   <div>Release: ${U.isUnknown(r.value) ? '<i>unknown</i>' : esc(U.val(r.value))} · ${U.src(r.source_url, r.source_name)}</div>${m.notes ? `<div class="d">${esc(m.notes)}</div>` : ''}
   ${extra ? `<details><summary>details</summary>${extra}</details>` : ''}</div>`;
}).join('');
V.bench = l => (window.BM ? BM.parityList(l.id) : '') +
  (window.BM ? BM.vendorDetails(l.benchmarks, b => `<div class="fact ${U.isUnknown(b.score)?'unk':''}"><b>${esc(b.benchmark)}</b> · ${esc(b.model)}: <b style="color:var(--heading)">${esc(b.score)}</b><div>${U.src(b.source_url, b.source_name, b.date)}</div>${b.note ? `<div class="d">${esc(b.note)}</div>` : ''}</div>`) : '');
V.econ = l => ECON.filter(([k]) => l.economics[k]).map(([k,n]) => U.fact(l.economics[k], n)).join('');
V.features = l => l.features.map(f => U.fact(f)).join('') || '<div class="fact unk">None listed.</div>';
V.products = l => l.products_and_devices.map(p => `<div class="fact ${U.isUnknown(p.status)?'unk':''}"><b>${esc(p.name)}</b> <span class="d">${esc(U.pretty(p.type||''))}</span><span class="st ${esc(p.status)}">${esc(U.pretty(p.status||''))}</span>${p.note ? `<div class="d">${esc(p.note)}</div>` : ''}<div>${U.src(p.source_url, p.source_url ? new URL(p.source_url).hostname.replace('www.','') : '', p.date)}</div></div>`).join('');
V.news = l => l.recent_news.slice().sort((a,b) => b.date.localeCompare(a.date)).map(n => `<div class="fact">${esc(n.headline)}${U.rep(n.qualifier)}<div>${U.src(n.source_url, n.source_name, n.date)}</div></div>`).join('');
V.outlook = l => `<div class="fcbox"><div class="lbl">3-MONTH OUTLOOK · ${esc(D.forecast.horizon)} · ESTIMATE, NOT A FACT</div></div>` + U.fc(l.id).map(f => `<div class="fcbox"><div class="lbl">${esc(f.label)} · confidence: ${esc(f.confidence)}</div><b style="color:var(--heading)">${esc(f.title)}</b><p style="margin:4px 0">${esc(f.estimate)}</p><div class="d" style="font-size:11px;color:var(--mut)">Reasoning: ${esc(f.reasoning)}</div>${(f.related_sources||[]).map(u => `<div style="font-size:10.5px"><a href="${esc(u)}" target="_blank" rel="noopener">${esc(new URL(u).hostname.replace('www.',''))} ↗</a></div>`).join('')}</div>`).join('');
V.btsOne = b => `<div class="bts-head"><div style="font-size:10px;letter-spacing:.12em;color:#e3c2ff;font-weight:700">◐ BENEATH THE SURFACE · ${esc(U.LABNAME[b.lab])}</div>
  <div class="gap"><div class="gl">GAP</div><div class="gb"><i style="left:calc(${b.gap_score*10}% - 2px)"></i></div><div class="gv">${b.gap_score}/10</div></div>
  <div class="gl" style="margin-top:2px;font-size:10px;color:var(--mut)">Gap meter = analytic judgment (${esc(b.gap_score_scale)}).</div>
  <div class="why"><b>Why:</b> ${esc(b.rationale)}</div></div>
  <div class="cols"><div class="col nar"><h5>📢 The Narrative</h5><div class="item"><div class="d">${U.fmtD(b.claim_date)}</div>${esc(b.claim)}<div class="s">${U.src(b.claim_source_url, b.claim_source_name)}</div></div></div>
  <div class="col gnd"><h5>🛰 Observed signal</h5><div class="item"><div class="d">${U.fmtD(b.observed_date)}</div>${esc(b.observed_signal)}<div class="s">${U.src(b.observed_source_url, b.observed_source_name)}</div></div></div></div>`;
V.bts = l => U.btsBy(l.id).map(V.btsOne).join('') || '<div class="note">No narrative-vs-reality item for this lab in the dataset.</div>';

// ---------- Comparison ----------
const cell = f => { f = U.first(f); if(!f) return '<i class="d">—</i>'; if(U.isUnknown(f.value)) return '<i class="d">unknown</i>';
  return `${esc(U.val(f.value))}${U.rep(f.qualifier)}<div>${U.src(f.source_url, f.source_name, f.date)}</div>`; };
V.renderCompare = () => {
  const L = U.LABS, row = (n, fn) => `<tr><td>${n}</td>${L.map(l => `<td>${fn(l)}</td>`).join('')}</tr>`;
  const latestRel = l => { const ms = l.models.filter(m => m.release_date && m.release_date.date && m.release_date.date >= '2026-05-10').sort((a,b) => b.release_date.date.localeCompare(a.release_date.date)); return ms.length ? `${esc(ms[0].name)}<div>${U.src(ms[0].release_date.source_url, ms[0].release_date.source_name, ms[0].release_date.date)}</div>` : '<i class="d">none in window</i>'; };
  const fl = l => { const m = U.flagship(l), r = m.release_date || {}; return `<b style="color:var(--heading)">${esc(m.name)}</b> <span class="st ${esc(m.status)}">${esc(U.pretty(m.status))}</span><div>${U.src(r.source_url, r.source_name, r.date)}</div>`; };
  const price = l => { const m = l.models.find(x => x.pricing_per_million_tokens_usd); return m ? `<span class="d">${esc(m.name)}</span><br>${cell(m.pricing_per_million_tokens_usd)}` : '<i class="d">—</i>'; };
  const vend = l => window.BM ? BM.vendorDetails(l.benchmarks, b => `<div>${esc(b.benchmark)}: <b style="color:var(--heading)">${esc(b.score)}</b> <span class="d">${esc(b.model)} · ${U.fmtD(b.date)}</span> <a href="${esc(b.source_url||'#')}" target="_blank" rel="noopener">↗</a></div>`) : '';
  const pRows = () => window.BM ? BM.PCOLS.map((col, i) => `<tr class="prow${i === 0 ? ' pfirst' : ''}"><td>${esc(col.label)}<div class="d">${i === 0 ? 'Independent · best model per lab' : (col.kind === 'leaderboard' ? 'Public leaderboard' : 'Epoch-run')}</div></td>${L.map(l => { const b = BM.labBest(l.id)[i];
      return `<td class="pc${b.cell ? '' : ' nr'}" title="${esc(b.cell ? BM.tip(b.cell, b.col, b.row) : 'Not reported for this lab')}"><b class="pbs">${BM.fmt(b.cell, b.col)}</b>${b.row ? `<div class="d">${esc(b.row.model)}</div>` : ''}</td>`; }).join('')}</tr>`).join('') : '';
  const hw = l => { const p = l.products_and_devices.filter(x => /device|hardware|speaker|glasses|wearable/i.test(x.type + ' ' + x.name)); return p.length ? p.map(x => `${esc(x.name)} <span class="st ${esc(x.status)}">${esc(U.pretty(x.status))}</span>`).join('<br>') : '<i class="d">none listed</i>'; };
  const gap = l => U.btsBy(l.id).map(b => `<div><span class="gapmini"><i style="width:${b.gap_score*10}%"></i></span><b>${b.gap_score}/10</b></div>`).join('') || '—';
  const fc = l => { const f = U.fc(l.id)[0]; return f ? `<span class="fcnote">ESTIMATE</span> ${esc(f.title)} <span class="d">(${esc(f.confidence)})</span>` : '—'; };
  document.getElementById('v-compare').innerHTML = `<h2>Lab comparison</h2><div class="sub">Side by side, from the same dataset. Each cell shows its date and source. Benchmark rows use only the independent parity matrix (same rows for every lab, best model per lab, n/r = not reported); vendor-reported scores are collapsed and not comparable.</div>
  <div class="tblwrap"><table class="cmp"><thead><tr><th></th>${L.map(l => `<th style="border-top:3px solid ${window.HQ[l.id].color}">${esc(l.name)}</th>`).join('')}</tr></thead><tbody>
  ${row('Parent / HQ', l => `${esc(l.parent)}<div class="d">${esc(window.HQ[l.id].city)}</div>`)}
  ${row('Flagship model', fl)}
  ${row('Latest release (May 10 – Nov 10)', latestRel)}
  ${row('Models tracked', l => l.models.length)}
  ${row('API price', price)}
  ${pRows()}
  ${row('Vendor-reported benchmarks', vend)}
  ${row('Revenue (latest listed)', l => cell(l.economics.revenue))}
  ${row('Latest funding', l => cell(l.economics.latest_funding))}
  ${row('Valuation', l => cell(l.economics.valuation))}
  ${row('IPO status', l => cell(l.economics.ipo_status))}
  ${row('Devices / hardware', hw)}
  ${row('Narrative gap(s)', gap)}
  ${row('Top 3-month estimate', fc)}
  </tbody></table></div>`;
};
// ---------- Compute & chips ----------
V.computeHits = () => {
  const rx = /\bcompute\b|Colossus|\bNVIDIA\b|\bGPUs?\b|\bTPUs?\b|\bchips?\b|datacenter|data center|AMD|TSMC|Broadcom|Micron|infrastructure/i, hits = [], seen = new Set();
  const push = (lab, label, text, date, url, name, q) => { const k = url + '|' + text.slice(0,60); if(seen.has(k)) return; seen.add(k); hits.push({lab, label, text, date, url, name, q}); };
  U.LABS.forEach(l => {
    Object.entries(l.economics).forEach(([k, e]) => (Array.isArray(e) ? e : [e]).forEach(f => { const t = U.val(f.value) + ' ' + (f.note || ''); if(rx.test(t)) push(l.id, U.pretty(k), t, f.date, f.source_url, f.source_name, f.qualifier); }));
    l.recent_news.forEach(n => { if(rx.test(n.headline)) push(l.id, 'news', n.headline, n.date, n.source_url, n.source_name, n.qualifier); });
    l.features.forEach(f => { if(/\bcompute\b|Colossus|\bNVIDIA\b|\bTPUs?\b|\bGPUs?\b/i.test(U.val(f.value))) push(l.id, 'feature', U.val(f.value), f.date, f.source_url, f.source_name); });
  });
  D.timeline.forEach(t => { if(rx.test(t.headline)) push(t.lab, 'timeline', t.headline, t.date, t.source_url, t.source_name, t.qualifier); });
  hits.sort((a,b) => String(b.date).localeCompare(String(a.date)));
  return hits;
};
V.renderCompute = () => {
  const hits = V.computeHits();
  document.getElementById('v-compute').innerHTML = `<h2>Compute, chips, data centers &amp; US–China export controls</h2>
  <div class="sub">Items below are pulled automatically from the dataset wherever compute, chip makers, GPUs/TPUs or infrastructure are mentioned.</div>
  <div class="compute-grid"><div class="box2"><h3>In the dataset (${hits.length} items)</h3>${hits.map(h => `<div class="fact"><span class="st" style="background:${window.HQ[h.lab].color}33">${esc(U.SHORT[h.lab])}</span> <span class="d">${esc(h.label)}</span><div>${esc(h.text)}${U.rep(h.q)}</div><div>${U.src(h.url, h.name, h.date)}</div></div>`).join('')}</div>
  <div><div class="box2"><h3>Coverage gaps</h3>
   <div class="gapnote"><b>US–China export controls:</b> no sourced items in this dataset. Nothing is shown as fact here.</div>
   <div class="gapnote"><b>Data-center buildouts:</b> no dedicated items in this dataset beyond the Colossus 1 compute agreement and Anthropic's disclosed compute and infrastructure commitments listed on the left.</div>
   <div class="gapnote"><b>Chip supply:</b> chip makers appear only as investors or distribution partners (e.g. NVIDIA in OpenAI's and xAI's rounds; AMD, Broadcom, Google, Micron, Microsoft, Nvidia and TSMC buying Anthropic's Class N private share sale; NVIDIA NIM for Mistral Large 4).</div></div>
   <div class="box2" style="margin-top:12px"><h3>Cross-reference: US–China context <span class="rep">FROM WORLD SITUATION ROOM</span></h3>
   <div class="d" style="font-size:11px;color:var(--mut);margin-bottom:6px">Not part of the AI dataset. Sourced items from the sibling World Situation Room page, shown for context only. None of them is an AI-chip export-control action.</div>
   ${window.WSR_XREF.map(x => `<div class="fact">${esc(x.headline)}<div>${U.src(x.source_url, x.source_name, x.date)}</div></div>`).join('')}</div></div></div>`;
};
window.V = V;
})();
