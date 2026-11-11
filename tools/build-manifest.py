#!/usr/bin/env python3
"""Build a Vercel upload manifest from the AI Situation Room static root.

Excludes shots/, tools/, build.py, and any .zip. Writes SHA1, size, and base64
payloads so a later create_deployment can reference each file by sha+size.

Usage:
  python3 tools/build-manifest.py
  python3 tools/build-manifest.py --src . --out /tmp/asr-upload
"""
from __future__ import annotations
import argparse, base64, hashlib, json
from pathlib import Path

EXCLUDE_DIRS = {"shots", "tools"}
EXCLUDE_SUFFIXES = {".zip"}
EXCLUDE_NAMES = {"build.py", "README.txt"}   # README.txt = internal maintainer notes
# The Markets snapshot is served to signed-in users by /api/markets (api/_markets.json), so the static copy is not deployed.
EXCLUDE_PATHS = {"data/markets.js"}

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", default=str(Path(__file__).resolve().parents[1]))
    ap.add_argument("--out", default="/tmp/asr-upload")
    args = ap.parse_args()
    root = Path(args.src).resolve()
    outdir = Path(args.out)
    outdir.mkdir(parents=True, exist_ok=True)
    # clean previous b64
    for old in outdir.glob("*.b64"):
        old.unlink()
    files = []
    for p in sorted(root.rglob("*")):
        if not p.is_file():
            continue
        rel = p.relative_to(root)
        if any(part in EXCLUDE_DIRS for part in rel.parts):
            continue
        if p.suffix.lower() in EXCLUDE_SUFFIXES:
            continue
        if p.name in EXCLUDE_NAMES or rel.as_posix() in EXCLUDE_PATHS:
            continue
        data = p.read_bytes()
        sha1 = hashlib.sha1(data).hexdigest()
        b64_path = outdir / (str(rel).replace("/", "__") + ".b64")
        b64_path.write_bytes(base64.b64encode(data))
        files.append({
            "file": str(rel),
            "sha": sha1,
            "size": len(data),
            "b64": str(b64_path),
        })
        print(f"{rel}\t{sha1}\t{len(data)}")
    manifest = outdir / "manifest.json"
    manifest.write_text(json.dumps(files, indent=2))
    print(f"Wrote {manifest}  files={len(files)}  bytes={sum(f['size'] for f in files)}")

if __name__ == "__main__":
    main()
