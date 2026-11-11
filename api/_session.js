// Shared helpers for Sign in with X (not a route: files starting with "_" are not exposed by Vercel).
// Session = signed cookie (HMAC-SHA256 with SESSION_SECRET). No tokens are stored; only the X user id, handle and name.
const crypto = require('crypto');
const SESSION_COOKIE = 'asr_session', OAUTH_COOKIE = 'asr_oauth';
const SESSION_DAYS = 7;
const b64u = buf => Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64u = s => Buffer.from(String(s).replace(/-/g, '+').replace(/_/g, '/'), 'base64');
// Trim env values (and surrounding quotes/BOM). Vercel dashboard pastes can include a trailing newline, which breaks X Basic auth.
function env(name){
  let v = process.env[name];
  if(v == null) return '';
  v = String(v).replace(/^\uFEFF/, '').trim();
  if(v.length >= 2 && ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'")))) v = v.slice(1, -1).trim();
  return v;
}
function envInfo(){
  const info = k => {
    if(process.env[k] == null) return {present: false};
    const raw = String(process.env[k]);
    const val = env(k);
    const stripped = raw.replace(/^\uFEFF/, '');
    return {present: true, len: val.length, whitespace: raw !== stripped.trim() || raw.charCodeAt(0) === 0xFEFF, quoted: val.length !== stripped.trim().length};
  };
  return {X_CLIENT_ID: info('X_CLIENT_ID'), X_CLIENT_SECRET: info('X_CLIENT_SECRET'), SESSION_SECRET: info('SESSION_SECRET'), X_REDIRECT_URI: info('X_REDIRECT_URI')};
}
const configured = () => !!(env('X_CLIENT_ID') && env('X_CLIENT_SECRET') && env('SESSION_SECRET') && env('SESSION_SECRET').length >= 32);
function sign(obj){
  const body = b64u(JSON.stringify(obj));
  const mac = b64u(crypto.createHmac('sha256', env('SESSION_SECRET')).update(body).digest());
  return `${body}.${mac}`;
}
function verify(token){
  if(!token || !env('SESSION_SECRET')) return null;
  const [body, mac] = String(token).split('.');
  if(!body || !mac) return null;
  const want = b64u(crypto.createHmac('sha256', env('SESSION_SECRET')).update(body).digest());
  const a = Buffer.from(mac), b = Buffer.from(want);
  if(a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try { const obj = JSON.parse(unb64u(body).toString('utf8')); if(!obj.exp || obj.exp < Math.floor(Date.now() / 1000)) return null; return obj; } catch(e){ return null; }
}
function cookies(req){
  const out = {}; String(req.headers.cookie || '').split(/;\s*/).forEach(p => { const i = p.indexOf('='); if(i > 0) out[p.slice(0, i)] = decodeURIComponent(p.slice(i + 1)); });
  return out;
}
function cookie(name, value, {maxAge, path = '/'} = {}){
  return `${name}=${encodeURIComponent(value)}; Path=${path}; HttpOnly; Secure; SameSite=Lax${maxAge != null ? `; Max-Age=${maxAge}` : ''}`;
}
function session(req){ return configured() ? verify(cookies(req)[SESSION_COOKIE]) : null; }
function origin(req){
  let host = String(req.headers['x-forwarded-host'] || req.headers.host || '');
  host = host.split(',')[0].trim().toLowerCase().replace(/\.$/, '').replace(/:(?:443|80)$/, '');
  const proto = String(req.headers['x-forwarded-proto'] || 'https').split(',')[0].trim().toLowerCase() || 'https';
  return `${proto}://${host}`;
}
function redirectUri(req){ return env('X_REDIRECT_URI') || `${origin(req)}/api/auth/x/callback`; }
function send(res, status, obj, headers = {}){
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'private, no-store');
  Object.entries(headers).forEach(([k, v]) => res.setHeader(k, v));
  res.end(JSON.stringify(obj));
}
function redirect(res, location, setCookies = []){
  res.statusCode = 302; res.setHeader('Location', location); res.setHeader('Cache-Control', 'private, no-store');
  if(setCookies.length) res.setHeader('Set-Cookie', setCookies);
  res.end();
}
module.exports = {SESSION_COOKIE, OAUTH_COOKIE, SESSION_DAYS, b64u, env, envInfo, configured, sign, verify, cookies, cookie, session, origin, redirectUri, send, redirect};
