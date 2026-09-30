"""Print a picture's items still open in PROGRESS.md, with the proposal, the critic's verdict and the code sketch.
Usage: python .claude/art-refine/items.py <piece-key>"""
import json, re, sys
from pathlib import Path
H = Path(__file__).parent
piece = sys.argv[1]
done = set(re.findall(r"- \[x\] #\d+ \w+ v\d `([\w-]+)`", (H / "PROGRESS.md").read_text(encoding="utf-8")))
d = json.load(open(H / "items.json", encoding="utf-8"))
rank = {i["id"]: i for i in d["ranked"]["items"]}
for g in d["groups"]:
    V = {v["id"]: v for v in (g["critique"] or {}).get("verdicts", [])}
    for p in g["proposals"] + (g["critique"] or {}).get("missed", []):
        if p["piece"] != piece or p["id"] in done or p["id"] not in rank:
            continue
        it, v = rank[p["id"]], V.get(p["id"], {})
        print(f"===== #{it['rank']} {p['id']} [{v.get('verdict', 'critic-only')}] v{it['value']} {p['title']}")
        print("SEEN:", p["observed"][:500])
        print("PROPOSAL:", p["proposal"][:800])
        print("CODE:", p["code"][:1100])
        if v.get("revised_proposal"):
            print("REVISED:", v["revised_proposal"][:800])
        if v.get("reason"):
            print("CRITIC:", v["reason"][:500])
