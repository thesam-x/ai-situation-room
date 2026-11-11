// Model progression: standalone lineage per lab, and all labs on a shared axis + benchmark step chart.
// Uses only dated, sourced items from the dataset. No scores are inferred.
(function(){
const U = window.U, D = window.AID, HQ = window.HQ, esc = U.esc, P = {};
const AS_OF = D.meta.as_of;
const day = s => Date.parse(s + 'T00:00:00Z') / 864e5;
const base = s => String(s).replace(/\s*\(.*$/, '').trim();
const parts = name => String(name).split(/\s+\/\s+|,\s+/).map(base).filter(Boolean);
const FAMILY = [[/^Claude/i,'anthropic'],[/^GPT/i,'openai'],[/^Grok/i,'xai'],[/^Gemini/i,'google_deepmind'],[/^Mistral/i,'mistral'],[/^(Muse|Llama)/i,'meta'],[/^DeepSeek/i,'deepseek'],[/^Qwen/i,'alibaba_qwen']];
const labOfModel = (name, fallback) => { for(const [rx, id] of FAMILY) if(rx.test(name)) return id; return fallback; };
const num = s => { const m = String(s).match(/^\s*(-?[\d.,]+)\s*%/); return m ? parseFloat(m[1].replace(/,/g,'')) : null; };
// all benchmark entries, attributed to the lab whose model was measured; exact duplicates merged
const BENCH = []; const seen = new Set();
const ALLB = U.LABS.flatMap(l => l.benchmarks.map(b => Object.assign({lab: labOfModel(b.model, l.id), reportedBy: l.id, pct: num(b.score)}, b)));
ALLB.sort((a,b) => (a.lab === a.reportedBy ? 0 : 1) - (b.lab === b.reportedBy ? 0 : 1)).forEach(b => {
  const k = [b.lab, b.benchmark, b.score, b.date].join('|'); if(seen.has(k)) return; seen.add(k); BENCH.push(b);
});
P.BENCH = BENCH;
const modelOf = (lab, bmodel) => { // longest matching model name part within the lab
  let best = null, bl = 0; const bb = base(bmodel);
  D.labs[lab].models.forEach(m => parts(m.name).forEach(p => { if(bb.startsWith(p) && p.length > bl){ best = m; bl = p.length; } }));
  return best;
};
const relD = m => m.release_date && m.release_date.date && !U.isUnknown(m.release_date.value) ? m.release_date.date : null;
const shortName = n => base(String(n).split(' / ')[0]).replace(/^DeepSeek-/, 'DS-');
const prevEntry = b => BENCH.filter(x => x.lab === b.lab && x.benchmark === b.benchmark && x.date && b.date && x.date < b.date).sort((a,c) => c.date.localeCompare(a.date))[0];
function delta(b){
  const p = prevEntry(b);
  if(!p) return '<span class="dl na">Δ unknown · no earlier score on this benchmark in dataset</span>';
  if(b.pct == null || p.pct == null) return `<span class="dl na">earlier: ${esc(p.model)} ${esc(p.score)} (${U.fmtD(p.date)}) · not numerically comparable</span>`;
  const d = Math.round((b.pct - p.pct)*10)/10;
  return `<span class="dl ${d >= 0 ? 'up' : 'down'}">${d >= 0 ? '▲ +' : '▼ '}${d} pts vs ${esc(p.model)} (${esc(p.score)}, ${U.fmtD(p.date)})</span>`;
}

// ---------- Parity (independent matrix) ----------
const BMX = () => window.BM;
const parityRows = (lab, m) => BMX() ? BMX().data.rows.filter(r => r.lab === lab && BMX().datasetModel(lab, r.model) === m) : [];
const parity = (lab, m) => { const rs = parityRows(lab, m); return rs.length ? `<div class="pgwrap">${rs.map(r => BMX().modelGrid(r)).join('')}</div>` : (BMX() ? `<div class="d pgnone">Independent benchmarks: n/r (no entry in the parity matrix)</div>` : ''); };
// ---------- Standalone ----------
function solo(lab){
  const l = D.labs[lab], h = HQ[lab];
  const ms = l.models.slice().sort((a,b) => { const x = relD(a), y = relD(b); if(!x && !y) return 0; if(!x) return 1; if(!y) return -1; return x.localeCompare(y); });
  const bs = BENCH.filter(b => b.lab === lab);
  const byModel = new Map(); const orphan = [];
  bs.forEach(b => { const m = modelOf(lab, b.model); if(m){ if(!byModel.has(m)) byModel.set(m, []); byModel.get(m).push(b); } else orphan.push(b); });
  const node = (m, i) => { const r = m.release_date || {}, d = relD(m), list = (byModel.get(m) || []).sort((a,b) => String(a.date).localeCompare(String(b.date)));
    return `<div class="lnode ${d ? '' : 'undated'}" style="--c:${h.color}"><div class="ldate">${d ? U.fmtD(d) : '<span class="unkb">DATE UNKNOWN</span>'}</div>
     <div class="lbody"><div class="lname">${esc(m.name)}<span class="st ${esc(m.status)}">${esc(U.pretty(m.status))}</span></div>
     <div class="d">Tier: <b>${esc(U.pretty(m.role))}</b>${r.source_url ? ` · <a href="${esc(r.source_url)}" target="_blank" rel="noopener">${esc(r.source_name || 'source')} ↗</a>` : ''}${d && r.value && r.value !== d ? ` · <span>${esc(r.value)}</span>` : ''}</div>
     ${parity(lab, m)}
     ${list.length ? `<details class="vend"><summary>Vendor-reported (not comparable) · ${list.length}</summary><div class="lbench">${list.map(b => `<div class="lb"><span>${esc(b.benchmark)}${b.model !== m.name ? ` <span class="d">· ${esc(b.model)}</span>` : ''}</span><b>${U.isUnknown(b.score) ? '<span class="unkb">UNKNOWN</span>' : esc(b.score)}</b><div class="lbm">${delta(b)} · ${U.fmtD(b.date)}${b.source_url ? ` · <a href="${esc(b.source_url)}" target="_blank" rel="noopener">${esc(b.source_name || 'source')} ↗</a>` : ''}${b.reportedBy !== lab ? ` <span class="rep">REPORTED BY ${esc(U.SHORT[b.reportedBy].toUpperCase())}</span>` : ''}</div></div>`).join('')}</div></details>` : ''}</div></div>`; };
  return `<div class="lineage">${ms.map(node).join('')}</div>${orphan.length ? `<details class="vend box2" style="margin-top:10px"><summary>Vendor-reported scores not matched to a listed model (not comparable) · ${orphan.length}</summary>${orphan.map(b => `<div class="fact">${esc(b.benchmark)} · ${esc(b.model)}: <b>${esc(b.score)}</b> ${U.src(b.source_url, b.source_name, b.date)}</div>`).join('')}</details>` : ''}`;
}

// ---------- Vs others: swimlanes ----------
function lanes(range){
  const start = range === 'all' ? '2025-04-01' : '2026-03-01', end = '2026-11-30';
  const s0 = day(start), s1 = day(end), PXD = range === 'all' ? 1.9 : 3.6, W = Math.round((s1 - s0) * PXD) + 40;
  const x = d => 20 + (day(d) - s0) * PXD;
  let ticks = ''; for(let y = +start.slice(0,4), mo = +start.slice(5,7); ; ){ const k = `${y}-${String(mo).padStart(2,'0')}-01`; if(k > end) break;
    ticks += `<div class="sw-tick" style="left:${x(k)}px">${U.fmtD(k.slice(0,7))}</div>`; mo++; if(mo > 12){ mo = 1; y++; } }
  const nowX = x(AS_OF);
  const rows = U.LABS.map(l => {
    const ms = l.models.filter(relD).sort((a,b) => relD(a).localeCompare(relD(b)));
    const inR = ms.filter(m => relD(m) >= start), early = ms.filter(m => relD(m) < start), und = l.models.filter(m => !relD(m));
    const rowEnd = []; // greedy label rows to avoid overlap
    const marks = inR.map(m => { const px = x(relD(m)), w = 26 + (shortName(m.name).length + 12) * 6.9; let r = rowEnd.findIndex(e => e < px - 4); if(r < 0){ r = rowEnd.length; rowEnd.push(0); } rowEnd[r] = px + w;
      const r0 = m.release_date; return `<a class="sw-m" href="${esc(r0.source_url || '#')}" target="_blank" rel="noopener" title="${esc(m.name)} · ${esc(U.pretty(m.role))} · released ${U.fmtD(relD(m))} · ${esc(r0.source_name || '')}" style="left:${px}px;top:${6 + r*34}px"><i></i><span class="n">${esc(shortName(m.name))}</span><span class="dt">${U.fmtD(relD(m))}</span></a>`; }).join('');
    const H = Math.max(1, rowEnd.length) * 34 + 12;
    return `<div class="sw-row" style="--c:${HQ[l.id].color}"><div class="sw-lab"><b>${esc(U.SHORT[l.id])}</b>${early.length ? `<div class="d">earlier: ${early.map(m => `${esc(shortName(m.name))} (${U.fmtD(relD(m))})`).join(', ')}</div>` : ''}${und.length ? `<div class="d">date unknown: ${und.map(m => esc(shortName(m.name))).join(', ')}</div>` : ''}</div><div class="sw-lane" style="width:${W}px;height:${H}px"><div class="sw-nl" style="left:${nowX}px"></div>${marks}</div></div>`;
  }).join('');
  return `<div class="sw"><div class="sw-axis-row"><div class="sw-lab"></div><div class="sw-axis" style="width:${W}px">${ticks}<div class="sw-now" style="left:${nowX}px">NOW · Nov 10</div></div></div>${rows}</div>`;
}

// ---------- Vs others: benchmark step chart ----------
P.chartBenchesVendor = () => { const c = {}; BENCH.forEach(b => { if(b.pct != null && b.date){ (c[b.benchmark] = c[b.benchmark] || new Set()).add(b.lab); } }); return Object.entries(c).filter(([,s]) => s.size >= 2).sort((a,b) => b[1].size - a[1].size).map(([k]) => k); };
P.chartBenches = () => BMX() ? BMX().PCOLS.map(c => c.key) : P.chartBenchesVendor();
const colOf = k => BMX() && BMX().PCOLS.find(c => c.key === k);
P.benchLabel = k => { const c = colOf(k); return c ? c.label : k; };
function parityPts(key){
  const col = colOf(key), out = [], undated = [];
  BMX().data.rows.forEach(r => { const c = r.cells[key]; if(!c) return; const m = BMX().datasetModel(r.lab, r.model), d = m && relD(m);
    const p = {lab: r.lab, reportedBy: r.lab, model: r.model, date: d, pct: c.v, score: BMX().fmt(c, col), source_name: col.kind === 'leaderboard' ? 'Leaderboard via Epoch AI' : 'Epoch AI', source_url: c.src || col.src};
    d ? out.push(p) : undated.push(p); });
  return {col, pts: out.sort((a,b) => a.date.localeCompare(b.date)), undated};
}
function chart(bench){
  const PP = colOf(bench) ? parityPts(bench) : null, col = PP && PP.col, unit = col ? col.unit : '%';
  const pts = PP ? PP.pts : BENCH.filter(b => b.benchmark === bench && b.pct != null && b.date).sort((a,b) => a.date.localeCompare(b.date));
  if(!pts.length) return '<div class="note">No dated scores for this benchmark.</div>';
  const minD = day(pts[0].date) - 20, maxD = day(AS_OF) + 6, W = 760, H = 300, L = 46, R = 16, T = 14, B = 34;
  const ys = pts.map(p => p.pct), STEP = unit === 'Elo' ? 100 : unit === 'index' ? 5 : 10, lo = unit === '%' ? Math.max(0, Math.floor((Math.min(...ys) - 10)/10)*10) : Math.floor((Math.min(...ys) - STEP/2)/STEP)*STEP, hi = unit === '%' ? Math.min(100, Math.ceil((Math.max(...ys) + 10)/10)*10) : Math.ceil((Math.max(...ys) + STEP/2)/STEP)*STEP;
  const uLbl = v => unit === '%' ? `${v}%` : `${v}`;
  const X = d => L + (day(d) - minD) / (maxD - minD) * (W - L - R), Y = v => T + (hi - v) / (hi - lo) * (H - T - B);
  let g = '';
  for(let v = lo; v <= hi; v += STEP) g += `<line x1="${L}" x2="${W-R}" y1="${Y(v)}" y2="${Y(v)}" class="gl"/><text x="${L-6}" y="${Y(v)+4}" class="ax" text-anchor="end">${uLbl(v)}</text>`;
  const t0 = new Date((minD) * 864e5); for(let y = t0.getUTCFullYear(), mo = t0.getUTCMonth() + 2; ; mo++){ if(mo > 12){ mo = 1; y++; } const k = `${y}-${String(mo).padStart(2,'0')}-01`; if(day(k) > maxD) break; g += `<line x1="${X(k)}" x2="${X(k)}" y1="${T}" y2="${H-B}" class="gl"/><text x="${X(k)}" y="${H-B+16}" class="ax" text-anchor="middle">${U.fmtD(k.slice(0,7))}</text>`; }
  g += `<line x1="${X(AS_OF)}" x2="${X(AS_OF)}" y1="${T}" y2="${H-B}" class="nowl"/><text x="${X(AS_OF)-4}" y="${T+10}" class="nowt" text-anchor="end">Nov 10</text>`;
  const labs = [...new Set(pts.map(p => p.lab))]; let lines = '', dots = '';
  labs.forEach(lab => {
    const ps = pts.filter(p => p.lab === lab), c = HQ[lab].color; let d = '';
    ps.forEach((p, i) => { d += (i ? ` H${X(p.date)} V${Y(p.pct)}` : `M${X(p.date)} ${Y(p.pct)}`); });
    lines += `<path d="${d}" class="stp" style="stroke:${c}"/><path d="M${X(ps[ps.length-1].date)} ${Y(ps[ps.length-1].pct)} H${X(AS_OF)}" class="stp hold" style="stroke:${c}"/>`;
    ps.forEach(p => { dots += `<g><circle cx="${X(p.date)}" cy="${Y(p.pct)}" r="5" style="fill:${c}"/><title>${esc(U.SHORT[lab])} · ${esc(p.model)} · ${esc(p.score)} · ${U.fmtD(p.date)} · ${esc(p.source_name)}</title></g><text x="${X(p.date)+7}" y="${Y(p.pct)-7}" class="pl" style="fill:${c}">${esc(shortName(p.model))} ${esc(p.score)}</text>`; });
  });
  // leader changes
  let leader = null, best = -1; const changes = [];
  pts.forEach(p => { if(p.pct > best){ if(p.lab !== leader) changes.push(p); leader = p.lab; best = p.pct; } });
  const missing = U.LABS.filter(l => !labs.includes(l.id)).map(l => U.SHORT[l.id]);
  return `<svg viewBox="0 0 ${W} ${H}" class="bchart" role="img" aria-label="${esc(P.benchLabel(bench))} scores over time">${g}${lines}${dots}</svg>
   <div class="legend2">${labs.map(lab => `<span><i style="background:${HQ[lab].color}"></i>${esc(U.SHORT[lab])}</span>`).join('')}<span class="d">${PP ? 'x = model release date, y = independent score (same harness for every model). Solid step = newer model; dashed = latest score held until Nov 10.' : 'Solid step = reported score; dashed = latest reported score held until Nov 10 (no new score in dataset).'}</span></div>
   <div class="lead"><b>Leader over time:</b> ${changes.map(p => `${esc(U.SHORT[p.lab])} (${esc(p.model)}, ${esc(p.score)}, ${U.fmtD(p.date)})`).join(' → ')}</div>
   <div class="d">n/r (no score) for: ${esc(missing.join(', ')) || '—'} (not zero).${PP && PP.undated.length ? ` Scored but release date unknown, not plotted: ${esc(PP.undated.map(p => `${p.model} ${p.score}`).join(', '))}.` : ''}</div>
   <table class="ptable"><thead><tr><th>${PP ? 'Released' : 'Date'}</th><th>Lab</th><th>Model</th><th>Score</th><th>Source</th></tr></thead><tbody>${pts.map(p => `<tr><td>${U.fmtD(p.date)}</td><td><span style="color:${HQ[p.lab].color}">●</span> ${esc(U.SHORT[p.lab])}</td><td>${esc(p.model)}</td><td><b>${esc(p.score)}</b></td><td><a href="${esc(p.source_url)}" target="_blank" rel="noopener">${esc(p.source_name)} ↗</a>${p.reportedBy !== p.lab ? ` <span class="rep">VIA ${esc(U.SHORT[p.reportedBy].toUpperCase())}</span>` : ''}</td></tr>`).join('')}</tbody></table>`;
}

P.render = (st) => {
  const el = document.getElementById('v-prog'), benches = P.chartBenches();
  st.bench = benches.includes(st.bench) ? st.bench : benches[0];
  el.innerHTML = `<h2>Model progression</h2>
   <div class="sub">Model lineage from dated, sourced release entries in the dataset. Undated models are marked date unknown. Scores are not inferred.</div>
   <div class="caveat">Benchmarks here use the independent parity matrix only (Epoch AI harness or public leaderboards; same rows for every model, n/r when not reported). Vendor-reported scores are collapsed under each model and are not comparable.</div>
   <div class="toolbar"><div class="seg2" id="pmode"><button data-m="solo" class="${st.mode==='solo'?'on':''}">Standalone</button><button data-m="vs" class="${st.mode==='vs'?'on':''}">Vs others</button></div>
   ${st.mode === 'solo' ? `<div class="chips">${U.LABS.map(l => `<button class="chip ${l.id===st.lab?'on':''}" data-plab="${l.id}" style="--c:${HQ[l.id].color}"><span class="sw"></span>${esc(U.SHORT[l.id])}</button>`).join('')}</div>`
     : `<div class="seg2" id="prange"><button data-r="recent" class="${st.range!=='all'?'on':''}">Since Mar 2026</button><button data-r="all" class="${st.range==='all'?'on':''}">All dated models</button></div>`}</div>
   ${st.mode === 'solo' ? solo(st.lab) : `<h3 class="h3">Release swimlanes <span class="d">(marker = dated release · click opens source · scroll sideways →)</span></h3>${lanes(st.range)}
     <h3 class="h3" style="margin-top:16px">Benchmark progression</h3>
     <div class="toolbar"><span class="tl">Benchmark</span><div class="chips">${benches.map(b => `<button class="chip ${b===st.bench?'on':''}" data-bench="${esc(b)}">${esc(P.benchLabel(b))}</button>`).join('')}</div></div>
     <div class="d" style="margin-bottom:6px">Same fixed benchmark set as the Dashboard cards and Compare table; each point is one model's independent score.</div>
     <div class="chartwrap">${chart(st.bench)}</div>`}`;
  const sw = el.querySelector('.sw'); if(sw) requestAnimationFrame(() => { sw.scrollLeft = sw.scrollWidth; });
  el.querySelectorAll('#pmode button').forEach(b => b.onclick = () => { st.mode = b.dataset.m; P.render(st); });
  el.querySelectorAll('#prange button').forEach(b => b.onclick = () => { st.range = b.dataset.r; P.render(st); });
  el.querySelectorAll('[data-plab]').forEach(b => b.onclick = () => { st.lab = b.dataset.plab; P.render(st); });
  el.querySelectorAll('[data-bench]').forEach(b => b.onclick = () => { st.bench = b.dataset.bench; P.render(st); });
};
window.P = P;
})();
