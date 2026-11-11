// Apples-to-apples benchmark table (Compare tab). Data: data/bench-matrix.js from tools/build-bench-matrix.py.
(function(){
const BM = window.BENCH_MATRIX, U = window.U, esc = U.esc;
if(!BM) return;
const st = {sort: 'eci', dir: -1, lab: 'all'};
const KIND = {independent: ['INDEPENDENT', 'Epoch ran every model on the same harness'], leaderboard: ['LEADERBOARD', 'Independent public leaderboard, same protocol for every model'], self: ['SELF-REPORTED', 'Vendor numbers from release posts; settings differ by vendor']};
const fmt = (c, col) => col.unit === 'Elo' || col.unit === 'index' ? c.v.toFixed(col.unit === 'Elo' ? 0 : 1) : `${c.v.toFixed(1)}%`;
const tip = (c, col, row) => [`${row.model} · ${col.label}`, col.setting, c.eff ? `Reasoning effort used: ${c.eff}` : (col.kind === 'self' ? 'Effort/harness: as chosen by the vendor' : 'Effort: not specified by the source'),
  c.se != null ? `± ${c.se} (standard error)` : '', c.lo != null ? `95% CI ${c.lo}–${c.hi}` : '', c.date ? `Date: ${c.date}` : '', c.srcName ? `Source: ${c.srcName}` : (c.src ? `Source: ${c.src}` : '')].filter(Boolean).join('\n');
function cell(row, col){
  const c = row.cells[col.key];
  if(!c) return `<td class="r nr" data-l="${esc(col.label)}" title="Not reported for this model in the source">n/r</td>`;
  const best = colBest[col.key] === c.v;
  const inner = `${fmt(c, col)}${c.eff && c.eff !== 'max' ? `<sup>${esc(c.eff)}</sup>` : ''}${c.self ? '<sup class="selfm" aria-label="self-reported">*</sup>' : ''}`;
  return `<td class="r${best ? ' best' : ''}" data-l="${esc(col.label)}" title="${esc(tip(c, col, row))}">${c.src && col.kind === 'self' ? `<a href="${esc(c.src)}" target="_blank" rel="noopener">${inner}</a>` : inner}</td>`;
}
let colBest = {};
function rowsSorted(){
  const list = BM.rows.filter(r => st.lab === 'all' || r.lab === st.lab);
  const key = st.sort;
  return list.sort((a,b) => {
    if(key === 'model') return st.dir * a.model.localeCompare(b.model);
    const va = a.cells[key]?.v, vb = b.cells[key]?.v;
    if(va == null && vb == null) return a.model.localeCompare(b.model);
    if(va == null) return 1; if(vb == null) return -1;   // n/r always last
    return st.dir === -1 ? vb - va : va - vb;
  });
}
function table(){
  colBest = {}; BM.columns.forEach(c => { const vs = BM.rows.map(r => r.cells[c.key]?.v).filter(v => v != null); colBest[c.key] = vs.length ? Math.max(...vs) : null; });
  const arrow = k => st.sort === k ? (st.dir === -1 ? ' ▼' : ' ▲') : '';
  const aria = k => st.sort === k ? (st.dir === -1 ? 'descending' : 'ascending') : 'none';
  const head = `<tr><th scope="col" aria-sort="${aria('model')}"><button type="button" class="sorth" data-bsort="model">Model${arrow('model')}</button></th>${BM.columns.map(c => `<th scope="col" class="r k-${c.kind}" aria-sort="${aria(c.key)}" title="${esc(c.label + ' — ' + c.setting)}"><button type="button" class="sorth" data-bsort="${c.key}">${esc(c.label)}${arrow(c.key)}</button><div class="kb ${c.kind}">${KIND[c.kind][0]}</div></th>`).join('')}</tr>`;
  const body = rowsSorted().map(r => `<tr><th scope="row" data-l="Model"><span class="dlab" style="--c:${(window.HQ && HQ[r.lab]) ? HQ[r.lab].color : 'var(--acc)'}">${esc(U.SHORT[r.lab] || r.lab)}</span> <span class="bmn">${esc(r.model)}</span></th>${BM.columns.map(c => cell(r, c)).join('')}</tr>`).join('');
  return `<table class="bmx"><thead>${head}</thead><tbody>${body}</tbody></table>`;
}
function draw(root){ root.querySelector('#bm-table').innerHTML = table(); root.querySelectorAll('[data-bsort]').forEach(b => b.onclick = () => { const k = b.dataset.bsort; if(st.sort === k) st.dir *= -1; else { st.sort = k; st.dir = k === 'model' ? 1 : -1; } draw(root); }); }
function render(){
  const host = document.getElementById('v-compare'); if(!host) return;
  let root = document.getElementById('bm-sec');
  if(!root){ root = document.createElement('section'); root.id = 'bm-sec'; root.className = 'bmsec'; host.prepend(root); }
  const labs = [...new Set(BM.rows.map(r => r.lab))];
  const nInd = BM.columns.filter(c => c.kind !== 'self').length;
  root.innerHTML = `<h2>Benchmarks · apples to apples</h2>
   <div class="sub">${BM.rows.length} models (every text model in the dataset) × ${BM.columns.length} benchmarks. Click a column header to sort; n/r = not reported and always sorts last. Hover a cell for its setting, effort, date and source.</div>
   <details class="bmnote"${innerWidth >= 700 ? ' open' : ''}><summary>How parity is enforced</summary><ul>
     <li><b>Same metric, same harness per column.</b> The first five columns are run by Epoch AI on its own harness for every model (same prompts, scorer and settings; mean accuracy across runs, pass@1-style, no tools unless Epoch's standard setup for that benchmark provides them). ARC-AGI-2 and WebDev Arena come from their independent public leaderboards via Epoch. ECI is Epoch's composite index (a scale, not a percentage).</li>
     <li><b>Same reasoning setting rule.</b> Each model is shown at the highest reasoning effort evaluated (max › xhigh › high …). A small superscript marks cells below "max" (some vendors' top setting is called "high").</li>
     <li><b>No dropping, no filling.</b> Every model stays as a row; missing values are n/r. No score is estimated or carried over from a different version.</li>
     <li><b>Independent vs self-reported.</b> Columns tagged INDEPENDENT or LEADERBOARD are third-party measurements. Terminal-Bench 4.0 is <b>SELF-REPORTED*</b> by vendors with their own harness and effort settings, so it is kept separate and is not comparable to the other columns.</li>
   </ul></details>
   <div class="toolbar"><div class="tgroup"><label class="tl" for="bm-lab">Lab</label><select id="bm-lab"><option value="all">All labs</option>${labs.map(l => `<option value="${esc(l)}">${esc(U.SHORT[l] || l)}</option>`).join('')}</select></div>
     <span class="d">Independent data: <a href="${esc(BM.sourceUrl)}" target="_blank" rel="noopener">${esc(BM.source)} ↗</a> · built ${esc(BM.builtLabel)} · column sources: ${BM.columns.filter(c => c.src).map(c => `<a href="${esc(c.src)}" target="_blank" rel="noopener">${esc(c.label)}</a>`).join(', ')}</span></div>
   <div class="tblwrap bm-wrap" id="bm-table"></div>
   <div class="d" style="margin:4px 0 14px">Highest value per column is outlined. ${esc(BM.excluded || '')}</div>`;
  root.querySelector('#bm-lab').onchange = e => { st.lab = e.target.value; draw(root); };
  draw(root);
}
window.BM = {render, state: st};
})();
