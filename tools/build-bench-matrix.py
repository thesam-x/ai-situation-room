#!/usr/bin/env python3
"""Build data/bench-matrix.js: one row per model, one column per benchmark, same metric/setting per column.

Independent data: Epoch AI Benchmarking Hub (CC BY 4.0), https://epoch.ai/data/benchmark_data.zip (keyless).
  - Epoch-run columns use Epoch's own harness for every model (same prompts, scorer and settings).
  - External leaderboard columns (ARC-AGI-2, WebDev Arena) are collected by Epoch from the leaderboard owner.
Vendor data: Terminal-Bench 4.0 from the ASR dataset (data/ai-data.js), marked self-reported.
Parity rule: per model and column, use the highest reasoning-effort variant evaluated (max > xhigh > high > medium > low > minimal > none);
the effort used is stored per cell. Nothing is estimated: no match -> null -> shown as n/r.
"""
import csv, io, json, re, sys, zipfile, urllib.request, datetime
from pathlib import Path
from zoneinfo import ZoneInfo
ROOT = Path(__file__).resolve().parents[1]
CFG = json.loads((Path(__file__).parent / "bench-models.json").read_text())
URL = "https://epoch.ai/data/benchmark_data.zip"
z = zipfile.ZipFile(io.BytesIO(urllib.request.urlopen(urllib.request.Request(URL, headers={"User-Agent": "ai-situation-room/1.0"}), timeout=60).read()))
def rows(name): return list(csv.DictReader(io.TextIOWrapper(z.open(name), encoding="utf-8")))
EFF = ["max", "xhigh", "high", "medium", "low", "minimal", "none", "unknown", ""]
def eff(mv): return mv.split("_", 1)[1] if "_" in mv else ""
def rank(e): return EFF.index(e) if e in EFF else len(EFF)
def base(mv): return mv.split("_", 1)[0]

COLS = [
 # key, label, file, score col, kind, scale, setting text, column source url
 ("gpqa", "GPQA Diamond", "gpqa_diamond.csv", "mean_score", "independent", 100, "Epoch harness · mean accuracy across runs · no tools", "https://epoch.ai/benchmarks/gpqa-diamond"),
 ("aime", "OTIS Mock AIME 24–25", "otis_mock_aime_2024_2025.csv", "mean_score", "independent", 100, "Epoch harness · mean accuracy across runs", "https://epoch.ai/benchmarks/otis-mock-aime"),
 ("fm13", "FrontierMath T1–3", "frontiermath_tiers_1_3_v2.csv", "mean_score", "independent", 100, "Epoch harness · private v2 set · Epoch's standard tool setup", "https://epoch.ai/frontiermath"),
 ("fm4", "FrontierMath T4", "frontiermath_tier_4_v2.csv", "mean_score", "independent", 100, "Epoch harness · private Tier 4 v2 · Epoch's standard tool setup", "https://epoch.ai/frontiermath"),
 ("sqa", "SimpleQA Verified", "simpleqa_verified.csv", "mean_score", "independent", 100, "Epoch harness · mean accuracy · no web search", "https://epoch.ai/benchmarks/simpleqa-verified"),
 ("arc2", "ARC-AGI-2", "arc_agi_2_external.csv", "Score", "leaderboard", 100, "ARC Prize semi-private leaderboard (via Epoch)", "https://arcprize.org/leaderboard"),
 ("wda", "WebDev Arena", "webdev_arena_external.csv", "Arena Score", "leaderboard", 1, "LMArena WebDev Elo, human preference votes (via Epoch)", "https://web.lmarena.ai/leaderboard"),
]
data = {}
for key, label, fn, sc, kind, scale, setting, src in COLS:
    by = {}
    for r in rows(fn):
        mv = r.get("Model version") or ""
        if not mv or not (r.get(sc) or "").strip(): continue
        try: v = float(r[sc]) * scale
        except ValueError: continue
        b, e = base(mv), eff(mv)
        cell = {"v": round(v, 1), "eff": e or None, "date": (r.get("Started at") or r.get("Last updated") or "")[:10] or None,
                "src": r.get("Source link (site from table)") or src, "se": round(float(r["stderr"]) * scale, 1) if r.get("stderr") else None}
        old = by.get(b)
        if old is None or rank(e) < rank(old["eff"] or "") or (e == (old["eff"] or "") and v > old["v"]):
            by[b] = cell
    data[key] = by
eci = {r["Model"]: r for r in rows("epoch_capabilities_index/eci_scores.csv")}

s = (ROOT / "data" / "ai-data.js").read_text(); D = json.loads(s[s.index("{"): s.rindex("}") + 1])
tb = {}
for lab, l in D["labs"].items():
    for b in l["benchmarks"]:
        if b["benchmark"] == "Terminal-Bench 4.0" and "comparison" not in b["model"]:
            m = re.match(r"([\d.]+)%", b["score"] or "")
            if m: tb[b["model"]] = {"v": float(m.group(1)), "eff": None, "date": b["date"], "src": b["source_url"], "srcName": b["source_name"], "self": True}

out_rows = []
for r in CFG["rows"]:
    cells = {}
    for key, *_ in COLS:
        c = None
        for k in (r.get("epoch"), r.get("epoch_alt")):
            if k and k in data[key]: c = data[key][k]; break
        cells[key] = c
    e = eci.get(r.get("eci") or "")
    cells["eci"] = {"v": round(float(e["eci"]), 1), "lo": float(e["eci_ci_low"]) if e["eci_ci_low"] else None, "hi": float(e["eci_ci_high"]) if e["eci_ci_high"] else None, "date": e["date"], "src": "https://epoch.ai/benchmarks/eci"} if e and e.get("eci") else None
    cells["tb4"] = tb.get(r.get("tb") or "")
    out_rows.append({"lab": r["lab"], "model": r["model"], "cells": cells})

cols = [{"key": k, "label": l, "kind": kd, "unit": "%" if sc != 1 else "Elo", "setting": st, "src": src} for k, l, fn, scc, kd, sc, st, src in COLS]
cols.append({"key": "eci", "label": "Epoch ECI", "kind": "independent", "unit": "index", "setting": "Epoch Capabilities Index: composite of many benchmarks on one scale (not a percentage)", "src": "https://epoch.ai/benchmarks/eci"})
cols.append({"key": "tb4", "label": "Terminal-Bench 4.0", "kind": "self", "unit": "%", "setting": "Vendor-reported in release posts; harness and effort chosen by each vendor (not comparable to the columns above)", "src": None})
now = datetime.datetime.now(ZoneInfo("America/New_York"))
out = {"builtLabel": now.strftime("%b %-d, %Y, %-I:%M %p ET"), "source": "Epoch AI Benchmarking Hub (CC BY 4.0)", "sourceUrl": "https://epoch.ai/benchmarks",
       "columns": cols, "rows": out_rows, "excluded": CFG.get("excluded")}
(ROOT / "data" / "bench-matrix.js").write_text("// Generated by tools/build-bench-matrix.py. Do not edit by hand.\nwindow.BENCH_MATRIX = " + json.dumps(out, ensure_ascii=False) + ";\n")
filled = sum(1 for r in out_rows for c in r["cells"].values() if c)
print(f"rows {len(out_rows)} cols {len(cols)} filled {filled}/{len(out_rows)*len(cols)}")
for r in out_rows: print(f"{r['model'][:30]:30}", " ".join(f"{(str(c['v'])+(('/'+c['eff']) if c and c.get('eff') else '')) if c else 'n/r':>11}" for c in r["cells"].values()))
