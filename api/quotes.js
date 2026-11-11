// GET /api/quotes : live (delayed) quotes for the Markets tab tickers.
// Source: Yahoo Finance public spark endpoint (no key, no login), max 20 symbols per request, fetched in parallel batches.
// Returns local price, USD price (via Yahoo FX), day % change vs previous close, and the quote time.
// Signed-in users only (401 otherwise). Because the response is per-user gated, it is NOT cached at the shared CDN;
// instead each warm function instance keeps the last upstream result for 60s. No secrets are used or stored.
const S = require('./_session.js');
const TICKERS = require('./_tickers.json');          // [[symbol, currency], ...] written by tools/refresh-markets.py
const BATCH = 20, TIMEOUT_MS = 4000;
const UA = 'Mozilla/5.0 (compatible; ai-situation-room-quotes/1.0)';

async function spark(symbols){
  const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), TIMEOUT_MS);
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/spark?symbols=${symbols.map(encodeURIComponent).join(',')}&range=1d&interval=5m`;
    const r = await fetch(url, {headers: {'User-Agent': UA, 'Accept': 'application/json'}, signal: ctl.signal});
    if(!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.json();
  } finally { clearTimeout(t); }
}
function last(v){
  if(!v || !Array.isArray(v.close)) return null;
  for(let i = v.close.length - 1; i >= 0; i--) if(v.close[i] != null) return {p: v.close[i], t: (v.timestamp || [])[i] || null, prev: v.chartPreviousClose ?? v.previousClose ?? null};
  return null;
}
let CACHE = null;   // {at, body}: per-instance 60s cache
const TTL_MS = 60000;
module.exports = async (req, res) => {
  if(!S.session(req)) return S.send(res, 401, {error: 'sign in required', configured: S.configured()});
  if(CACHE && Date.now() - CACHE.at < TTL_MS){
    res.setHeader('Content-Type', 'application/json; charset=utf-8'); res.setHeader('Cache-Control', 'private, max-age=30'); res.setHeader('X-ASR-Cache', 'HIT');
    return res.end(JSON.stringify(Object.assign({}, CACHE.body, {cached: true, ageMs: Date.now() - CACHE.at})));
  }
  const t0 = Date.now();
  const ccys = [...new Set(TICKERS.map(([, c]) => c).filter(c => c && c !== 'USD'))];
  const syms = [...TICKERS.map(([s]) => s), ...ccys.map(c => `${c}=X`)];
  const batches = []; for(let i = 0; i < syms.length; i += BATCH) batches.push(syms.slice(i, i + BATCH));
  const results = await Promise.allSettled(batches.map(spark));
  const raw = {}; let failed = 0;
  results.forEach(r => { if(r.status === 'fulfilled' && r.value && typeof r.value === 'object') Object.assign(raw, r.value); else failed++; });
  const fx = {}; ccys.forEach(c => { const q = last(raw[`${c}=X`]); if(q && q.p) fx[c] = q.p; });   // units of currency per 1 USD
  const quotes = {}; let newest = 0;
  TICKERS.forEach(([s, c]) => { const q = last(raw[s]); if(!q || q.p == null) return;
    const d = q.prev ? (q.p / q.prev - 1) * 100 : null;
    const usd = !c || c === 'USD' ? q.p : (fx[c] ? q.p / fx[c] : null);
    quotes[s] = {p: q.p, ccy: c || 'USD', pUsd: usd == null ? null : Math.round(usd * 1e4) / 1e4, d: d == null ? null : Math.round(d * 1e3) / 1e3, t: q.t};
    if(q.t && (!c || c === 'USD')) newest = Math.max(newest, q.t); });
  const body = {source: 'Yahoo Finance spark (public, delayed)', fetchedAt: new Date().toISOString(), usLastTradeTime: newest || null,
    count: Object.keys(quotes).length, of: TICKERS.length, batches: batches.length, failedBatches: failed, ms: Date.now() - t0, fx, quotes};
  const ok = body.count > 0;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', ok ? 'private, max-age=30' : 'no-store');
  res.setHeader('X-ASR-Cache', 'MISS');
  if(ok) CACHE = {at: Date.now(), body};
  res.statusCode = ok ? 200 : 502;
  res.end(JSON.stringify(ok ? body : {error: 'upstream unavailable', failedBatches: failed, ms: body.ms}));
};
