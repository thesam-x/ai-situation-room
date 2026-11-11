// GET /api/auth/me : {configured, signedIn, user}. Never cached.
const S = require('../_session.js');
module.exports = (req, res) => {
  const s = S.session(req);
  const user = s ? {id: s.sub || null, username: s.u || null, name: s.n || 'X user', profile: s.p !== false} : null;
  S.send(res, 200, {configured: S.configured(), signedIn: !!s, user});
};
