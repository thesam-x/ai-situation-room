// GET or POST /api/auth/logout : clear the session cookie. GET redirects home; POST returns JSON.
const S = require('../_session.js');
module.exports = (req, res) => {
  const clear = S.cookie(S.SESSION_COOKIE, '', {maxAge: 0});
  if(req.method === 'POST') return S.send(res, 200, {signedIn: false}, {'Set-Cookie': clear});
  S.redirect(res, '/', [clear]);
};
