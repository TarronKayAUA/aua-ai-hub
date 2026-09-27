"""Handoff round: every file and function named in DESIGN.md exists.

  python _round/c/names_check.py

Files: every backticked or bare path under scripts/, docs/, data/, includes/,
overrides/ (and mkdocs.yml, SPEC.md, CLAUDE.md) must exist. Functions and
constants: every backticked `_name` or `name()` or UPPER_CASE, and each
`name` given with a file in the same table row or sentence, must be defined
(def, assignment or JS var/function) in some file under scripts/ or
docs/javascripts/, or be a CSS class/custom property in docs/stylesheets/.
"""
import re
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
text = (REPO / "DESIGN.md").read_text(encoding="utf-8")

paths = set(re.findall(r"(?<![\w/.-])((?:scripts|docs|data|includes|overrides)/[\w./-]+[\w])", text))
paths |= {p for p in ("mkdocs.yml", "SPEC.md", "CLAUDE.md") if p in text}
bad = []
for p in sorted(paths):
    p = p.rstrip(".")
    if "<" in p or "*" in p:
        continue
    target = REPO / p
    if not target.exists() and not any(REPO.glob(p + "*")):
        bad.append(f"path {p}")

code = "\n".join(f.read_text(encoding="utf-8", errors="replace")
                 for f in list((REPO / "scripts").rglob("*.py")) + list((REPO / "docs/javascripts").glob("*.js"))
                 + [REPO / "mkdocs.yml"] + list((REPO / "data").glob("*.yaml")))
css = "\n".join(f.read_text(encoding="utf-8") for f in (REPO / "docs/stylesheets").glob("*.css"))
names = set()
for tok in re.findall(r"`([^`\n]+)`", text):
    tok = tok.strip()
    m = re.fullmatch(r"([A-Za-z_][\w]*)(\(\))?", tok)
    if not m:
        continue
    name = m.group(1)
    if m.group(2) or "_" in name or re.fullmatch(r"[A-Z][A-Z0-9_]{2,}", name):
        names.add(name)
defined = 0
for n in sorted(names):
    pat = rf"(def {n}\b|^\s*{n}\s*[:=]|^{n}\s*[:=]|var {n}\b|function {n}\b|\b{n}\s*=)"
    if re.search(pat, code, re.M):
        defined += 1
    else:
        bad.append(f"name {n}")

classes = set(re.findall(r"`\.([a-z][\w-]*)", text)) | set(re.findall(r"`(--[a-z][\w-]*)", text))
for c in sorted(classes):
    if c.startswith("--"):
        ok = c in css or c.replace("<token>", "") in css
    else:
        ok = re.search(rf"\.{re.escape(c)}\b", css) or c in code
    if not ok:
        bad.append(f"css {c}")

print(f"names_check: {len(paths)} paths, {len(names)} code names ({defined} defined), {len(classes)} CSS names; "
      f"{len(bad)} missing")
for b in bad:
    print("  missing: " + b)
sys.exit(1 if bad else 0)
