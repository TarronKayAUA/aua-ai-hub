"""Writes PROGRESS.md from items.json the first time; afterwards PROGRESS.md is edited by hand (tick [x] per item)."""
import json
from pathlib import Path
H = Path(__file__).parent
d = json.load(open(H / "items.json", encoding="utf-8"))
items = d["ranked"]["items"]
ORDER = ["campus-hero", "shirley-heights", "curtain-bluff", "sailing-week", "lamp-steps", "library", "telescope", "tool-wall",
         "prompt-desk", "bell-tower", "dish-net", "lecture-hall", "hospital-room", "week-calendar", "committee-room", "way-in",
         "bettys-hope", "court-house", "st-johns-harbour"]
by = {}
for it in items:
    by.setdefault(it["piece"].split("+")[0], []).append(it)
out = ["# Art refinement pass: progress", "",
       "Branch `art-refine`, started 2026-09-30. Delete this folder (`.claude/art-refine/`) before merging to main.", "",
       "## How to resume", "",
       "1. `git checkout art-refine` and read this file. Every ticked item is committed and verified; the working tree",
       "   should be clean between pictures (if not, the last picture was interrupted: `git diff` shows it, finish or",
       "   `git checkout -- .` it).",
       "2. Full detail of every item (what, where, the code sketch, the critic's verdict) is in `items.json`: `ranked.items`",
       "   (by rank) and `groups[].proposals` / `groups[].critique`. The owner's picking page and the renders were in the",
       "   session scratchpad (`artpass/`), which may be gone; regenerate renders with scripts/art_review.py if needed.",
       "3. Per picture: make its items, then `node --check`, strict build, NaN scan of the drawn attributes, before/after",
       "   renders in the five versions (1920 and 1440), pixel identity of every other picture, commit, tick here.",
       "",
       "## Owner's decisions (2026-09-30)", "",
       "- #18 Curtain Bluff: he lives near Turtle Bay and sees the whole of Montserrat on clear days. If re-aiming the view",
       "  to show Montserrat makes it better or more iconic, reframe; if not, change the caption to Nevis (his yes on the",
       "  wording is still needed; data/art_slots.yaml is his). The Day version looks plain next to the others (\"could use",
       "  some additional pizzazz\"); the reframe may be the answer, else propose other ideas.",
       "- #49 and #79 (campus tower roof, flanking roofs): stage side by side for him to decide; he finds the tower a little",
       "  flat next to the other buildings. Perspective changes must be checked for accuracy; texture changes are fine.",
       "- #5 (yacht lights follow the heeled rig, green light removed): yes, an important accuracy change.",
       "- Everything else: the implementer's judgement; \"most if not all of them make sense\". His rule: if a picture already",
       "  looks good and is instantly identifiable, a change made only to match reality is not necessarily warranted;",
       "  changes for accurate perspective, size and texture are generally fine and approved.",
       "- He must be able to stop and resume cleanly (he leaves campus around 17:00 local on 2026-09-30).",
       "", "## Items", ""]
for key in ORDER:
    lst = sorted(by.get(key, []), key=lambda i: i["rank"])
    out.append(f"### {key}")
    out.append("")
    for it in lst:
        tag = "fix" if it["kind"] == "correction" else "add"
        hold = " (HOLD: owner decision, see above)" if it["rank"] in (18, 49, 79) else ""
        out.append(f"- [ ] #{it['rank']} {tag} v{it['value']} `{it['id']}`: {it['title']}{hold}")
    out.append("")
(H / "PROGRESS.md").write_text("\n".join(out), encoding="utf-8", newline="\n")
print("items:", len(items), "written")
