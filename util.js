// Shared helpers + derived metrics for the AI Situation Room. Reads window.AID (X Posts' dataset, unmodified).
(function(){
const D = window.AID, U = {};
U.esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
U.fmtD = d => { if(!d) return ''; const p = String(d).slice(0,10).split('-'); if(p.length < 2 || isNaN(+p[1])) return String(d); return p.length === 3 ? `${MON[+p[1]-1]} ${+p[2]}, ${p[0]}` : `${MON[+p[1]-1]} ${p[0]}`; };
U.months = [];
for(let i = 0; i < 10; i++){ const y = 2026 + Math.floor((4+i)/12), mo = (4+i)%12; U.months.push({key:`${y}-${String(mo+1).padStart(2,'0')}`, label:`${MON[mo]} ${y}`, forecast: i > 6}); }
U.NOW = 6;
U.LABS = D.meta.labs_in_scope.map(id => D.labs[id]);
U.LABNAME = Object.fromEntries(U.LABS.map(l => [l.id, l.name]));
U.SHORT = {openai:'OpenAI',anthropic:'Anthropic',google_deepmind:'Google DeepMind',xai:'xAI (SpaceXSI)',meta:'Meta SL',mistral:'Mistral AI',deepseek:'DeepSeek',alibaba_qwen:'Alibaba / Qwen'};
U.isUnknown = v => v == null || (typeof v === 'string' && /^unknown\b/i.test(v.trim()));
U.pretty = s => String(s).replace(/_/g, ' ');
U.val = v => {
  if(v == null) return 'unknown';
  if(Array.isArray(v)) return v.map(U.val).join('; ');
  if(typeof v === 'object') return Object.entries(v).map(([k,x]) => `${U.pretty(k)}: ${typeof x === 'number' ? '$'+x : U.val(x)}`).join(' · ');
  return String(v);
};
U.src = (url, name, date) => {
  const d = date ? `<span class="d">${U.fmtD(date)}</span> ` : '';
  return url ? `${d}<a href="${U.esc(url)}" target="_blank" rel="noopener">${U.esc(name || 'source')} ↗</a>` : (d || '');
};
U.rep = q => q ? `<span class="rep" title="Reported by media, not confirmed by the company">${U.esc(String(q).toUpperCase())}</span>` : '';
U.fact = (f, label) => {
  if(!f) return '';
  const list = Array.isArray(f) ? f : [f];
  return list.map(x => {
    if(U.isUnknown(x.value)) return `<div class="fact unk">${label ? `<b>${U.esc(label)}:</b> ` : ''}<span class="unkb">UNKNOWN</span>${x.note ? ` <span class="d">— ${U.esc(x.note)}</span>` : ''}</div>`;
    return `<div class="fact">${label ? `<b>${U.esc(label)}:</b> ` : ''}${U.esc(U.val(x.value))}${U.rep(x.qualifier)}${x.note ? `<div class="d">${U.esc(x.note)}</div>` : ''}<div>${U.src(x.source_url, x.source_name, x.date)}</div></div>`;
  }).join('');
};
U.first = f => Array.isArray(f) ? f[0] : f;
U.flagship = l => l.models[0];

// ---------- derived activity heat ----------
const RX = {
  rel: /launch|introduc|releas|open weights|open-weight|preview|available|Grok \d|GPT|Claude|Gemini|Qwen|Muse|Llama|Mistral Large|V4/i,
  fund: /rais|fund|valuation|IPO|Series|invest|revenue|shares|acqui|earnings|stake|price range|listing/i,
  pol: /regulat|policy|government|\blaw\b|antitrust|AI Act|court|lawsuit|Pentagon|sanction|export control|senat|congress|ministry/i,
  tal: /\bhire|hiring|poach|talent|joins|depart|chief scientist|steps down|appoint/i
};
U.CATS = ['rel','fund','pol','tal'];
U.CATNAME = {overall:'Overall', rel:'Model releases', fund:'Funding', pol:'Policy/regulation', tal:'Talent'};
U.CATCOL = {rel:'#3ad1ff', fund:'#ffb020', pol:'#b07cff', tal:'#5bd6a5'};
const items = []; // {lab, date, cat:Set, text, url, src}
const add = (lab, date, text, url, src, cats) => { if(!date || !/^\d{4}-\d{2}/.test(date)) return; items.push({lab, date: date.slice(0,10), text, url, src, cats}); };
const classify = t => U.CATS.filter(c => RX[c].test(t));
D.timeline.forEach(t => add(t.lab, t.date, t.headline, t.source_url, t.source_name, classify(t.headline)));
U.LABS.forEach(l => {
  l.recent_news.forEach(n => add(l.id, n.date, n.headline, n.source_url, n.source_name, classify(n.headline)));
  l.models.forEach(m => { const r = m.release_date; if(r && !U.isUnknown(r.value) && r.date) add(l.id, r.date, `${m.name} release`, r.source_url, r.source_name, ['rel']); });
  Object.values(l.economics).forEach(e => (Array.isArray(e) ? e : [e]).forEach(f => { if(f && f.date && !U.isUnknown(f.value)) add(l.id, f.date, U.val(f.value), f.source_url, f.source_name, ['fund']); }));
});
U.items = items;
// de-duplicate per lab: the timeline and news lists often describe the same event in different words
const words = t => new Set(String(t).toLowerCase().match(/[a-z0-9$.]+/g) || []);
const uniq = []; 
items.slice().sort((x,y) => x.date.localeCompare(y.date)).forEach(it => {
  const w = words(it.text);
  const dup = uniq.find(o => o.lab === it.lab && o.date === it.date && [...w].filter(t => o.w.has(t)).length / Math.max(1, Math.min(w.size, o.w.size)) > 0.5);
  if(dup){ it.cats.forEach(c => { if(!dup.cats.includes(c)) dup.cats.push(c); }); return; }
  uniq.push(Object.assign({w}, it, {cats: it.cats.slice()}));
});
U.uniq = uniq;
U.labItems = (lab, m) => uniq.filter(it => it.lab === lab && it.date.startsWith(U.months[m].key));
U.labActivity = (lab, m) => U.months[m].forecast ? null : U.labItems(lab, m).length;
U.heatColor = (s, a) => {
  const stops = [[0,[13,42,69]],[2,[31,111,139]],[4,[244,211,94]],[6,[242,140,40]],[8,[230,57,70]],[10,[255,26,77]]];
  let i = 0; while(i < stops.length-2 && s > stops[i+1][0]) i++;
  const [s0,c0] = stops[i], [s1,c1] = stops[i+1], t = Math.max(0, Math.min(1, (s-s0)/(s1-s0)));
  const c = c0.map((v,k) => Math.round(v + (c1[k]-v)*t));
  return `rgba(${c[0]},${c[1]},${c[2]},${a})`;
};
U.bts = D.narrative_vs_reality;
U.btsBy = lab => U.bts.filter(b => b.lab === lab);
U.maxGap = lab => Math.max(0, ...U.btsBy(lab).map(b => b.gap_score));
U.fc = lab => (D.forecast.items_by_lab[lab] || []);
window.U = U;
})();
