// GET /api/auth/x/callback : finish Sign in with X. Exchanges the code (PKCE), reads the user, sets a signed session cookie.
// The X access token is used once to read /2/users/me and is not stored.
const S = require('../../_session.js');
const TIMEOUT_MS = 10000;
const PROFILE_FALLBACK = new Set([401, 402, 403, 429]);
function xErr(j){
  const out = {};
  if(!j || typeof j !== 'object') return out;
  const pick = obj => {
    if(!obj || typeof obj !== 'object') return;
    for(const k of ['error', 'error_description', 'error_uri', 'title', 'type', 'detail', 'reason', 'required_enrollment']){
      if(out[k]) continue;
      const v = obj[k];
      if(typeof v === 'string' && v) out[k] = v.slice(0, 300);
    }
  };
  pick(j);
  if(Array.isArray(j.errors)) j.errors.slice(0, 3).forEach(pick);
  return out;
}
async function call(url, opts){
  const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), TIMEOUT_MS);
  try {
    const r = await fetch(url, Object.assign({signal: ctl.signal}, opts));
    const j = await r.json().catch(() => ({}));
    return {ok: r.ok, status: r.status, j};
  }
  finally { clearTimeout(t); }
}
module.exports = async (req, res) => {
  const clear = S.cookie(S.OAUTH_COOKIE, '', {maxAge: 0, path: '/api/auth/x'});
  const fail = why => S.redirect(res, `/?v=markets&auth=${encodeURIComponent(why)}`, [clear]);
  if(!S.configured()) return fail('unavailable');
  const q = req.query || {};
  if(q.error) return fail('denied');
  const tmp = S.verify(S.cookies(req)[S.OAUTH_COOKIE]);
  if(!tmp || !q.state || q.state !== tmp.s || !q.code) return fail('state');
  try {
    const client_id = S.env('X_CLIENT_ID'), client_secret = S.env('X_CLIENT_SECRET');
    const redirect_uri = S.redirectUri(req);
    const basic = Buffer.from(`${client_id}:${client_secret}`).toString('base64');
    const tok = await call('https://api.x.com/2/oauth2/token', {method: 'POST',
      headers: {'Content-Type': 'application/x-www-form-urlencoded', 'Authorization': `Basic ${basic}`},
      body: new URLSearchParams({grant_type: 'authorization_code', code: String(q.code), redirect_uri, code_verifier: tmp.v, client_id}).toString()});
    if(!tok.ok || !tok.j.access_token){
      console.error('asr_auth_token_failed', JSON.stringify({status: tok.status, ...xErr(tok.j), redirect_uri, creds: S.envInfo()}));
      return fail('token');
    }
    const me = await call('https://api.x.com/2/users/me', {headers: {'Authorization': `Bearer ${tok.j.access_token}`}});
    const u = me.j && me.j.data;
    const now = Math.floor(Date.now() / 1000);
    const exp = now + S.SESSION_DAYS * 86400;
    const setSession = payload => S.redirect(res, tmp.r || '/?v=markets', [clear, S.cookie(S.SESSION_COOKIE, S.sign(payload), {maxAge: S.SESSION_DAYS * 86400})]);
    if(me.ok && u && u.id) return setSession({sub: u.id, u: u.username, n: u.name, p: true, iat: now, exp});
    const fallback = PROFILE_FALLBACK.has(me.status);
    console.error('asr_auth_profile_failed', JSON.stringify({status: me.status, ...xErr(me.j), fallback}));
    if(fallback) return setSession({sub: null, u: null, n: 'X user', p: false, iat: now, exp});
    return fail('profile');
  } catch(e){
    console.error('asr_auth_callback_error', e && e.name ? e.name : 'error');
    return fail('error');
  }
};
