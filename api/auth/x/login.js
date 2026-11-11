// GET /api/auth/x/login : start Sign in with X (OAuth 2.0 Authorization Code + PKCE, scopes users.read tweet.read).
const crypto = require('crypto');
const S = require('../../_session.js');
module.exports = (req, res) => {
  if(!S.configured()) return S.redirect(res, '/?v=markets&auth=unavailable');
  const state = S.b64u(crypto.randomBytes(24));
  const verifier = S.b64u(crypto.randomBytes(48));                       // 64 chars, RFC 7636 compliant
  const challenge = S.b64u(crypto.createHash('sha256').update(verifier).digest());
  const ret = /^\/[^/\\]/.test(String((req.query || {}).return || '')) ? String(req.query.return) : '/?v=markets';
  const tmp = S.sign({s: state, v: verifier, r: ret, exp: Math.floor(Date.now() / 1000) + 600});
  const p = new URLSearchParams({response_type: 'code', client_id: S.env('X_CLIENT_ID'), redirect_uri: S.redirectUri(req),
    scope: 'users.read tweet.read', state, code_challenge: challenge, code_challenge_method: 'S256'});
  S.redirect(res, `https://x.com/i/oauth2/authorize?${p.toString().replace(/\+/g, "%20")}`, [S.cookie(S.OAUTH_COOKIE, tmp, {maxAge: 600, path: '/api/auth/x'})]);
};
