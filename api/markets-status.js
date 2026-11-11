// GET /api/markets-status : public, non-sensitive freshness check for the daily refresh script (asOf only, no prices).
const SNAP = require('./_markets.json');
module.exports = (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=30');
  res.end(JSON.stringify({asOf: SNAP.asOf, asOfLabel: SNAP.asOfLabel, rows: (SNAP.rows || []).length}));
};
