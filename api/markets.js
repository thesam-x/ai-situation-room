// GET /api/markets : the daily Markets snapshot (same content as data/markets.js), signed-in users only.
const S = require('./_session.js');
const SNAP = require('./_markets.json');               // written by tools/refresh-markets.py
module.exports = (req, res) => {
  if(!S.session(req)) return S.send(res, 401, {error: 'sign in required', configured: S.configured()});
  S.send(res, 200, SNAP, {'Cache-Control': 'private, max-age=300'});
};
