#!/usr/bin/env python3
"""Refresh data/markets.js for the AI Situation Room Markets tab.

Source: Yahoo Finance public, keyless JSON endpoints (no API key, no login):
  - /v8/finance/chart/<SYM>?range=1y&interval=1d   -> price, day change %, 1-year closes
  - /ws/fundamentals-timeseries/.../timeseries/<SYM>?type=trailingMarketCap -> latest reported market cap (+ its date)
  - /v8/finance/chart/<CCY>=X                       -> FX to convert non-USD market caps to USD for tiering
Nothing is estimated: any value that cannot be fetched is written as null and shown as a dash.

Usage:  python3 tools/refresh-markets.py            (writes data/markets.js next to index.html)
Daily:  cron, e.g.  30 17 * * 1-5  cd /path/site-tw && python3 tools/refresh-markets.py && <deploy>
"""
from __future__ import annotations
import json, time, datetime, urllib.request, urllib.parse, sys
from pathlib import Path
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parents[1]
UNIV = json.loads((Path(__file__).parent / "markets-universe.json").read_text())
UA = {"User-Agent": "Mozilla/5.0 (compatible; ai-situation-room-refresh/1.0)"}
ET = ZoneInfo("America/New_York")

def get(url, tries=3):
    for i in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=20) as r:
                return json.loads(r.read().decode())
        except Exception as e:
            err = e; time.sleep(1.5 * (i + 1))
    print(f"  ! {url[:90]} -> {err}", file=sys.stderr); return None

def chart(sym):
    j = get(f"https://query1.finance.yahoo.com/v8/finance/chart/{urllib.parse.quote(sym)}?range=1y&interval=1d")
    try: res = j["chart"]["result"][0]
    except Exception: return None
    m = res["meta"]; closes = [c for c in (res.get("indicators", {}).get("quote", [{}])[0].get("close") or []) if c is not None]
    price = m.get("regularMarketPrice")
    day = m.get("regularMarketChangePercent")
    if day is None and price and len(closes) >= 2: day = (price / closes[-2] - 1) * 100
    y1 = (price / closes[0] - 1) * 100 if price and closes and len(closes) > 200 else None
    return {"name": m.get("longName") or m.get("shortName"), "price": price, "currency": m.get("currency"),
            "day_pct": day, "y1_pct": y1, "exchange": m.get("fullExchangeName"), "time": m.get("regularMarketTime")}

def mcap(sym):
    p2 = int(time.time()); p1 = p2 - 45 * 86400
    j = get(f"https://query1.finance.yahoo.com/ws/fundamentals-timeseries/v1/finance/timeseries/{urllib.parse.quote(sym)}?type=trailingMarketCap&period1={p1}&period2={p2}")
    try:
        pts = [p for p in j["timeseries"]["result"][0]["trailingMarketCap"] if p]
        last = pts[-1]; return {"value": last["reportedValue"]["raw"], "currency": last.get("currencyCode") or "USD", "date": last.get("asOfDate")}
    except Exception: return None

FX = {}
def to_usd(v, ccy):
    if v is None: return None
    if not ccy or ccy == "USD": return v
    if ccy not in FX:
        c = chart(f"{ccy}=X"); FX[ccy] = c["price"] if c and c.get("price") else None   # units of ccy per 1 USD
    return v / FX[ccy] if FX.get(ccy) else None

TIERS = [(1e12, ">$1T"), (5e11, "$500B–1T"), (1e11, "$100–500B"), (5e10, "$50–100B"), (1e10, "$10–50B"), (1e9, "$1–10B"), (0, "<$1B")]
def tier(v):
    if v is None: return None
    return next(lbl for lim, lbl in TIERS if v >= lim)

rows, missing = [], []
for sym, seg in UNIV["tickers"]:
    c = chart(sym); m = mcap(sym); time.sleep(0.25)
    cap_usd = to_usd(m["value"], m["currency"]) if m else None
    row = {"t": sym, "seg": seg, "name": (c or {}).get("name"), "price": (c or {}).get("price"), "ccy": (c or {}).get("currency"),
           "day": (c or {}).get("day_pct"), "y1": (c or {}).get("y1_pct"), "cap": cap_usd, "capLocal": m["value"] if m else None,
           "capCcy": m["currency"] if m else None, "capDate": m["date"] if m else None, "tier": tier(cap_usd),
           "ex": (c or {}).get("exchange"), "mt": (c or {}).get("time"), "note": UNIV.get("notes", {}).get(sym),
           "url": f"https://finance.yahoo.com/quote/{urllib.parse.quote(sym)}/"}
    gaps = [k for k in ("price", "day", "y1", "cap") if row[k] is None]
    if gaps: missing.append({"t": sym, "missing": gaps})
    rows.append(row); print(f"{sym:10} {seg:9} price={row['price']} day={row['day'] and round(row['day'],2)} y1={row['y1'] and round(row['y1'],1)} cap={row['cap'] and round(row['cap']/1e9,1)}B {row['tier']}")

now = datetime.datetime.now(ET)
us_times = [r["mt"] for r in rows if r.get("mt") and r.get("ccy") == "USD"]
mkt = datetime.datetime.fromtimestamp(max(us_times), ET) if us_times else None
out = {"asOf": now.isoformat(timespec="minutes"), "asOfLabel": now.strftime("%b %-d, %Y, %-I:%M %p ET"),
       "pricesAsOfLabel": mkt.strftime("%b %-d, %Y, %-I:%M %p ET") if mkt else None,
       "source": "Yahoo Finance (public chart and fundamentals-timeseries endpoints, delayed)",
       "segments": UNIV["segments"], "tiers": [lbl for _, lbl in TIERS], "fx": FX, "rows": rows, "missing": missing,
       "unicorns": UNIV["unicorns"], "unicornNotes": UNIV.get("unicorn_notes", [])}
(ROOT / "data" / "markets.js").write_text("// Generated by tools/refresh-markets.py. Do not edit by hand.\nwindow.MARKETS = " + json.dumps(out, ensure_ascii=False, indent=0) + ";\n")
print(f"\nwrote data/markets.js: {len(rows)} tickers, {len(missing)} with gaps, as of {out['asOfLabel']}")
for m in missing: print("  gap:", m)
