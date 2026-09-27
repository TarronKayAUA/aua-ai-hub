"""Week round: the news narration's spoken text is unchanged.

  python _round/c/narration_proof.py <base-commit>

Runs scripts/narrate.py's own extraction (news_targets: every section
brief on the news pages, plus the newest digest's week in brief) on the
working tree and on a checkout of <base-commit>, and compares the texts,
slug by slug. The extraction reads docs/news/*.md, which this round never
edits; this shows it.
"""
import hashlib
import subprocess
import sys
import tempfile
from pathlib import Path

base = sys.argv[1]
CODE = ("import sys, json; sys.path.insert(0, 'scripts'); import narrate; "
        "print(json.dumps([[s, t] for s, _, t in narrate.news_targets()]))")


def targets(root):
    out = subprocess.run([sys.executable, "-c", CODE], cwd=root, capture_output=True, text=True, check=True)
    import json
    return dict(json.loads(out.stdout.strip().splitlines()[-1]))


now = targets(".")
with tempfile.TemporaryDirectory() as tmp:
    subprocess.run(["git", "worktree", "add", "-q", "--detach", tmp, base], check=True)
    try:
        before = targets(tmp)
    finally:
        subprocess.run(["git", "worktree", "remove", "--force", tmp], check=True)
ok = now == before
for slug in sorted(set(now) | set(before)):
    a, b = before.get(slug, ""), now.get(slug, "")
    print(f"  {slug:45s} {'same' if a == b else 'DIFFERENT'}  sha256 {hashlib.sha256(b.encode()).hexdigest()[:16]}  {len(b)} chars")
print("narration_proof: " + ("identical" if ok else "CHANGED"))
sys.exit(0 if ok else 1)
